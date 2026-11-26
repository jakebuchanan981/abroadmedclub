import { z } from "zod";
import type {
  Circle,
  CircleMember,
  CirclePost,
  CommunityReport,
  MembershipRequest,
} from "./types";

const timestamp = z.string().datetime();
const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const circleSchema: z.ZodType<Circle> = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    kind: z.enum(["support", "destination", "travel"]),
    description: z.string(),
    countryCode: z.string().nullable(),
    city: z.string().nullable(),
    startsOn: calendarDate.nullable(),
    endsOn: calendarDate.nullable(),
    ownerAlias: z.string().nullable(),
    state: z.enum(["open", "closed"]),
    createdAt: timestamp,
    updatedAt: timestamp,
    memberCount: z.number().int().nonnegative(),
    myMembership: z
      .object({
        status: z.enum(["pending", "active", "declined"]),
        alias: z.string().min(1),
        allowMessages: z.boolean(),
      })
      .nullable(),
    canManage: z.boolean(),
  })
  .strict();
const member: z.ZodType<CircleMember> = z.object({
  userId: z.string().min(1),
  alias: z.string().min(1),
  role: z.enum(["owner", "member"]),
  allowMessages: z.boolean(),
});
const post: z.ZodType<CirclePost> = z
  .object({
    id: z.string().min(1),
    circleId: z.string().min(1),
    authorId: z.string().min(1),
    authorAlias: z.string().min(1),
    body: z.string().max(2000),
    createdAt: timestamp,
    status: z.enum(["visible", "removed"]),
    canDelete: z.boolean(),
  })
  .refine((value) => value.status !== "removed" || value.body === "", {
    message: "Removed content must not be disclosed.",
  });
const membershipRequest: z.ZodType<MembershipRequest> = z.object({
  userId: z.string().min(1),
  alias: z.string().min(1),
  requestedAt: timestamp,
});
const report: z.ZodType<CommunityReport> = z.object({
  id: z.string().min(1),
  circleId: z.string().min(1),
  circleName: z.string(),
  post,
  reporterAlias: z.string().min(1),
  reason: z.string().min(1).max(1000),
  status: z.enum(["open", "resolved"]),
  createdAt: timestamp,
});
const page = <T>(item: z.ZodType<T>) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().min(1).nullable(),
  });
const ok = z.object({ ok: z.literal(true) });
const receipt = z.object({
  id: z.string().min(1),
  status: z.literal("received"),
});

export function parseCommunityResponse(
  path: string,
  method: string,
  value: unknown,
): unknown {
  const route = path.split("?")[0];
  let schema: z.ZodType;
  if (route === "/community/circles" && method === "GET")
    schema = page(circleSchema);
  else if (route === "/community/circles" && method === "POST")
    schema = circleSchema;
  else if (route === "/community/mine" && method === "GET")
    schema = z.object({ items: z.array(circleSchema) });
  else if (
    /^\/community\/circles\/[^/]+$/.test(route) &&
    ["GET", "PATCH"].includes(method)
  )
    schema = circleSchema;
  else if (
    /^\/community\/circles\/[^/]+\/join$/.test(route) &&
    method === "POST"
  )
    schema = circleSchema;
  else if (
    /^\/community\/circles\/[^/]+\/membership$/.test(route) &&
    method === "PATCH"
  )
    schema = circleSchema;
  else if (
    /^\/community\/circles\/[^/]+\/membership$/.test(route) &&
    method === "DELETE"
  )
    schema = ok;
  else if (
    /^\/community\/circles\/[^/]+\/members$/.test(route) &&
    method === "GET"
  )
    schema = page(member);
  else if (
    /^\/community\/circles\/[^/]+\/requests$/.test(route) &&
    method === "GET"
  )
    schema = page(membershipRequest);
  else if (
    /^\/community\/circles\/[^/]+\/requests\/[^/]+\/decision$/.test(route) &&
    method === "POST"
  )
    schema = ok;
  else if (
    /^\/community\/circles\/[^/]+\/posts$/.test(route) &&
    method === "GET"
  )
    schema = page(post);
  else if (
    /^\/community\/circles\/[^/]+\/posts$/.test(route) &&
    method === "POST"
  )
    schema = post;
  else if (/^\/community\/posts\/[^/]+$/.test(route) && method === "DELETE")
    schema = ok;
  else if (
    /^\/community\/posts\/[^/]+\/report$/.test(route) &&
    method === "POST"
  )
    schema = receipt;
  else if (route === "/community/reports" && method === "GET")
    schema = page(report);
  else if (/^\/community\/reports\/[^/]+$/.test(route) && method === "PATCH")
    schema = ok;
  else throw new Error("Unsupported community service response.");
  const result = schema.safeParse(value);
  if (!result.success)
    throw new Error(
      "The community service returned an unexpected format. Refresh and try again.",
    );
  return result.data;
}
