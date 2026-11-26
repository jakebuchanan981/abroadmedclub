import { z } from "zod";
import {
  accountTripSchema,
  communityMatchesInputSchema,
  createTripSchema,
  deleteTripSchema,
  importTripsSchema,
  updateTripSchema,
} from "../src/travel/schemas";
import { legacyDestinationPlaces } from "../src/travel/planning";
import type { AccountTrip, TripInput } from "../src/travel/types";
import { parseInput, requireActor, type DomainContext } from "./domain";
import { audit, db, decrypt, encrypt } from "./storage";
import { ApiError } from "./validation";
import { communityMatchesForTrip } from "./community";

db.exec(`
CREATE TABLE IF NOT EXISTS travel_trips (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS travel_trips_owner ON travel_trips(user_id, updated_at, id);
CREATE TABLE IF NOT EXISTS travel_imports (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  legacy_id TEXT NOT NULL,
  trip_id TEXT REFERENCES travel_trips(id) ON DELETE SET NULL,
  PRIMARY KEY(user_id, legacy_id)
);
`);

type TripRow = {
  id: string;
  user_id: string;
  payload: string;
  updated_at: string;
};
function decodeTrip(row: TripRow): AccountTrip {
  const trip = accountTripSchema.parse(
    decrypt<unknown>(row.payload, `travel:${row.id}:${row.user_id}`),
  );
  if (trip.id !== row.id || trip.updatedAt !== row.updated_at)
    throw new Error("Invalid stored trip revision.");
  return trip;
}
function ownTrip(id: string, userId: string): AccountTrip {
  const row = db
    .query<
      TripRow,
      [string, string]
    >("SELECT * FROM travel_trips WHERE id = ? AND user_id = ?")
    .get(id, userId);
  if (!row)
    throw new ApiError(
      404,
      "This account trip was not found. Refresh your trips.",
    );
  return decodeTrip(row);
}
function insertTrip(
  userId: string,
  input: TripInput,
  checklist: AccountTrip["checklist"] = {},
): AccountTrip {
  const now = new Date().toISOString();
  const trip = accountTripSchema.parse({
    ...input,
    checklist,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  });
  db.query(
    "INSERT INTO travel_trips (id, user_id, payload, updated_at) VALUES (?, ?, ?, ?)",
  ).run(
    trip.id,
    userId,
    encrypt(trip, `travel:${trip.id}:${userId}`),
    trip.updatedAt,
  );
  audit(userId, "travel.create", trip.id);
  return trip;
}

export function travelApi(
  request: Request,
  path: string,
  context: DomainContext,
): Response {
  const actor = requireActor(context);
  const method = request.method;
  if (path === "/travel/trips" && method === "GET") {
    const rows = db
      .query<
        TripRow,
        [string]
      >("SELECT * FROM travel_trips WHERE user_id = ? ORDER BY updated_at DESC, id DESC")
      .all(actor.id);
    return Response.json({ items: rows.map(decodeTrip) });
  }
  if (path === "/travel/community-matches" && method === "POST") {
    const input = parseInput(communityMatchesInputSchema, context.body);
    const trip = ownTrip(input.tripId, actor.id);
    return Response.json(
      communityMatchesForTrip(actor, trip, input.scope, input.cursor),
    );
  }
  if (path === "/travel/trips" && method === "POST") {
    const { consent: _consent, ...input } = parseInput(
      createTripSchema,
      context.body,
    );
    const trip = db.transaction(() => insertTrip(actor.id, input))();
    return Response.json(trip, { status: 201 });
  }
  if (path === "/travel/import" && method === "POST") {
    const input = parseInput(importTripsSchema, context.body);
    const receipt = db.transaction(() => {
      let createdCount = 0;
      let existingCount = 0;
      const items = input.trips.map((legacy) => {
        const existing = db
          .query<
            { trip_id: string | null },
            [string, string]
          >("SELECT trip_id FROM travel_imports WHERE user_id = ? AND legacy_id = ?")
          .get(actor.id, legacy.id);
        if (existing) {
          if (!existing.trip_id)
            throw new ApiError(
              409,
              "A selected local plan was already copied and its account copy was deleted. It will not be silently recreated. Copy other local plans individually, or create a new account plan.",
            );
          existingCount += 1;
          return ownTrip(existing.trip_id, actor.id);
        }
        const place = legacyDestinationPlaces[legacy.destinationId];
        const trip = insertTrip(
          actor.id,
          {
            ...place,
            startsOn: legacy.startsOn,
            endsOn: legacy.endsOn,
            mode: legacy.mode,
          },
          legacy.checklist,
        );
        db.query(
          "INSERT INTO travel_imports (user_id, legacy_id, trip_id) VALUES (?, ?, ?)",
        ).run(actor.id, legacy.id, trip.id);
        createdCount += 1;
        return trip;
      });
      return { items, createdCount, existingCount };
    })();
    return Response.json(receipt);
  }
  const match = /^\/travel\/trips\/([^/]+)$/.exec(path);
  if (!match) throw new ApiError(404, "Travel route not found.");
  const id = parseInput(z.string().uuid(), match[1]);
  if (method === "GET") return Response.json(ownTrip(id, actor.id));
  if (method === "PATCH") {
    const input = parseInput(updateTripSchema, context.body);
    const trip = db.transaction(() => {
      const current = ownTrip(id, actor.id);
      if (current.updatedAt !== input.expectedUpdatedAt)
        throw new ApiError(
          409,
          "This trip changed on another device. Your edits have not been saved. Load the latest revision and review your changes before saving again.",
        );
      const updatedAt = new Date(
        Math.max(Date.now(), Date.parse(current.updatedAt) + 1),
      ).toISOString();
      const next = parseInput(accountTripSchema, {
        ...current,
        ...input.patch,
        updatedAt,
      });
      db.query(
        "UPDATE travel_trips SET payload = ?, updated_at = ? WHERE id = ? AND user_id = ?",
      ).run(encrypt(next, `travel:${id}:${actor.id}`), updatedAt, id, actor.id);
      audit(actor.id, "travel.update", id);
      return next;
    })();
    return Response.json(trip);
  }
  if (method === "DELETE") {
    const input = parseInput(deleteTripSchema, context.body);
    db.transaction(() => {
      const current = ownTrip(id, actor.id);
      if (current.updatedAt !== input.expectedUpdatedAt)
        throw new ApiError(
          409,
          "This trip changed on another device and was not deleted. Refresh and review the latest plan before deleting it.",
        );
      db.query("DELETE FROM travel_trips WHERE id = ? AND user_id = ?").run(
        id,
        actor.id,
      );
      audit(actor.id, "travel.delete", id);
    })();
    return Response.json({ ok: true });
  }
  throw new ApiError(404, "Travel route not found.");
}
