import { z } from "zod";
import { countries } from "../src/healthcare/catalog-data";
import { starterCircles } from "../src/community/seed";
import type {
  Circle,
  CircleMember,
  CirclePost,
  CommunityReport,
  MembershipRequest,
  MessagingIdentity,
  PageResult,
} from "../src/community/types";
import type {
  TripCommunityFocus,
  TripCommunityMatches,
  TripCommunityMatchSource,
} from "../src/travel/types";
import { type DomainContext, parseInput, requireActor } from "./domain";
import { audit, db, decrypt, encrypt } from "./storage";
import { ApiError } from "./validation";

const boundedText = (maximum: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(maximum)
    .refine(
      (value) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value),
      "Control characters are not allowed.",
    );
const alias = boundedText(60);
const countryCode = z
  .string()
  .refine(
    (value) => countries.some((country) => country.code === value),
    "Choose a catalog country.",
  );
function cityMatchKey(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("und");
}
const calendarDate = z.string().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}, "Enter a valid calendar date (YYYY-MM-DD).");
const timestamp = z.string().datetime();
const membershipPayload = z
  .object({ alias, allowMessages: z.boolean() })
  .strict();
const consentMembership = membershipPayload
  .extend({ consent: z.literal(true) })
  .strict();
const metadata = z
  .object({
    name: boundedText(100),
    description: boundedText(2000),
    countryCode: countryCode.nullable(),
    city: boundedText(120).nullable(),
    startsOn: calendarDate.nullable(),
    endsOn: calendarDate.nullable(),
  })
  .strict();
const createInput = z
  .object({
    name: boundedText(100),
    description: boundedText(2000),
    countryCode,
    city: boundedText(120),
    startsOn: calendarDate,
    endsOn: calendarDate,
    alias,
    allowMessages: z.boolean(),
    consent: z.literal(true),
  })
  .strict();
const editInput = z
  .object({
    expectedUpdatedAt: timestamp,
    patch: z
      .object({
        name: boundedText(100).optional(),
        description: boundedText(2000).optional(),
        startsOn: calendarDate.optional(),
        endsOn: calendarDate.optional(),
        state: z.enum(["open", "closed"]).optional(),
      })
      .strict()
      .refine((value) => Object.keys(value).length > 0, "Provide a change."),
  })
  .strict();
const emptyInput = z.object({}).strict();
const postPayload = z
  .object({ authorAlias: alias, body: z.string().max(2000) })
  .strict();
const reportPayload = z
  .object({ reporterAlias: alias, reason: boundedText(1000) })
  .strict();
const circleRowSchema = z.object({
  id: z.string(),
  owner_id: z.string().nullable(),
  kind: z.enum(["support", "destination", "travel"]),
  state: z.enum(["open", "closed"]),
  payload: z.string(),
  created_at: timestamp,
  updated_at: timestamp,
});
const membershipRowSchema = z.object({
  circle_id: z.string(),
  user_id: z.string(),
  status: z.enum(["pending", "active", "declined"]),
  payload: z.string(),
  created_at: timestamp,
});
const postRowSchema = z.object({
  id: z.string(),
  circle_id: z.string(),
  author_id: z.string(),
  payload: z.string(),
  status: z.enum(["visible", "removed"]),
  created_at: timestamp,
});
const reportRowSchema = z.object({
  id: z.string(),
  post_id: z.string(),
  reporter_id: z.string(),
  payload: z.string(),
  status: z.enum(["open", "resolved"]),
  created_at: timestamp,
});
type CircleRow = z.infer<typeof circleRowSchema>;
type MembershipRow = z.infer<typeof membershipRowSchema>;
type PostRow = z.infer<typeof postRowSchema>;
type ReportRow = z.infer<typeof reportRowSchema>;
type Actor = NonNullable<DomainContext["actor"]>;

// Every private record has a direct account FK. Reports reference posts rather
// than retaining snapshots, so author deletion cannot leave reported content.
db.exec(`
CREATE TABLE IF NOT EXISTS community_circles (
  id TEXT PRIMARY KEY,
  owner_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK(kind IN ('support','destination','travel')),
  state TEXT NOT NULL CHECK(state IN ('open','closed')),
  payload TEXT NOT NULL, city_key TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  CHECK((kind = 'travel' AND owner_id IS NOT NULL) OR (kind != 'travel' AND owner_id IS NULL))
);
CREATE INDEX IF NOT EXISTS community_circles_owner ON community_circles(owner_id);
CREATE INDEX IF NOT EXISTS community_circles_page ON community_circles(state, created_at, id);
CREATE TABLE IF NOT EXISTS community_memberships (
  circle_id TEXT NOT NULL REFERENCES community_circles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK(status IN ('pending','active','declined')),
  payload TEXT NOT NULL, created_at TEXT NOT NULL,
  PRIMARY KEY(circle_id, user_id)
);
CREATE INDEX IF NOT EXISTS community_memberships_user ON community_memberships(user_id);
CREATE INDEX IF NOT EXISTS community_memberships_page ON community_memberships(circle_id, status, created_at, user_id);
CREATE TABLE IF NOT EXISTS community_posts (
  id TEXT PRIMARY KEY,
  circle_id TEXT NOT NULL REFERENCES community_circles(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payload TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('visible','removed')),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS community_posts_author ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS community_posts_page ON community_posts(circle_id, created_at, id);
CREATE TABLE IF NOT EXISTS community_reports (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payload TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('open','resolved')),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS community_reports_post ON community_reports(post_id);
CREATE INDEX IF NOT EXISTS community_reports_reporter ON community_reports(reporter_id);
CREATE INDEX IF NOT EXISTS community_reports_page ON community_reports(status, created_at, id);
CREATE UNIQUE INDEX IF NOT EXISTS community_reports_one_open ON community_reports(post_id, reporter_id) WHERE status = 'open';
`);
const circleColumns = db
  .query<{ name: string }, []>("PRAGMA table_info(community_circles)")
  .all();
if (!circleColumns.some((column) => column.name === "city_key"))
  db.exec("ALTER TABLE community_circles ADD COLUMN city_key TEXT");
db.exec(
  "CREATE INDEX IF NOT EXISTS community_circles_match ON community_circles(state, kind, city_key, created_at, id)",
);
const missingCityKeys = db
  .query<{ id: string; payload: string }, []>(
    "SELECT id, payload FROM community_circles WHERE kind = 'travel' AND city_key IS NULL",
  )
  .all();
if (missingCityKeys.length) {
  const setCityKey = db.query(
    "UPDATE community_circles SET city_key = ? WHERE id = ?",
  );
  db.transaction(() => {
    for (const row of missingCityKeys) {
      const city = metadata.parse(JSON.parse(row.payload)).city;
      if (city) setCityKey.run(cityMatchKey(city), row.id);
    }
  })();
}

const storedTimestamp = db
  .query<{ latest: string | null }, []>(
    `
  SELECT MAX(time) AS latest FROM (
    SELECT MAX(updated_at) AS time FROM community_circles
    UNION ALL SELECT MAX(created_at) FROM community_memberships
    UNION ALL SELECT MAX(created_at) FROM community_posts
    UNION ALL SELECT MAX(created_at) FROM community_reports
  )
`,
  )
  .get()?.latest;
let lastTimestamp = storedTimestamp
  ? Date.parse(timestamp.parse(storedTimestamp))
  : 0;
function now(previous?: string): string {
  lastTimestamp = Math.max(
    Date.now(),
    lastTimestamp + 1,
    previous ? Date.parse(previous) + 1 : 0,
  );
  return new Date(lastTimestamp).toISOString();
}

db.transaction(() => {
  const insert = db.query(
    "INSERT OR IGNORE INTO community_circles (id, owner_id, kind, state, payload, created_at, updated_at) VALUES (?, NULL, ?, 'open', ?, ?, ?)",
  );
  for (const seed of starterCircles) {
    const time = now();
    insert.run(
      seed.id,
      seed.kind,
      JSON.stringify({
        name: seed.name,
        description: seed.description,
        countryCode: seed.countryCode,
        city: null,
        startsOn: null,
        endsOn: null,
      }),
      time,
      time,
    );
  }
})();

function circleRecord(id: string): CircleRow {
  const row = db
    .query<CircleRow, [string]>("SELECT * FROM community_circles WHERE id = ?")
    .get(id);
  if (!row) throw new ApiError(404, "Circle not found.");
  return circleRowSchema.parse(row);
}
function membership(circleId: string, userId: string): MembershipRow | null {
  const row = db
    .query<
      MembershipRow,
      [string, string]
    >("SELECT * FROM community_memberships WHERE circle_id = ? AND user_id = ?")
    .get(circleId, userId);
  return row ? membershipRowSchema.parse(row) : null;
}
function memberDetails(row: MembershipRow) {
  return membershipPayload.parse(
    decrypt<unknown>(
      row.payload,
      `community-membership:${row.circle_id}:${row.user_id}`,
    ),
  );
}
function requireManager(row: CircleRow, actor: Actor) {
  if (actor.role !== "staff" && row.owner_id !== actor.id)
    throw new ApiError(
      403,
      "Only the circle owner or staff can manage this circle.",
    );
}
function requireMember(
  row: CircleRow,
  actor: Actor,
  allowStaff = true,
): MembershipRow | null {
  const member = membership(row.id, actor.id);
  if (member?.status === "active") return member;
  if (allowStaff && actor.role === "staff") return null;
  throw new ApiError(403, "Active circle membership is required.");
}
function requireOpen(row: CircleRow) {
  if (row.state !== "open")
    throw new ApiError(409, "This circle is closed and read-only.");
}
function circleView(row: CircleRow, actor: DomainContext["actor"]): Circle {
  const own = actor ? membership(row.id, actor.id) : null;
  const canManage =
    !!actor && (actor.role === "staff" || row.owner_id === actor.id);
  if (row.state === "closed" && !own && !canManage)
    throw new ApiError(404, "Circle not found.");
  const owner =
    row.owner_id && (own?.status === "active" || actor?.role === "staff")
      ? membership(row.id, row.owner_id)
      : null;
  const count = db
    .query<
      { count: number },
      [string]
    >("SELECT COUNT(*) AS count FROM community_memberships WHERE circle_id = ? AND status = 'active'")
    .get(row.id);
  return {
    id: row.id,
    ...metadata.parse(JSON.parse(row.payload)),
    kind: row.kind,
    state: row.state,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // A public circle must not publish even its owner's opted membership alias.
    ownerAlias: owner ? memberDetails(owner).alias : null,
    memberCount: count?.count ?? 0,
    myMembership: own ? { status: own.status, ...memberDetails(own) } : null,
    canManage,
  };
}
function validateMetadata(
  value: z.infer<typeof metadata>,
  kind: CircleRow["kind"],
) {
  if (
    kind === "travel" &&
    (!value.countryCode || !value.city || !value.startsOn || !value.endsOn)
  ) {
    throw new ApiError(
      400,
      "Travel coordination groups require a country, city and both dates.",
    );
  }
  if (kind !== "travel" && (value.startsOn !== null || value.endsOn !== null)) {
    throw new ApiError(
      400,
      "Only travel coordination groups have travel dates.",
    );
  }
  if (value.startsOn && value.endsOn && value.startsOn > value.endsOn) {
    throw new ApiError(400, "The end date must be on or after the start date.");
  }
}
function saveMembership(
  circleId: string,
  userId: string,
  status: MembershipRow["status"],
  value: z.infer<typeof membershipPayload>,
) {
  db.query(
    "INSERT INTO community_memberships (circle_id, user_id, status, payload, created_at) VALUES (?, ?, ?, ?, ?)",
  ).run(
    circleId,
    userId,
    status,
    encrypt(value, `community-membership:${circleId}:${userId}`),
    now(),
  );
}

/** Internal only: no global identity discovery and no closed/pending access. */
export function getMessagingIdentity(
  circleId: string,
  userId: string,
): MessagingIdentity | null {
  const raw = db
    .query<
      CircleRow,
      [string]
    >("SELECT * FROM community_circles WHERE id = ? AND state = 'open'")
    .get(circleId);
  if (!raw) return null;
  const row = circleRowSchema.parse(raw);
  const member = membership(circleId, userId);
  if (member?.status !== "active") return null;
  return {
    circleId,
    circleName: metadata.parse(JSON.parse(row.payload)).name,
    userId,
    ...memberDetails(member),
  };
}

const PAGE_SIZE = 30;
const cursorSchema = z
  .object({ time: timestamp, id: z.string().min(1).max(120) })
  .strict();
function decodePageCursor(
  value: string | null,
  scope: string,
): z.infer<typeof cursorSchema> | null {
  if (value === null) return null;
  try {
    if (!/^[A-Za-z0-9_-]{1,2000}$/.test(value))
      throw new Error("Invalid cursor");
    const encrypted = Buffer.from(value, "base64url").toString("utf8");
    return cursorSchema.parse(
      decrypt<unknown>(encrypted, `community-cursor:${scope}`),
    );
  } catch {
    throw new ApiError(
      400,
      "Invalid or expired page cursor. Refresh the list.",
    );
  }
}
function pageCursor(
  query: URLSearchParams,
  scope: string,
): z.infer<typeof cursorSchema> | null {
  return decodePageCursor(query.get("cursor"), scope);
}
function pageResult<T, R>(
  rows: R[],
  scope: string,
  key: (row: R) => z.infer<typeof cursorSchema>,
  view: (row: R) => T,
): PageResult<T> {
  const hasMore = rows.length > PAGE_SIZE;
  const visible = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const last = visible[visible.length - 1];
  return {
    items: visible.map(view),
    nextCursor:
      hasMore && last
        ? Buffer.from(encrypt(key(last), `community-cursor:${scope}`)).toString(
            "base64url",
          )
        : null,
  };
}

export function communityMatchesForTrip(
  actor: NonNullable<DomainContext["actor"]>,
  trip: TripCommunityFocus & Pick<TripCommunityMatchSource, "updatedAt">,
  matchScope: "city" | "country",
  cursorValue?: string,
): TripCommunityMatches {
  const source = {
    countryCode: trip.countryCode,
    city: trip.city,
    startsOn: trip.startsOn,
    endsOn: trip.endsOn,
    updatedAt: trip.updatedAt,
  };
  const cursorScope = JSON.stringify([
    "trip-community-matches",
    actor.id,
    trip.id,
    trip.updatedAt,
    matchScope,
    source.countryCode,
    source.city,
    source.startsOn,
    source.endsOn,
  ]);
  const cursor = decodePageCursor(cursorValue ?? null, cursorScope);
  const destinationRow = db
    .query<CircleRow, [string]>(
      `
      SELECT * FROM community_circles
      WHERE state = 'open' AND kind = 'destination'
      AND json_extract(payload, '$.countryCode') = ?
      ORDER BY created_at, id LIMIT 1
    `,
    )
    .get(source.countryCode);
  const rows = db
    .query<
      CircleRow,
      [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        number,
      ]
    >(
      `
      SELECT * FROM community_circles
      WHERE state = 'open' AND kind = 'travel'
      AND json_extract(payload, '$.countryCode') = ?
      AND (? = 'country' OR city_key = ?)
      AND json_extract(payload, '$.startsOn') <= ?
      AND json_extract(payload, '$.endsOn') >= ?
      AND (created_at > ? OR (created_at = ? AND id > ?))
      ORDER BY created_at, id LIMIT ?
    `,
    )
    .all(
      source.countryCode,
      matchScope,
      cityMatchKey(source.city),
      source.endsOn,
      source.startsOn,
      cursor?.time ?? "",
      cursor?.time ?? "",
      cursor?.id ?? "",
      PAGE_SIZE + 1,
    )
    .map((row) => circleRowSchema.parse(row));
  return {
    source,
    destinationCircle: destinationRow
      ? circleView(circleRowSchema.parse(destinationRow), actor)
      : null,
    travelGroups: pageResult(
      rows,
      cursorScope,
      (row) => ({ time: row.created_at, id: row.id }),
      (row) => circleView(row, actor),
    ),
  };
}
function postRecord(id: string): PostRow {
  const row = db
    .query<PostRow, [string]>("SELECT * FROM community_posts WHERE id = ?")
    .get(id);
  if (!row) throw new ApiError(404, "Post not found.");
  return postRowSchema.parse(row);
}
function postView(row: PostRow, actor: Actor): CirclePost {
  const value = postPayload.parse(
    decrypt<unknown>(row.payload, `community-post:${row.id}`),
  );
  return {
    id: row.id,
    circleId: row.circle_id,
    authorId: row.author_id,
    authorAlias: value.authorAlias,
    body: row.status === "visible" ? value.body : "",
    createdAt: row.created_at,
    status: row.status,
    canDelete: row.author_id === actor.id || actor.role === "staff",
  };
}
function reportRecord(id: string): ReportRow {
  const row = db
    .query<ReportRow, [string]>("SELECT * FROM community_reports WHERE id = ?")
    .get(id);
  if (!row) throw new ApiError(404, "Report not found.");
  return reportRowSchema.parse(row);
}
function reportView(row: ReportRow, actor: Actor): CommunityReport {
  const post = postRecord(row.post_id);
  const circle = circleRecord(post.circle_id);
  return {
    id: row.id,
    circleId: circle.id,
    circleName: metadata.parse(JSON.parse(circle.payload)).name,
    post: postView(post, actor),
    ...reportPayload.parse(
      decrypt<unknown>(row.payload, `community-report:${row.id}`),
    ),
    status: row.status,
    createdAt: row.created_at,
  };
}

export function communityApi(
  request: Request,
  path: string,
  context: DomainContext,
): Response {
  const method = request.method;
  const query = new URL(request.url).searchParams;

  if (path === "/community/circles" && method === "GET") {
    const filter = parseInput(
      z.object({
        q: z.string().trim().max(100).optional(),
        kind: z.enum(["support", "destination", "travel"]).optional(),
        country: countryCode.optional(),
      }),
      {
        q: query.get("q") ?? undefined,
        kind: query.get("kind") || undefined,
        country: query.get("country") || undefined,
      },
    );
    const scope = JSON.stringify([
      "circles",
      filter.q ?? "",
      filter.kind ?? "",
      filter.country ?? "",
    ]);
    const cursor = pageCursor(query, scope);
    const rows = db
      .query<
        CircleRow,
        [
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          number,
        ]
      >(
        `
      SELECT * FROM community_circles WHERE state = 'open'
      AND (? = '' OR kind = ?) AND (? = '' OR json_extract(payload, '$.countryCode') = ?)
      AND (? = '' OR instr(lower(json_extract(payload, '$.name') || ' ' || json_extract(payload, '$.description') || ' ' || coalesce(json_extract(payload, '$.city'), '')), lower(?)) > 0)
      AND (created_at > ? OR (created_at = ? AND id > ?))
      ORDER BY created_at, id LIMIT ?
    `,
      )
      .all(
        filter.kind ?? "",
        filter.kind ?? "",
        filter.country ?? "",
        filter.country ?? "",
        filter.q ?? "",
        filter.q ?? "",
        cursor?.time ?? "",
        cursor?.time ?? "",
        cursor?.id ?? "",
        PAGE_SIZE + 1,
      );
    return Response.json(
      pageResult(
        rows.map((row) => circleRowSchema.parse(row)),
        scope,
        (row) => ({ time: row.created_at, id: row.id }),
        (row) => circleView(row, context.actor),
      ),
    );
  }

  if (path === "/community/mine" && method === "GET") {
    const actor = requireActor(context);
    const rows = db
      .query<CircleRow, [string]>(
        `
      SELECT c.* FROM community_circles c JOIN community_memberships m ON m.circle_id = c.id
      WHERE m.user_id = ? ORDER BY c.created_at, c.id
    `,
      )
      .all(actor.id);
    return Response.json({
      items: rows.map((row) => circleView(circleRowSchema.parse(row), actor)),
    });
  }

  if (path === "/community/circles" && method === "POST") {
    const actor = requireActor(context);
    const input = parseInput(createInput, context.body);
    const value = metadata.parse({
      name: input.name,
      description: input.description,
      countryCode: input.countryCode,
      city: input.city,
      startsOn: input.startsOn,
      endsOn: input.endsOn,
    });
    validateMetadata(value, "travel");
    context.limit(`community-create:${actor.id}`, 10, 60 * 60 * 1000);
    const result = db.transaction(() => {
      const id = crypto.randomUUID();
      const time = now();
      db.query(
        "INSERT INTO community_circles (id, owner_id, kind, state, payload, city_key, created_at, updated_at) VALUES (?, ?, 'travel', 'open', ?, ?, ?, ?)",
      ).run(
        id,
        actor.id,
        JSON.stringify(value),
        cityMatchKey(input.city),
        time,
        time,
      );
      saveMembership(id, actor.id, "active", {
        alias: input.alias,
        allowMessages: input.allowMessages,
      });
      audit(actor.id, "community.circle-created", id);
      return circleView(circleRecord(id), actor);
    })();
    return Response.json(result, { status: 201 });
  }

  const circleMatch =
    /^\/community\/circles\/([^/]+)(?:\/(join|membership|members|requests|posts)(?:\/([^/]+)\/decision)?)?$/.exec(
      path,
    );
  if (circleMatch) {
    const id = circleMatch[1];
    const action = circleMatch[2];
    const targetUser = circleMatch[3];
    if (targetUser && action !== "requests")
      throw new ApiError(404, "Community route not found.");
    if (!action && method === "GET")
      return Response.json(circleView(circleRecord(id), context.actor));
    const actor = requireActor(context);

    if (!action && method === "PATCH") {
      const input = parseInput(editInput, context.body);
      const result = db.transaction(() => {
        const row = circleRecord(id);
        requireManager(row, actor);
        if (row.updated_at !== input.expectedUpdatedAt)
          throw new ApiError(
            409,
            "Circle details changed. Refresh before applying your edit.",
          );
        const { state, ...changes } = input.patch;
        const value = metadata.parse({
          ...metadata.parse(JSON.parse(row.payload)),
          ...changes,
        });
        validateMetadata(value, row.kind);
        const nextState = state ?? row.state;
        if (
          nextState === "open" &&
          row.kind === "travel" &&
          row.owner_id &&
          membership(id, row.owner_id)?.status !== "active"
        ) {
          throw new ApiError(
            409,
            "The owner must still be an active member to reopen this group.",
          );
        }
        db.query(
          "UPDATE community_circles SET payload = ?, state = ?, updated_at = ? WHERE id = ?",
        ).run(JSON.stringify(value), nextState, now(row.updated_at), id);
        audit(actor.id, "community.circle-updated", id);
        return circleView(circleRecord(id), actor);
      })();
      return Response.json(result);
    }

    if (
      (action === "join" && method === "POST") ||
      (action === "membership" && method === "PATCH")
    ) {
      const input = parseInput(consentMembership, context.body);
      const result = db.transaction(() => {
        const row = circleRecord(id);
        const current = membership(id, actor.id);
        if (action === "join") {
          requireOpen(row);
          // Retrying a request never changes a declined decision or consent choices.
          if (!current)
            saveMembership(
              id,
              actor.id,
              row.kind === "travel" && row.owner_id !== actor.id
                ? "pending"
                : "active",
              { alias: input.alias, allowMessages: input.allowMessages },
            );
        } else {
          if (!current) throw new ApiError(404, "Membership not found.");
          db.query(
            "UPDATE community_memberships SET payload = ? WHERE circle_id = ? AND user_id = ?",
          ).run(
            encrypt(
              { alias: input.alias, allowMessages: input.allowMessages },
              `community-membership:${id}:${actor.id}`,
            ),
            id,
            actor.id,
          );
        }
        return circleView(row, actor);
      })();
      return Response.json(result);
    }

    if (action === "membership" && method === "DELETE") {
      parseInput(emptyInput, context.body);
      db.transaction(() => {
        const row = circleRecord(id);
        if (row.owner_id === actor.id && row.state === "open")
          throw new ApiError(
            409,
            "Close your travel coordination group before leaving it.",
          );
        db.query(
          "DELETE FROM community_memberships WHERE circle_id = ? AND user_id = ?",
        ).run(id, actor.id);
      })();
      return Response.json({ ok: true });
    }

    if (
      (action === "members" || action === "requests") &&
      !targetUser &&
      method === "GET"
    ) {
      const row = circleRecord(id);
      if (action === "requests") requireManager(row, actor);
      else requireMember(row, actor);
      const scope = `${action}:${id}:${actor.id}`;
      const cursor = pageCursor(query, scope);
      const rows = db
        .query<MembershipRow, [string, string, string, string, string, number]>(
          `
        SELECT * FROM community_memberships WHERE circle_id = ? AND status = ?
        AND (created_at > ? OR (created_at = ? AND user_id > ?)) ORDER BY created_at, user_id LIMIT ?
      `,
        )
        .all(
          id,
          action === "requests" ? "pending" : "active",
          cursor?.time ?? "",
          cursor?.time ?? "",
          cursor?.id ?? "",
          PAGE_SIZE + 1,
        )
        .map((entry) => membershipRowSchema.parse(entry));
      const key = (entry: MembershipRow) => ({
        time: entry.created_at,
        id: entry.user_id,
      });
      if (action === "requests")
        return Response.json(
          pageResult<MembershipRequest, MembershipRow>(
            rows,
            scope,
            key,
            (entry) => ({
              userId: entry.user_id,
              alias: memberDetails(entry).alias,
              requestedAt: entry.created_at,
            }),
          ),
        );
      return Response.json(
        pageResult<CircleMember, MembershipRow>(rows, scope, key, (entry) => ({
          userId: entry.user_id,
          ...memberDetails(entry),
          role: entry.user_id === row.owner_id ? "owner" : "member",
        })),
      );
    }

    if (action === "requests" && targetUser && method === "POST") {
      const input = parseInput(
        z.object({ decision: z.enum(["approve", "decline"]) }).strict(),
        context.body,
      );
      db.transaction(() => {
        const row = circleRecord(id);
        requireManager(row, actor);
        requireOpen(row);
        if (membership(id, targetUser)?.status !== "pending")
          throw new ApiError(
            409,
            "This request is no longer pending. Refresh the requests.",
          );
        db.query(
          "UPDATE community_memberships SET status = ? WHERE circle_id = ? AND user_id = ?",
        ).run(
          input.decision === "approve" ? "active" : "declined",
          id,
          targetUser,
        );
        audit(actor.id, `community.request-${input.decision}`, id);
      })();
      return Response.json({ ok: true });
    }

    if (action === "posts" && method === "GET") {
      requireMember(circleRecord(id), actor);
      const scope = `posts:${id}:${actor.id}`;
      const cursor = pageCursor(query, scope);
      const rows = db
        .query<PostRow, [string, string, string, string, number]>(
          `
        SELECT * FROM community_posts WHERE circle_id = ?
        AND (created_at > ? OR (created_at = ? AND id > ?)) ORDER BY created_at, id LIMIT ?
      `,
        )
        .all(
          id,
          cursor?.time ?? "",
          cursor?.time ?? "",
          cursor?.id ?? "",
          PAGE_SIZE + 1,
        );
      return Response.json(
        pageResult(
          rows.map((row) => postRowSchema.parse(row)),
          scope,
          (row) => ({ time: row.created_at, id: row.id }),
          (row) => postView(row, actor),
        ),
      );
    }

    if (action === "posts" && method === "POST") {
      const input = parseInput(
        z.object({ body: boundedText(2000) }).strict(),
        context.body,
      );
      context.limit(`community-post:${actor.id}`, 20, 60 * 1000);
      const result = db.transaction(() => {
        const row = circleRecord(id);
        requireOpen(row);
        const member = requireMember(row, actor, false);
        if (!member)
          throw new ApiError(403, "Active circle membership is required.");
        const postId = crypto.randomUUID();
        db.query(
          "INSERT INTO community_posts (id, circle_id, author_id, payload, status, created_at) VALUES (?, ?, ?, ?, 'visible', ?)",
        ).run(
          postId,
          id,
          actor.id,
          encrypt(
            { authorAlias: memberDetails(member).alias, body: input.body },
            `community-post:${postId}`,
          ),
          now(),
        );
        return postView(postRecord(postId), actor);
      })();
      return Response.json(result, { status: 201 });
    }
    throw new ApiError(404, "Community route not found.");
  }

  const postMatch = /^\/community\/posts\/([^/]+)(\/report)?$/.exec(path);
  if (
    postMatch &&
    ((!postMatch[2] && method === "DELETE") ||
      (postMatch[2] && method === "POST"))
  ) {
    const actor = requireActor(context);
    const id = postMatch[1];
    if (!postMatch[2]) {
      parseInput(emptyInput, context.body);
      db.transaction(() => {
        const row = postRecord(id);
        if (row.author_id !== actor.id && actor.role !== "staff")
          throw new ApiError(
            403,
            "Only the author or staff can delete this post.",
          );
        db.query("DELETE FROM community_posts WHERE id = ?").run(id);
        audit(actor.id, "community.post-deleted", id);
      })();
      return Response.json({ ok: true });
    }
    const input = parseInput(
      z.object({ reason: boundedText(1000) }).strict(),
      context.body,
    );
    context.limit(`community-report:${actor.id}`, 20, 60 * 1000);
    const reportId = db.transaction(() => {
      const post = postRecord(id);
      const member = requireMember(circleRecord(post.circle_id), actor, false);
      if (!member)
        throw new ApiError(403, "Active circle membership is required.");
      if (post.status !== "visible")
        throw new ApiError(409, "This post is no longer visible.");
      const existing = db
        .query<
          { id: string },
          [string, string]
        >("SELECT id FROM community_reports WHERE post_id = ? AND reporter_id = ? AND status = 'open'")
        .get(id, actor.id);
      if (existing) return existing.id;
      const reportId = crypto.randomUUID();
      db.query(
        "INSERT INTO community_reports (id, post_id, reporter_id, payload, status, created_at) VALUES (?, ?, ?, ?, 'open', ?)",
      ).run(
        reportId,
        id,
        actor.id,
        encrypt(
          { reporterAlias: memberDetails(member).alias, reason: input.reason },
          `community-report:${reportId}`,
        ),
        now(),
      );
      return reportId;
    })();
    return Response.json({ id: reportId, status: "received" });
  }

  if (path === "/community/reports" && method === "GET") {
    const actor = requireActor(context, true);
    const status = parseInput(
      z.enum(["open", "resolved"]),
      query.get("status") ?? "open",
    );
    const scope = `reports:${status}:${actor.id}`;
    const cursor = pageCursor(query, scope);
    const rows = db
      .query<ReportRow, [string, string, string, string, number]>(
        `
      SELECT * FROM community_reports WHERE status = ?
      AND (created_at > ? OR (created_at = ? AND id > ?)) ORDER BY created_at, id LIMIT ?
    `,
      )
      .all(
        status,
        cursor?.time ?? "",
        cursor?.time ?? "",
        cursor?.id ?? "",
        PAGE_SIZE + 1,
      );
    return Response.json(
      pageResult(
        rows.map((row) => reportRowSchema.parse(row)),
        scope,
        (row) => ({ time: row.created_at, id: row.id }),
        (row) => reportView(row, actor),
      ),
    );
  }

  const reportMatch = /^\/community\/reports\/([^/]+)$/.exec(path);
  if (reportMatch && method === "PATCH") {
    const actor = requireActor(context, true);
    const input = parseInput(
      z.object({ action: z.enum(["dismiss", "remove-post"]) }).strict(),
      context.body,
    );
    db.transaction(() => {
      const report = reportRecord(reportMatch[1]);
      if (report.status !== "open")
        throw new ApiError(
          409,
          "This report has already been resolved. Refresh the reports.",
        );
      if (input.action === "remove-post") {
        const post = postRecord(report.post_id);
        const value = postPayload.parse(
          decrypt<unknown>(post.payload, `community-post:${post.id}`),
        );
        // Erase the body, not just its visibility flag; reports hold no body copy.
        db.query(
          "UPDATE community_posts SET status = 'removed', payload = ? WHERE id = ?",
        ).run(
          encrypt(
            { authorAlias: value.authorAlias, body: "" },
            `community-post:${post.id}`,
          ),
          post.id,
        );
        db.query(
          "UPDATE community_reports SET status = 'resolved' WHERE post_id = ? AND status = 'open'",
        ).run(post.id);
      } else
        db.query(
          "UPDATE community_reports SET status = 'resolved' WHERE id = ?",
        ).run(report.id);
      audit(actor.id, `community.report-${input.action}`, report.id);
    })();
    return Response.json({ ok: true });
  }

  throw new ApiError(404, "Community route not found.");
}
