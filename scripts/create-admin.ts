/* Creates (or resets the password of) an admin account.
   Usage: ADMIN_EMAIL=… ADMIN_PASSWORD=… ADMIN_NAME=… npm run admin:create
   With --if-none, does nothing once any account exists (used automatically on deploy). */
import bcrypt from "bcryptjs";
import type postgres from "postgres";
import { run } from "./env";

export async function createAdmin(sql: postgres.Sql, opts: { ifNone?: boolean } = {}) {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const name = process.env.ADMIN_NAME || "Administrator";
  if (opts.ifNone) {
    const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from users`;
    if (n > 0) return;
    if (!email || !password) {
      console.log("no admin account yet: set ADMIN_EMAIL and ADMIN_PASSWORD to create one on the next deploy");
      return;
    }
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || password.length < 10) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 10 characters).");
  }
  const hash = await bcrypt.hash(password, 12);
  await sql`
    insert into users (email, name, password_hash, role) values (${email}, ${name}, ${hash}, 'admin')
    on conflict (email) do update set password_hash = excluded.password_hash, role = 'admin', active = true`;
  console.log(`admin ready: ${email}`);
}

if (process.argv[1]?.endsWith("create-admin.ts")) run((sql) => createAdmin(sql, { ifNone: process.argv.includes("--if-none") }));
