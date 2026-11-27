/* Creates (or resets the password of) an admin account.
   Usage: ADMIN_EMAIL=… ADMIN_PASSWORD=… ADMIN_NAME=… npm run admin:create */
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { withDb } from "./env";

const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "";
const name = process.env.ADMIN_NAME || "Administrator";

if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || password.length < 10) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 10 characters).");
  process.exit(1);
}

withDb(async (db) => {
  const hash = await bcrypt.hash(password, 12);
  await db.collection<{ _id: string }>("users").updateOne(
    { email },
    { $set: { password_hash: hash, role: "admin", active: true }, $setOnInsert: { _id: randomUUID(), email, name, created_at: new Date(), last_login_at: null } },
    { upsert: true },
  );
  console.log(`admin ready: ${email}`);
});
