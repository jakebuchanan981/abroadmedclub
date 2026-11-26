import { Database } from "bun:sqlite";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
} from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { User } from "../src/healthcare/types";

export const dataDir = resolve(
  process.env.DATA_DIR || fileURLToPath(new URL(".data", import.meta.url)),
);
mkdirSync(dataDir, { recursive: true, mode: 0o700 });
chmodSync(dataDir, 0o700);
const keyPath = resolve(dataDir, "private.key");
const databasePath = resolve(dataDir, "directory.sqlite");
// Losing the encryption key makes private records unrecoverable. Never silently replace it.
if (!existsSync(keyPath)) {
  if (existsSync(databasePath))
    throw new Error(
      "Private encryption key missing; restore it before opening the database.",
    );
  writeFileSync(keyPath, randomBytes(32), { flag: "wx", mode: 0o600 });
}
chmodSync(keyPath, 0o600);
const privateKey = readFileSync(keyPath);
if (privateKey.length !== 32)
  throw new Error("Invalid private encryption key.");
export const db = new Database(databasePath, { create: true, strict: true });
chmodSync(databasePath, 0o600);
db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, email_hash TEXT UNIQUE NOT NULL, payload TEXT NOT NULL,
  password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('patient','staff')),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY, state TEXT NOT NULL CHECK(state IN ('draft','published','suspended')),
  published TEXT, draft TEXT, revision INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payload TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS inquiries_user ON inquiries(user_id, updated_at);
CREATE TABLE IF NOT EXISTS support (
  id TEXT PRIMARY KEY, payload TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY, payload TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS audit (
  id TEXT PRIMARY KEY, actor_id TEXT NOT NULL, action TEXT NOT NULL,
  target_id TEXT NOT NULL, revision INTEGER, payload TEXT, created_at TEXT NOT NULL
);
`);
// WAL/SHM are additionally protected by the private containing directory.
for (const suffix of ["-wal", "-shm"]) {
  if (existsSync(databasePath + suffix))
    chmodSync(databasePath + suffix, 0o600);
}

export function encrypt(value: unknown, context: string): string {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", privateKey, nonce);
  cipher.setAAD(Buffer.from(context));
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  return [
    "v1",
    nonce.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    ciphertext.toString("base64"),
  ].join(".");
}

export function decrypt<T>(payload: string, context: string): T {
  const [version, nonce, tag, ciphertext, extra] = payload.split(".");
  if (version !== "v1" || !nonce || !tag || !ciphertext || extra)
    throw new Error("Invalid private record.");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    privateKey,
    Buffer.from(nonce, "base64"),
  );
  decipher.setAAD(Buffer.from(context));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return JSON.parse(
    Buffer.concat([
      decipher.update(Buffer.from(ciphertext, "base64")),
      decipher.final(),
    ]).toString("utf8"),
  ) as T;
}

export function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export type UserRow = {
  id: string;
  payload: string;
  password_hash: string;
  role: User["role"];
};
export function emailDigest(address: string): string {
  return createHmac("sha256", privateKey)
    .update(`email:${address}`)
    .digest("hex");
}

export function publicUser(row: UserRow): User {
  const identity = decrypt<{ name: string; email: string }>(
    row.payload,
    `user:${row.id}`,
  );
  return { id: row.id, ...identity, role: row.role };
}

export function audit(
  actorId: string,
  action: string,
  targetId: string,
  revision: number | null = null,
  payload: unknown = null,
): void {
  const id = crypto.randomUUID();
  db.query(
    "INSERT INTO audit (id, actor_id, action, target_id, revision, payload, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(
    id,
    actorId,
    action,
    targetId,
    revision,
    payload === null ? null : encrypt(payload, `audit:${id}`),
    new Date().toISOString(),
  );
}
