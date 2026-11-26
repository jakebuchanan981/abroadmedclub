import { audit, db, emailDigest, encrypt } from "./storage";
import { ApiError, email, password, text } from "./validation";

async function main(): Promise<void> {
  if (process.argv.length !== 3 || process.argv[2] !== "create-staff") {
    throw new ApiError(
      400,
      "Usage: STAFF_EMAIL=<email> STAFF_NAME=<name> STAFF_PASSWORD=<12–128 characters> bun server/manage.ts create-staff. Supply credentials explicitly; no default account exists.",
    );
  }
  const address = email(process.env.STAFF_EMAIL);
  const name = text(process.env.STAFF_NAME, "STAFF_NAME", 120);
  const secret = password(process.env.STAFF_PASSWORD, "STAFF_PASSWORD");
  // Credentials are accepted only through the environment, never printed or stored as plaintext.
  delete process.env.STAFF_PASSWORD;
  const emailHash = emailDigest(address);
  if (db.query("SELECT id FROM users WHERE email_hash = ?").get(emailHash))
    throw new ApiError(
      409,
      "That account already exists. Bootstrap never silently promotes or replaces an existing user.",
    );
  const hash = await Bun.password.hash(secret, {
    algorithm: "argon2id",
    memoryCost: 65536,
    timeCost: 3,
  });
  const id = crypto.randomUUID();
  db.transaction(() => {
    if (db.query("SELECT id FROM users WHERE email_hash = ?").get(emailHash))
      throw new ApiError(409, "That account already exists.");
    db.query(
      "INSERT INTO users (id, email_hash, payload, password_hash, role, created_at) VALUES (?, ?, ?, ?, 'staff', ?)",
    ).run(
      id,
      emailHash,
      encrypt({ name, email: address }, `user:${id}`),
      hash,
      new Date().toISOString(),
    );
    audit(id, "staff.bootstrap", id);
  })();
  console.info(
    "Staff account created. Sign in through the application; no email was sent.",
  );
}

try {
  await main();
} catch (error) {
  console.error(
    error instanceof ApiError
      ? error.message
      : "Staff account creation failed; private details withheld.",
  );
  process.exitCode = 1;
} finally {
  db.close();
}
