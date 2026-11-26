import { z } from "zod";

const id = z.string().min(1);
export const memberConversationSchema = z.object({
  id,
  circleId: id,
  circleName: z.string(),
  peer: z.object({ id, alias: z.string() }),
  updatedAt: z.string(),
  unreadCount: z.number().int().nonnegative(),
  blockedByMe: z.boolean(),
  canSend: z.boolean(),
});
export const memberMessageSchema = z.object({
  id,
  conversationId: id,
  senderId: id,
  body: z.string(),
  createdAt: z.string(),
});
const page = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
  });
export const conversationDetailSchema = z.object({
  conversation: memberConversationSchema,
  messages: page(memberMessageSchema),
});
export const messageReportSchema = z.object({
  id,
  conversationId: id,
  reportedMessage: memberMessageSchema,
  reporterAlias: z.string(),
  senderAlias: z.string(),
  reason: z.string(),
  status: z.enum(["open", "resolved"]),
  createdAt: z.string(),
});
export function parseMessagingResponse(
  path: string,
  method: string,
  value: unknown,
): unknown {
  const route = path.split("?")[0];
  let schema: z.ZodType;
  if (route === "/messaging/conversations" && method === "GET")
    schema = page(memberConversationSchema);
  else if (route === "/messaging/blocks" && method === "GET")
    schema = page(
      z.object({ userId: id, alias: z.string(), createdAt: z.string() }),
    );
  else if (route === "/messaging/conversations" && method === "POST")
    schema = conversationDetailSchema;
  else if (
    /^\/messaging\/conversations\/[^/]+$/.test(route) &&
    method === "GET"
  )
    schema = conversationDetailSchema;
  else if (
    /^\/messaging\/conversations\/[^/]+\/messages$/.test(route) &&
    method === "POST"
  )
    schema = memberMessageSchema;
  else if (
    /^\/messaging\/messages\/[^/]+\/report$/.test(route) &&
    method === "POST"
  )
    schema = z.object({ id, status: z.literal("received") });
  else if (route === "/messaging/reports" && method === "GET")
    schema = page(messageReportSchema);
  else if (
    (/^\/messaging\/conversations\/[^/]+\/(read|block)$/.test(route) &&
      method === "POST") ||
    (/^\/messaging\/conversations\/[^/]+$/.test(route) &&
      method === "DELETE") ||
    (/^\/messaging\/blocks\/[^/]+$/.test(route) && method === "DELETE") ||
    (/^\/messaging\/reports\/[^/]+$/.test(route) && method === "PATCH")
  )
    schema = z.object({ ok: z.literal(true) });
  else throw new Error("Unknown messaging response.");
  const parsed = schema.safeParse(value);
  if (!parsed.success)
    throw new Error(
      "The messaging service returned an invalid response. Please retry.",
    );
  return parsed.data;
}
