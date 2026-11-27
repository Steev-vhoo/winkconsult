/* Creates (or resets the password of) an admin account.
   Usage: ADMIN_EMAIL=… ADMIN_PASSWORD=… ADMIN_NAME=… npm run admin:create */
import bcrypt from "bcryptjs";
import postgres from "postgres";
import { loadEnv } from "./env";

loadEnv();
const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "";
const name = process.env.ADMIN_NAME || "Administrator";

if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || password.length < 10) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 10 characters).");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });
bcrypt.hash(password, 12)
  .then((hash) => sql`
    insert into users (email, name, password_hash, role) values (${email}, ${name}, ${hash}, 'admin')
    on conflict (email) do update set password_hash = excluded.password_hash, role = 'admin', active = true`)
  .then(() => { console.log(`admin ready: ${email}`); return sql.end(); })
  .catch(async (e) => { console.error(e); await sql.end(); process.exit(1); });
