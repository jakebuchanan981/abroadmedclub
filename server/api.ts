import { randomBytes } from "node:crypto";
import type {
  Inquiry,
  ProviderApplication,
  SupportRequest,
  User,
} from "../src/healthcare/types";
import {
  getCatalog,
  publishedTarget,
  publishDraft,
  saveDraft,
  suspendProvider,
} from "./catalog";
import {
  audit,
  db,
  decrypt,
  digest,
  emailDigest,
  encrypt,
  publicUser,
  type UserRow,
} from "./storage";
import {
  ApiError,
  email,
  httpsUrl,
  identifier,
  object,
  password,
  text,
} from "./validation";
import { communityApi } from "./community";
import { messagingApi } from "./messaging";
import { travelApi } from "./travel";
import type { DomainContext } from "./domain";

const SESSION_MS = 7 * 24 * 60 * 60 * 1000;
const COOKIE = "amc_session";
const MAX_BODY = 512 * 1024;
const limits = new Map<string, { count: number; expires: number }>();
let activeHashes = 0;

export function rateLimit(
  key: string,
  maximum: number,
  windowMs: number,
): void {
  const now = Date.now();
  let entry = limits.get(key);
  if (entry && entry.expires <= now) {
    limits.delete(key);
    entry = undefined;
  }
  if (!entry) {
    if (limits.size >= 10000) {
      for (const [expiredKey, value] of limits)
        if (value.expires <= now) limits.delete(expiredKey);
      if (limits.size >= 10000)
        throw new ApiError(
          429,
          "Server request capacity reached. Please try again later.",
        );
    }
    entry = { count: 0, expires: now + windowMs };
    limits.set(key, entry);
  }
  if (++entry.count > maximum)
    throw new ApiError(429, "Too many requests. Please try again later.");
}

async function hashPassword(value: string): Promise<string> {
  if (activeHashes >= 4)
    throw new ApiError(
      503,
      "Sign-in service is busy. Please try again shortly.",
    );
  activeHashes++;
  try {
    return await Bun.password.hash(value, {
      algorithm: "argon2id",
      memoryCost: 65536,
      timeCost: 3,
    });
  } finally {
    activeHashes--;
  }
}

async function checkPassword(value: string, hash: string): Promise<boolean> {
  if (activeHashes >= 4)
    throw new ApiError(
      503,
      "Sign-in service is busy. Please try again shortly.",
    );
  activeHashes++;
  try {
    return await Bun.password.verify(value, hash);
  } finally {
    activeHashes--;
  }
}

export async function jsonBody(request: Request): Promise<unknown> {
  if (
    !/^application\/json(?:\s*;|$)/i.test(
      request.headers.get("content-type") || "",
    )
  )
    throw new ApiError(415, "Use application/json for request bodies.");
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_BODY))
    throw new ApiError(413, "Request body is too large.");
  if (!request.body) throw new ApiError(400, "A JSON body is required.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      total += next.value.byteLength;
      if (total > MAX_BODY) {
        await reader.cancel();
        throw new ApiError(413, "Request body is too large.");
      }
      chunks.push(next.value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.");
  }
}

type Session = { user: User; row: UserRow; tokenHash: string };
function session(request: Request): Session | null {
  const authorization = request.headers.get("authorization");
  let token: string | undefined;
  if (authorization) {
    const match = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(authorization);
    if (!match) throw new ApiError(401, "Invalid authorization token.");
    token = match[1];
  } else {
    token = request.headers
      .get("cookie")
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${COOKIE}=`))
      ?.slice(COOKIE.length + 1);
  }
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const tokenHash = digest(token);
  const row = db
    .query<
      UserRow,
      [string, number]
    >("SELECT users.id, users.payload, users.password_hash, users.role FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ? AND sessions.expires_at > ?")
    .get(tokenHash, Date.now());
  return row ? { user: publicUser(row), row, tokenHash } : null;
}

function authenticated(current: Session | null, staff = false): Session {
  if (!current) throw new ApiError(401, "Sign in to continue.");
  if (staff && current.user.role !== "staff")
    throw new ApiError(403, "Staff access is required.");
  return current;
}

function cookie(token: string, secure: boolean, clear = false): string {
  return `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=${clear ? 0 : SESSION_MS / 1000}${secure ? "; Secure" : ""}`;
}

function issueSession(user: User, secure: boolean): Response {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  db.query("DELETE FROM sessions WHERE expires_at <= ?").run(now);
  db.query(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
  ).run(digest(token), user.id, now + SESSION_MS);
  return Response.json(
    { user, token },
    { headers: { "Set-Cookie": cookie(token, secure) } },
  );
}

type PrivateRow = { id: string; payload: string };
function ownInquiry(id: string, current: Session): Inquiry {
  const row = db
    .query<
      PrivateRow & { user_id: string },
      [string]
    >("SELECT id, user_id, payload FROM inquiries WHERE id = ?")
    .get(id);
  if (
    !row ||
    (row.user_id !== current.user.id && current.user.role !== "staff")
  )
    throw new ApiError(404, "Inquiry not found.");
  return decrypt<Inquiry>(row.payload, `inquiry:${row.id}`);
}

function storeInquiry(inquiry: Inquiry): void {
  db.query("UPDATE inquiries SET payload = ?, updated_at = ? WHERE id = ?").run(
    encrypt(inquiry, `inquiry:${inquiry.id}`),
    inquiry.updatedAt,
    inquiry.id,
  );
}

function consent(value: unknown): void {
  if (value !== true)
    throw new ApiError(
      400,
      "Explicit consent to store and review your request is required.",
    );
}

async function dispatchApi(
  request: Request,
  path: string,
  ip: string,
  secureCookie: boolean,
  currentSession: Session | null,
  json: unknown,
): Promise<Response> {
  const method = request.method;

  if (
    path.startsWith("/community/") ||
    path.startsWith("/messaging/") ||
    path.startsWith("/travel/")
  ) {
    const context: DomainContext = {
      actor: currentSession
        ? { id: currentSession.user.id, role: currentSession.user.role }
        : null,
      body: json,
      limit: rateLimit,
    };
    const handler = path.startsWith("/community/")
      ? communityApi
      : path.startsWith("/messaging/")
        ? messagingApi
        : travelApi;
    return handler(request, path, context);
  }

  if (path === "/catalog" && method === "GET")
    return Response.json(getCatalog());
  if (path === "/auth/session" && method === "GET")
    return Response.json({ user: currentSession?.user || null });
  if (path === "/auth/register" && method === "POST") {
    rateLimit(`register:${ip}`, 5, 3600000);
    const body = object(json, ["name", "email", "password"]);
    const name = text(body.name, "Name", 120);
    const address = email(body.email);
    const secret = password(body.password);
    const emailHash = emailDigest(address);
    if (db.query("SELECT id FROM users WHERE email_hash = ?").get(emailHash))
      throw new ApiError(409, "An account already uses this email address.");
    const hash = await hashPassword(secret);
    const user: User = {
      id: crypto.randomUUID(),
      name,
      email: address,
      role: "patient",
    };
    return db.transaction(() => {
      if (db.query("SELECT id FROM users WHERE email_hash = ?").get(emailHash))
        throw new ApiError(409, "An account already uses this email address.");
      db.query(
        "INSERT INTO users (id, email_hash, payload, password_hash, role, created_at) VALUES (?, ?, ?, ?, 'patient', ?)",
      ).run(
        user.id,
        emailHash,
        encrypt({ name, email: address }, `user:${user.id}`),
        hash,
        new Date().toISOString(),
      );
      return issueSession(user, secureCookie);
    })();
  }
  if (path === "/auth/login" && method === "POST") {
    const body = object(json, ["email", "password"]);
    const address = email(body.email);
    const secret = password(body.password);
    rateLimit(`login:${emailDigest(address)}`, 15, 900000);
    const row = db
      .query<
        UserRow,
        [string]
      >("SELECT id, payload, password_hash, role FROM users WHERE email_hash = ?")
      .get(emailDigest(address));
    if (!row) {
      // Equivalent expensive operation discourages account discovery by response timing.
      await hashPassword(secret);
      throw new ApiError(401, "Email or password is incorrect.");
    }
    if (!(await checkPassword(secret, row.password_hash)))
      throw new ApiError(401, "Email or password is incorrect.");
    return db.transaction(() => {
      const live = db
        .query<
          UserRow,
          [string]
        >("SELECT id, payload, password_hash, role FROM users WHERE id = ?")
        .get(row.id);
      if (!live || live.password_hash !== row.password_hash)
        throw new ApiError(401, "Account changed. Please sign in again.");
      return issueSession(publicUser(live), secureCookie);
    })();
  }
  if (path === "/auth/logout" && method === "POST") {
    object(json, []);
    const current = currentSession;
    if (current)
      db.query("DELETE FROM sessions WHERE token_hash = ?").run(
        current.tokenHash,
      );
    return Response.json(
      { ok: true },
      { headers: { "Set-Cookie": cookie("", secureCookie, true) } },
    );
  }
  if (path === "/auth/password" && method === "PATCH") {
    const current = authenticated(currentSession);
    const body = object(json, ["currentPassword", "newPassword"]);
    const oldPassword = password(body.currentPassword, "Current password");
    const newPassword = password(body.newPassword, "New password");
    if (!(await checkPassword(oldPassword, current.row.password_hash)))
      throw new ApiError(403, "Current password is incorrect.");
    const hash = await hashPassword(newPassword);
    db.transaction(() => {
      authenticated(session(request));
      const changed = db
        .query(
          "UPDATE users SET password_hash = ? WHERE id = ? AND password_hash = ?",
        )
        .run(hash, current.user.id, current.row.password_hash);
      if (!changed.changes)
        throw new ApiError(409, "Account changed. Please sign in again.");
      db.query(
        "DELETE FROM sessions WHERE user_id = ? AND token_hash != ?",
      ).run(current.user.id, current.tokenHash);
      audit(current.user.id, "account.password-changed", current.user.id);
    })();
    return Response.json({ ok: true });
  }
  if (path === "/auth/account" && method === "DELETE") {
    const current = authenticated(currentSession);
    const body = object(json, ["password"]);
    if (
      !(await checkPassword(password(body.password), current.row.password_hash))
    )
      throw new ApiError(403, "Password is incorrect.");
    db.transaction(() => {
      const live = authenticated(session(request));
      if (live.user.role === "staff") {
        const count = db
          .query<
            { count: number },
            []
          >("SELECT count(*) AS count FROM users WHERE role = 'staff'")
          .get()!.count;
        if (count <= 1)
          throw new ApiError(
            409,
            "The only staff account cannot be deleted. Create another staff account through the bootstrap command first.",
          );
      }
      const deleted = db
        .query("DELETE FROM users WHERE id = ? AND password_hash = ?")
        .run(current.user.id, current.row.password_hash);
      if (!deleted.changes)
        throw new ApiError(409, "Account changed. Please sign in again.");
      // Account-owned records cascade; audit retains only opaque identifiers.
      audit(current.user.id, "account.deleted", current.user.id);
    })();
    return Response.json(
      { ok: true },
      { headers: { "Set-Cookie": cookie("", secureCookie, true) } },
    );
  }

  if (path === "/inquiries" && method === "GET") {
    const current = authenticated(currentSession);
    const rows = db
      .query<
        PrivateRow,
        [string]
      >("SELECT id, payload FROM inquiries WHERE user_id = ? ORDER BY updated_at DESC, id")
      .all(current.user.id);
    return Response.json(
      rows.map((row) => decrypt<Inquiry>(row.payload, `inquiry:${row.id}`)),
    );
  }
  if (path === "/inquiries" && method === "POST") {
    const current = authenticated(currentSession);
    rateLimit(`inquiry:${current.user.id}`, 20, 3600000);
    const body = object(json, [
      "providerId",
      "offeringId",
      "message",
      "consent",
    ]);
    consent(body.consent);
    const providerId = identifier(body.providerId, "Provider ID");
    const offeringId =
      body.offeringId === undefined
        ? undefined
        : identifier(body.offeringId, "Offering ID");
    const message = text(body.message, "Message", 2000, 10);
    const inquiry = db.transaction(() => {
      const target = publishedTarget(providerId, offeringId);
      const now = new Date().toISOString();
      const value: Inquiry = {
        id: crypto.randomUUID(),
        userId: current.user.id,
        providerId,
        providerName: target.provider.name,
        offeringId: offeringId || null,
        status: "received",
        createdAt: now,
        updatedAt: now,
        messages: [
          {
            id: crypto.randomUUID(),
            sender: current.user.role === "staff" ? "staff" : "patient",
            body: message,
            createdAt: now,
          },
        ],
      };
      db.query(
        "INSERT INTO inquiries (id, user_id, payload, updated_at) VALUES (?, ?, ?, ?)",
      ).run(value.id, value.userId, encrypt(value, `inquiry:${value.id}`), now);
      return value;
    })();
    return Response.json(inquiry, { status: 201 });
  }
  const inquiryMatch = /^\/inquiries\/([a-z0-9-]+)(\/messages)?$/.exec(path);
  if (inquiryMatch) {
    const current = authenticated(currentSession);
    const id = identifier(inquiryMatch[1]);
    if (!inquiryMatch[2] && method === "GET")
      return Response.json(ownInquiry(id, current));
    if (inquiryMatch[2] && method === "POST") {
      rateLimit(`message:${current.user.id}`, 30, 600000);
      const body = object(json, ["body"]);
      const message = text(body.body, "Message", 2000);
      const inquiry = db.transaction(() => {
        const value = ownInquiry(id, current);
        if (value.status === "closed")
          throw new ApiError(
            409,
            "This inquiry is closed. Start a new inquiry if you need further help.",
          );
        if (value.messages.length >= 200)
          throw new ApiError(
            409,
            "This thread has reached its message limit. Close it and start a new inquiry.",
          );
        const now = new Date().toISOString();
        value.messages.push({
          id: crypto.randomUUID(),
          sender: current.user.role === "staff" ? "staff" : "patient",
          body: message,
          createdAt: now,
        });
        value.status = current.user.role === "staff" ? "responded" : "received";
        value.updatedAt = now;
        storeInquiry(value);
        if (current.user.role === "staff")
          audit(current.user.id, "inquiry.replied", value.id);
        return value;
      })();
      return Response.json(inquiry);
    }
    if (!inquiryMatch[2] && method === "PATCH") {
      const body = object(json, ["status"]);
      if (body.status !== "closed")
        throw new ApiError(400, "Only closing an inquiry is supported.");
      const inquiry = db.transaction(() => {
        const value = ownInquiry(id, current);
        value.status = "closed";
        value.updatedAt = new Date().toISOString();
        storeInquiry(value);
        if (current.user.role === "staff")
          audit(current.user.id, "inquiry.closed", value.id);
        return value;
      })();
      return Response.json(inquiry);
    }
  }

  if (path === "/support" && method === "POST") {
    rateLimit(`support:${ip}`, 5, 3600000);
    const body = object(json, ["name", "email", "topic", "message", "consent"]);
    consent(body.consent);
    const value: SupportRequest = {
      id: crypto.randomUUID(),
      name: text(body.name, "Name", 120),
      email: email(body.email),
      topic: text(body.topic, "Topic", 100),
      message: text(body.message, "Message", 2000, 10),
      status: "received",
      createdAt: new Date().toISOString(),
    };
    db.query(
      "INSERT INTO support (id, payload, created_at) VALUES (?, ?, ?)",
    ).run(value.id, encrypt(value, `support:${value.id}`), value.createdAt);
    return Response.json(
      { id: value.id, status: value.status },
      { status: 201 },
    );
  }
  if (path === "/provider-applications" && method === "POST") {
    rateLimit(`application:${ip}`, 5, 3600000);
    const body = object(json, [
      "organization",
      "contactName",
      "email",
      "website",
      "countryCode",
      "city",
      "message",
      "consent",
    ]);
    consent(body.consent);
    const countryCode = text(body.countryCode, "Country code", 2, 2);
    if (!getCatalog().countries.some((country) => country.code === countryCode))
      throw new ApiError(400, "Choose a listed country.");
    const value: ProviderApplication = {
      id: crypto.randomUUID(),
      organization: text(body.organization, "Organization", 160),
      contactName: text(body.contactName, "Contact name", 120),
      email: email(body.email),
      website: httpsUrl(body.website, "Official website"),
      countryCode,
      city: text(body.city, "City", 120),
      message: text(body.message, "Message", 2000, 10),
      status: "received",
      createdAt: new Date().toISOString(),
    };
    db.query(
      "INSERT INTO applications (id, payload, created_at) VALUES (?, ?, ?)",
    ).run(value.id, encrypt(value, `application:${value.id}`), value.createdAt);
    return Response.json(
      { id: value.id, status: value.status },
      { status: 201 },
    );
  }

  if (path.startsWith("/admin/")) {
    const current = authenticated(currentSession, true);
    if (path === "/admin/catalog" && method === "GET")
      return Response.json(getCatalog(true));
    const providerMatch =
      /^\/admin\/providers\/([a-z0-9-]+)(\/(publish|suspend))?$/.exec(path);
    if (providerMatch) {
      const id = identifier(providerMatch[1], "Provider ID");
      if (!providerMatch[2] && method === "PUT")
        return Response.json(saveDraft(id, json, current.user.id));
      if (providerMatch[3] === "publish" && method === "POST") {
        const body = object(json, ["reviewConfirmed", "reviewedUpdatedAt"]);
        if (body.reviewConfirmed !== true)
          throw new ApiError(
            400,
            "Confirm review of the exact draft and its official sources before publication.",
          );
        publishDraft(
          id,
          current.user.id,
          text(body.reviewedUpdatedAt, "Reviewed draft timestamp", 40),
        );
        return Response.json({ ok: true });
      }
      if (providerMatch[3] === "suspend" && method === "POST") {
        object(json, []);
        suspendProvider(id, current.user.id);
        return Response.json({ ok: true });
      }
    }
    if (path === "/admin/inquiries" && method === "GET") {
      const rows = db
        .query<
          PrivateRow,
          []
        >("SELECT id, payload FROM inquiries ORDER BY updated_at DESC, id")
        .all();
      return Response.json(
        rows.map((row) => decrypt<Inquiry>(row.payload, `inquiry:${row.id}`)),
      );
    }
    if (path === "/admin/support" && method === "GET") {
      const rows = db
        .query<
          PrivateRow,
          []
        >("SELECT id, payload FROM support ORDER BY created_at DESC, id")
        .all();
      return Response.json(
        rows.map((row) =>
          decrypt<SupportRequest>(row.payload, `support:${row.id}`),
        ),
      );
    }
    if (path === "/admin/provider-applications" && method === "GET") {
      const rows = db
        .query<
          PrivateRow,
          []
        >("SELECT id, payload FROM applications ORDER BY created_at DESC, id")
        .all();
      return Response.json(
        rows.map((row) =>
          decrypt<ProviderApplication>(row.payload, `application:${row.id}`),
        ),
      );
    }
    const supportMatch = /^\/admin\/support\/([a-z0-9-]+)$/.exec(path);
    if (supportMatch && method === "PATCH") {
      const body = object(json, ["status"]);
      if (body.status !== "closed")
        throw new ApiError(400, "Only closing a support request is supported.");
      db.transaction(() => {
        const row = db
          .query<
            PrivateRow,
            [string]
          >("SELECT id, payload FROM support WHERE id = ?")
          .get(supportMatch[1]!);
        if (!row) throw new ApiError(404, "Support request not found.");
        const value = decrypt<SupportRequest>(row.payload, `support:${row.id}`);
        value.status = "closed";
        db.query("UPDATE support SET payload = ? WHERE id = ?").run(
          encrypt(value, `support:${row.id}`),
          row.id,
        );
        audit(current.user.id, "support.closed", row.id);
      })();
      return Response.json({ ok: true });
    }
    const applicationMatch =
      /^\/admin\/provider-applications\/([a-z0-9-]+)$/.exec(path);
    if (applicationMatch && method === "PATCH") {
      const body = object(json, ["status"]);
      const status = body.status;
      if (
        status !== "reviewing" &&
        status !== "approved" &&
        status !== "declined"
      )
        throw new ApiError(400, "Invalid application review status.");
      db.transaction(() => {
        const row = db
          .query<
            PrivateRow,
            [string]
          >("SELECT id, payload FROM applications WHERE id = ?")
          .get(applicationMatch[1]!);
        if (!row) throw new ApiError(404, "Provider application not found.");
        const value = decrypt<ProviderApplication>(
          row.payload,
          `application:${row.id}`,
        );
        value.status = status;
        db.query("UPDATE applications SET payload = ? WHERE id = ?").run(
          encrypt(value, `application:${row.id}`),
          row.id,
        );
        audit(current.user.id, `application.${status}`, row.id);
      })();
      return Response.json({ ok: true });
    }
  }
  throw new ApiError(404, "API endpoint not found.");
}

export async function api(
  request: Request,
  path: string,
  ip: string,
  secureCookie: boolean,
): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD")
    rateLimit(`write:${ip}`, 90, 60000);
  if (path.startsWith("/auth/") && request.method !== "GET")
    rateLimit(`auth:${ip}`, 15, 60000);
  // Do not retain authorization while an unfinished request body can yield.
  const json =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await jsonBody(request);
  const current = session(request);
  const account = current?.user.id ?? "anonymous";
  const expected = request.headers.get("X-AMC-Expected-Account");
  // A cookie changed in another tab must not write this tab's draft into that account.
  const response =
    expected !== null && expected !== account
      ? Response.json(
          { error: "The account session changed. Refresh before continuing." },
          { status: 409 },
        )
      : await dispatchApi(request, path, ip, secureCookie, current, json);
  response.headers.set("X-AMC-Account", account);
  return response;
}
