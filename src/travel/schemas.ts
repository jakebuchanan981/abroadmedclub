import { z } from "zod";
import { countries } from "../healthcare/catalog-data";
import { circleSchema } from "../community/schemas";
import type {
  Circle,
  PageResult,
} from "../community/types";
import type {
  TripCommunityMatches,
  TripCommunityMatchSource,
} from "./types";
import { isDate, legacyDestinationPlaces } from "./planning";

const calendarDate = z
  .string()
  .refine(isDate, "Enter a valid date in YYYY-MM-DD format.");
const timestamp = z.string().datetime();
const countryCode = z
  .string()
  .refine(
    (code) => countries.some((country) => country.code === code),
    "Choose a catalog country.",
  );
export const checklistSchema = z
  .object({
    consultation: z.boolean().optional(),
    documents: z.boolean().optional(),
    costs: z.boolean().optional(),
    stay: z.boolean().optional(),
    support: z.boolean().optional(),
  })
  .strict();
const mode = z.enum(["independent", "abroadmedclub", "partner"]);
const fields = {
  countryCode,
  city: z.string().trim().min(1, "Enter a city.").max(120),
  startsOn: calendarDate,
  endsOn: calendarDate,
  mode,
};
const orderedDates = (value: { startsOn: string; endsOn: string }) =>
  value.endsOn >= value.startsOn;
const orderError = {
  message: "Return date must be on or after departure.",
  path: ["endsOn"],
};
export const tripInputSchema = z
  .object(fields)
  .strict()
  .refine(orderedDates, orderError);
export const createTripSchema = z
  .object({ ...fields, consent: z.literal(true) })
  .strict()
  .refine(orderedDates, orderError);
export const accountTripSchema = z
  .object({
    ...fields,
    id: z.string().uuid(),
    checklist: checklistSchema,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  .strict()
  .refine(orderedDates, orderError);
export const updateTripSchema = z
  .object({
    expectedUpdatedAt: timestamp,
    patch: z
      .object({ ...fields, checklist: checklistSchema })
      .partial()
      .strict()
      .refine(
        (patch) => Object.keys(patch).length > 0,
        "Provide a change to save.",
      ),
  })
  .strict();
export const deleteTripSchema = z
  .object({ expectedUpdatedAt: timestamp })
  .strict();
const legacyTripSchema = z
  .object({
    id: z.string().min(1).max(200),
    destinationId: z
      .string()
      .refine(
        (id) => Object.hasOwn(legacyDestinationPlaces, id),
        "Unknown local destination.",
      ),
    startsOn: calendarDate,
    endsOn: calendarDate,
    mode,
    checklist: checklistSchema,
    createdAt: timestamp,
  })
  .strict()
  .refine(orderedDates, orderError);
export const importTripsSchema = z
  .object({ consent: z.literal(true), trips: z.array(legacyTripSchema).min(1) })
  .strict()
  .refine(
    ({ trips }) => new Set(trips.map((trip) => trip.id)).size === trips.length,
    "Local trip IDs must be unique.",
  );
export const communityMatchesInputSchema = z
  .object({
    tripId: z.string().uuid(),
    scope: z.enum(["city", "country"]),
    cursor: z.string().min(1).max(2000).optional(),
  })
  .strict();
export const tripCommunityMatchSourceSchema: z.ZodType<TripCommunityMatchSource> =
  z
    .object({
      countryCode,
      city: fields.city,
      startsOn: calendarDate,
      endsOn: calendarDate,
      updatedAt: timestamp,
    })
    .strict()
    .refine(orderedDates, orderError);
const strictCircleKeys: z.ZodType<Circle> = circleSchema;
const matchPageSchema: z.ZodType<PageResult<Circle>> = z
  .object({
    items: z.array(strictCircleKeys),
    nextCursor: z.string().min(1).nullable(),
  })
  .strict();
export const tripCommunityMatchesSchema: z.ZodType<TripCommunityMatches> = z
  .object({
    source: tripCommunityMatchSourceSchema,
    destinationCircle: strictCircleKeys.nullable(),
    travelGroups: matchPageSchema,
  })
  .strict();
const tripsSchema = z.object({ items: z.array(accountTripSchema) }).strict();
const importReceiptSchema = z
  .object({
    items: z.array(accountTripSchema),
    createdCount: z.number().int().nonnegative(),
    existingCount: z.number().int().nonnegative(),
  })
  .strict()
  .refine(
    (receipt) =>
      receipt.items.length === receipt.createdCount + receipt.existingCount,
  );

export function parseTravelResponse(
  path: string,
  method: string,
  value: unknown,
): unknown {
  const route = path.split("?")[0];
  let schema: z.ZodType;
  if (route === "/travel/trips" && method === "GET") schema = tripsSchema;
  else if (route === "/travel/import" && method === "POST")
    schema = importReceiptSchema;
  else if (route === "/travel/community-matches" && method === "POST")
    schema = tripCommunityMatchesSchema;
  else if (
    (route === "/travel/trips" && method === "POST") ||
    (/^\/travel\/trips\/[^/]+$/.test(route) &&
      ["GET", "PATCH"].includes(method))
  )
    schema = accountTripSchema;
  else if (/^\/travel\/trips\/[^/]+$/.test(route) && method === "DELETE")
    schema = z.object({ ok: z.literal(true) }).strict();
  else throw new Error("The travel service returned an unsupported response.");
  const result = schema.safeParse(value);
  if (!result.success)
    throw new Error(
      "The travel service returned an unexpected format. Refresh and try again.",
    );
  return result.data;
}
