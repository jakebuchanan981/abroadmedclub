import { z } from "zod";
import { db, encrypt, decrypt, audit } from "./storage";
import { ApiError } from "./validation";
import { parseInput, requireActor, type DomainContext } from "./domain";
import { getMessagingIdentity } from "./community";
import type {
  ConversationDetail,
  MemberBlock,
  MemberConversation,
  MemberMessage,
  MessageReport,
} from "../src/messaging/types";
import type { PageResult } from "../src/community/types";

db.exec(`
CREATE TABLE IF NOT EXISTS messaging_conversations (
  seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT UNIQUE NOT NULL,
  user_a TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  circle_id TEXT NOT NULL, payload TEXT NOT NULL, updated_at TEXT NOT NULL,
  read_a INTEGER NOT NULL DEFAULT 0, read_b INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_a, user_b), CHECK(user_a < user_b)
);
CREATE INDEX IF NOT EXISTS messaging_conversations_a ON messaging_conversations(user_a, seq);
CREATE INDEX IF NOT EXISTS messaging_conversations_b ON messaging_conversations(user_b, seq);
CREATE TABLE IF NOT EXISTS messaging_messages (
  seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT UNIQUE NOT NULL,
  conversation_id TEXT NOT NULL REFERENCES messaging_conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payload TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS messaging_messages_thread ON messaging_messages(conversation_id, seq);
CREATE TABLE IF NOT EXISTS messaging_blocks (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  blocker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payload TEXT NOT NULL, created_at TEXT NOT NULL,
  UNIQUE(blocker_id, blocked_id), CHECK(blocker_id != blocked_id)
);
CREATE INDEX IF NOT EXISTS messaging_blocks_actor ON messaging_blocks(blocker_id, seq);
CREATE TABLE IF NOT EXISTS messaging_reports (
  seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT UNIQUE NOT NULL,
  message_id TEXT NOT NULL REFERENCES messaging_messages(id) ON DELETE CASCADE,
  reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payload TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('open','resolved')),
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS messaging_reports_open ON messaging_reports(message_id, reporter_id) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS messaging_reports_status ON messaging_reports(status, seq);
`);

type ThreadRow = {
  seq: number;
  id: string;
  user_a: string;
  user_b: string;
  circle_id: string;
  payload: string;
  updated_at: string;
  read_a: number;
  read_b: number;
};
type MessageRow = {
  seq: number;
  id: string;
  conversation_id: string;
  sender_id: string;
  payload: string;
  created_at: string;
};
type ReportRow = {
  seq: number;
  id: string;
  message_id: string;
  reporter_id: string;
  payload: string;
  status: "open" | "resolved";
  created_at: string;
};
type BlockRow = {
  seq: number;
  blocker_id: string;
  blocked_id: string;
  payload: string;
  created_at: string;
};
const blockAliasSchema = z.object({ alias: z.string() });
const metadataSchema = z.object({
  aliasA: z.string(),
  aliasB: z.string(),
  circleName: z.string(),
});
const bodySchema = z.object({ body: z.string().min(1).max(2000) });
const reasonSchema = z.object({ reason: z.string().min(1).max(1000) });
const text = (maximum: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(maximum)
    .regex(
      /^[^\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]*$/,
      "Text contains unsupported control characters.",
    );
const empty = z.object({}).strict();
const pageSize = 30;
const cursorSchema = z
  .object({ scope: z.string(), before: z.number().int().positive().safe() })
  .strict();
function cursor(url: URL, scope: string): number {
  const value = url.searchParams.get("cursor");
  if (value === null) return Number.MAX_SAFE_INTEGER;
  try {
    if (!/^[A-Za-z0-9_-]{1,1000}$/.test(value)) throw new Error();
    const data = cursorSchema.parse(
      JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as unknown,
    );
    if (data.scope !== scope) throw new Error();
    return data.before;
  } catch {
    throw new ApiError(400, "Invalid pagination cursor. Refresh the list.");
  }
}
function page<T extends { seq: number }, R>(
  rows: T[],
  scope: string,
  map: (row: T) => R,
): PageResult<R> {
  const visible = rows.slice(0, pageSize);
  return {
    items: visible.map(map),
    nextCursor:
      rows.length > pageSize
        ? Buffer.from(
            JSON.stringify({ scope, before: visible[visible.length - 1].seq }),
          ).toString("base64url")
        : null,
  };
}
function thread(id: string, actorId: string): ThreadRow {
  const row = db
    .query<
      ThreadRow,
      [string]
    >("SELECT * FROM messaging_conversations WHERE id = ?")
    .get(id);
  if (!row || (row.user_a !== actorId && row.user_b !== actorId))
    throw new ApiError(404, "Conversation not found.");
  return row;
}
function blocked(blocker: string, other: string): boolean {
  return Boolean(
    db
      .query<
        { present: number },
        [string, string]
      >("SELECT 1 AS present FROM messaging_blocks WHERE blocker_id = ? AND blocked_id = ?")
      .get(blocker, other),
  );
}
function conversation(row: ThreadRow, actorId: string): MemberConversation {
  const meta = metadataSchema.parse(
    decrypt<unknown>(row.payload, `messaging:conversation:${row.id}`),
  );
  const isA = row.user_a === actorId;
  const peerId = isA ? row.user_b : row.user_a;
  const blockedByMe = blocked(actorId, peerId);
  const unread = db
    .query<
      { count: number },
      [string, string, number]
    >("SELECT COUNT(*) AS count FROM messaging_messages WHERE conversation_id = ? AND sender_id != ? AND seq > ?")
    .get(row.id, actorId, isA ? row.read_a : row.read_b);
  return {
    id: row.id,
    circleId: row.circle_id,
    circleName: meta.circleName,
    peer: { id: peerId, alias: isA ? meta.aliasB : meta.aliasA },
    updatedAt: row.updated_at,
    unreadCount: unread?.count ?? 0,
    blockedByMe,
    canSend: !blockedByMe && !blocked(peerId, actorId),
  };
}
function message(row: MessageRow): MemberMessage {
  const data = bodySchema.parse(
    decrypt<unknown>(row.payload, `messaging:message:${row.id}`),
  );
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: data.body,
    createdAt: row.created_at,
  };
}
function detail(row: ThreadRow, actorId: string, url: URL): ConversationDetail {
  const scope = `messages:${row.id}:${actorId}`;
  const rows = db
    .query<
      MessageRow,
      [string, number, number]
    >("SELECT * FROM messaging_messages WHERE conversation_id = ? AND seq < ? ORDER BY seq DESC LIMIT ?")
    .all(row.id, cursor(url, scope), pageSize + 1);
  return {
    conversation: conversation(row, actorId),
    messages: page(rows, scope, message),
  };
}
function report(row: ReportRow): MessageReport {
  const reported = db
    .query<
      MessageRow,
      [string]
    >("SELECT * FROM messaging_messages WHERE id = ?")
    .get(row.message_id);
  if (!reported) throw new ApiError(404, "Reported message no longer exists.");
  const parent = thread(reported.conversation_id, row.reporter_id);
  const meta = metadataSchema.parse(
    decrypt<unknown>(parent.payload, `messaging:conversation:${parent.id}`),
  );
  const reason = reasonSchema.parse(
    decrypt<unknown>(row.payload, `messaging:report:${row.id}`),
  );
  return {
    id: row.id,
    conversationId: parent.id,
    reportedMessage: message(reported),
    reporterAlias:
      row.reporter_id === parent.user_a ? meta.aliasA : meta.aliasB,
    senderAlias:
      reported.sender_id === parent.user_a ? meta.aliasA : meta.aliasB,
    reason: reason.reason,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function messagingApi(
  request: Request,
  path: string,
  context: DomainContext,
): Response {
  const actor = requireActor(context);
  const url = new URL(request.url);
  const method = request.method;
  if (path === "/messaging/blocks" && method === "GET") {
    const scope = `blocks:${actor.id}`;
    const rows = db
      .query<
        BlockRow,
        [string, number, number]
      >("SELECT * FROM messaging_blocks WHERE blocker_id = ? AND seq < ? ORDER BY seq DESC LIMIT ?")
      .all(actor.id, cursor(url, scope), pageSize + 1);
    return Response.json(
      page(rows, scope, (row): MemberBlock => {
        const meta = blockAliasSchema.parse(
          decrypt<unknown>(
            row.payload,
            `messaging:block:${row.blocker_id}:${row.blocked_id}`,
          ),
        );
        return {
          userId: row.blocked_id,
          alias: meta.alias,
          createdAt: row.created_at,
        };
      }),
    );
  }
  const blockRoute = /^\/messaging\/blocks\/([^/]+)$/.exec(path);
  if (blockRoute && method === "DELETE") {
    parseInput(empty, context.body);
    db.query(
      "DELETE FROM messaging_blocks WHERE blocker_id = ? AND blocked_id = ?",
    ).run(actor.id, blockRoute[1]);
    return Response.json({ ok: true });
  }
  if (path === "/messaging/conversations" && method === "GET") {
    const scope = `conversations:${actor.id}`;
    const rows = db
      .query<
        ThreadRow,
        [string, string, number, number]
      >("SELECT * FROM messaging_conversations WHERE (user_a = ? OR user_b = ?) AND seq < ? ORDER BY seq DESC LIMIT ?")
      .all(actor.id, actor.id, cursor(url, scope), pageSize + 1);
    return Response.json(
      page(rows, scope, (row) => conversation(row, actor.id)),
    );
  }
  if (path === "/messaging/conversations" && method === "POST") {
    const input = parseInput(
      z
        .object({
          circleId: z.string().min(1).max(200),
          recipientId: z.string().min(1).max(200),
        })
        .strict(),
      context.body,
    );
    context.limit(`messaging:start:${actor.id}`, 30, 60_000);
    if (input.recipientId === actor.id)
      throw new ApiError(400, "Choose another member.");
    const mine = getMessagingIdentity(input.circleId, actor.id);
    const theirs = getMessagingIdentity(input.circleId, input.recipientId);
    if (!mine || !theirs || !theirs.allowMessages)
      throw new ApiError(
        403,
        "Both people must be active members of an open circle, and the recipient must allow new messages.",
      );
    if (
      blocked(actor.id, input.recipientId) ||
      blocked(input.recipientId, actor.id)
    )
      throw new ApiError(403, "Messages are blocked between these accounts.");
    const [a, b] = [actor.id, input.recipientId].sort();
    let row = db
      .query<
        ThreadRow,
        [string, string]
      >("SELECT * FROM messaging_conversations WHERE user_a = ? AND user_b = ?")
      .get(a, b);
    if (!row) {
      const id = crypto.randomUUID();
      db.query(
        "INSERT INTO messaging_conversations (id, user_a, user_b, circle_id, payload, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      ).run(
        id,
        a,
        b,
        input.circleId,
        encrypt(
          {
            aliasA: a === actor.id ? mine.alias : theirs.alias,
            aliasB: b === actor.id ? mine.alias : theirs.alias,
            circleName: mine.circleName,
          },
          `messaging:conversation:${id}`,
        ),
        new Date().toISOString(),
      );
      row = thread(id, actor.id);
    }
    return Response.json(
      detail(row, actor.id, new URL(request.url.split("?")[0])),
    );
  }
  const conversationRoute =
    /^\/messaging\/conversations\/([^/]+)(?:\/(messages|read|block))?$/.exec(
      path,
    );
  if (conversationRoute) {
    const [, id, action] = conversationRoute;
    if (!action && method === "GET")
      return Response.json(detail(thread(id, actor.id), actor.id, url));
    if (!action && method === "DELETE") {
      parseInput(empty, context.body);
      thread(id, actor.id);
      db.transaction(() => {
        db.query("DELETE FROM messaging_conversations WHERE id = ?").run(id);
        audit(actor.id, "messaging.thread.delete", id);
      })();
      return Response.json({ ok: true });
    }
    if (action === "messages" && method === "POST") {
      const input = parseInput(
        z.object({ body: text(2000) }).strict(),
        context.body,
      );
      const parent = thread(id, actor.id);
      if (!conversation(parent, actor.id).canSend)
        throw new ApiError(403, "Messages are blocked between these accounts.");
      context.limit(`messaging:send:${actor.id}`, 30, 60_000);
      const messageId = crypto.randomUUID();
      const createdAt = new Date(
        Math.max(Date.now(), Date.parse(parent.updated_at) + 1),
      ).toISOString();
      db.transaction(() => {
        db.query(
          "INSERT INTO messaging_messages (id, conversation_id, sender_id, payload, created_at) VALUES (?, ?, ?, ?, ?)",
        ).run(
          messageId,
          id,
          actor.id,
          encrypt(input, `messaging:message:${messageId}`),
          createdAt,
        );
        db.query(
          "UPDATE messaging_conversations SET updated_at = ? WHERE id = ?",
        ).run(createdAt, id);
      })();
      return Response.json({
        id: messageId,
        conversationId: id,
        senderId: actor.id,
        body: input.body,
        createdAt,
      } satisfies MemberMessage);
    }
    if (action === "read" && method === "POST") {
      parseInput(empty, context.body);
      const parent = thread(id, actor.id);
      const field = parent.user_a === actor.id ? "read_a" : "read_b";
      db.query(
        `UPDATE messaging_conversations SET ${field} = COALESCE((SELECT MAX(seq) FROM messaging_messages WHERE conversation_id = ?), 0) WHERE id = ?`,
      ).run(id, id);
      return Response.json({ ok: true });
    }
    if (action === "block" && method === "POST") {
      const input = parseInput(
        z.object({ blocked: z.boolean() }).strict(),
        context.body,
      );
      const parent = thread(id, actor.id);
      const peer = parent.user_a === actor.id ? parent.user_b : parent.user_a;
      if (input.blocked) {
        const meta = metadataSchema.parse(
          decrypt<unknown>(
            parent.payload,
            `messaging:conversation:${parent.id}`,
          ),
        );
        const alias = parent.user_a === actor.id ? meta.aliasB : meta.aliasA;
        db.query(
          "INSERT OR IGNORE INTO messaging_blocks (blocker_id, blocked_id, payload, created_at) VALUES (?, ?, ?, ?)",
        ).run(
          actor.id,
          peer,
          encrypt({ alias }, `messaging:block:${actor.id}:${peer}`),
          new Date().toISOString(),
        );
      } else
        db.query(
          "DELETE FROM messaging_blocks WHERE blocker_id = ? AND blocked_id = ?",
        ).run(actor.id, peer);
      return Response.json({ ok: true });
    }
  }
  const reportRoute = /^\/messaging\/messages\/([^/]+)\/report$/.exec(path);
  if (reportRoute && method === "POST") {
    const input = parseInput(
      z.object({ reason: text(1000), consent: z.literal(true) }).strict(),
      context.body,
    );
    const reported = db
      .query<
        MessageRow,
        [string]
      >("SELECT * FROM messaging_messages WHERE id = ?")
      .get(reportRoute[1]);
    if (!reported) throw new ApiError(404, "Message not found.");
    thread(reported.conversation_id, actor.id);
    context.limit(`messaging:report:${actor.id}`, 10, 60_000);
    const existing = db
      .query<
        { id: string },
        [string, string]
      >("SELECT id FROM messaging_reports WHERE message_id = ? AND reporter_id = ? AND status = 'open'")
      .get(reported.id, actor.id);
    if (existing) return Response.json({ id: existing.id, status: "received" });
    const id = crypto.randomUUID();
    db.query(
      "INSERT INTO messaging_reports (id, message_id, reporter_id, payload, status, created_at) VALUES (?, ?, ?, ?, 'open', ?)",
    ).run(
      id,
      reported.id,
      actor.id,
      encrypt({ reason: input.reason }, `messaging:report:${id}`),
      new Date().toISOString(),
    );
    return Response.json({ id, status: "received" });
  }
  if (path === "/messaging/reports" && method === "GET") {
    requireActor(context, true);
    const status = parseInput(
      z.enum(["open", "resolved"]),
      url.searchParams.get("status") ?? "open",
    );
    const scope = `reports:${status}:${actor.id}`;
    const rows = db
      .query<
        ReportRow,
        [string, number, number]
      >("SELECT * FROM messaging_reports WHERE status = ? AND seq < ? ORDER BY seq DESC LIMIT ?")
      .all(status, cursor(url, scope), pageSize + 1);
    return Response.json(page(rows, scope, report));
  }
  const moderationRoute = /^\/messaging\/reports\/([^/]+)$/.exec(path);
  if (moderationRoute && method === "PATCH") {
    requireActor(context, true);
    const input = parseInput(
      z.object({ action: z.enum(["resolve", "remove-message"]) }).strict(),
      context.body,
    );
    const row = db
      .query<
        ReportRow,
        [string]
      >("SELECT * FROM messaging_reports WHERE id = ?")
      .get(moderationRoute[1]);
    if (!row) throw new ApiError(404, "Report no longer exists.");
    db.transaction(() => {
      if (input.action === "remove-message")
        db.query("DELETE FROM messaging_messages WHERE id = ?").run(
          row.message_id,
        );
      else
        db.query(
          "UPDATE messaging_reports SET status = 'resolved' WHERE id = ?",
        ).run(row.id);
      audit(actor.id, `messaging.report.${input.action}`, row.id);
    })();
    return Response.json({ ok: true });
  }
  throw new ApiError(404, "Messaging route not found.");
}
