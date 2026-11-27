import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { sql } from "./db";
import { ipHash, randomToken, sha256 } from "./security";

export const SESSION_COOKIE = "wink_session";
const SESSION_DAYS = 14;
const MAX_FAILED_PER_15_MIN = 8;

export type Role = "admin" | "staff";
export type User = { id: string; email: string; name: string; role: Role };

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12);
}

export async function createSession(userId: string) {
  const token = randomToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  await sql`insert into sessions (id, user_id, expires_at) values (${sha256(token)}, ${userId}, ${expires})`;
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await sql`delete from sessions where id = ${sha256(token)}`;
  jar.delete(SESSION_COOKIE);
}

/** The signed-in user for this request, or null. */
export const getUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await sql<User[]>`
    select u.id, u.email, u.name, u.role
    from sessions s join users u on u.id = s.user_id
    where s.id = ${sha256(token)} and s.expires_at > now() and u.active`;
  return rows[0] ?? null;
});

/** Use at the top of every admin page and server action. */
export async function requireUser(role?: Role): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/admin/login");
  if (role === "admin" && user.role !== "admin") redirect("/admin?denied=1");
  return user;
}

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function login(emailRaw: string, password: string): Promise<LoginResult> {
  const email = emailRaw.trim().toLowerCase();
  const ip = await ipHash();
  const [{ n }] = await sql<{ n: number }[]>`
    select count(*)::int as n from login_attempts
    where not success and (email = ${email} or ip_hash = ${ip}) and created_at > now() - interval '15 minutes'`;
  if (n >= MAX_FAILED_PER_15_MIN) {
    return { ok: false, error: "Too many failed attempts. Please wait 15 minutes and try again." };
  }
  const rows = await sql<{ id: string; password_hash: string; active: boolean }[]>`
    select id, password_hash, active from users where email = ${email}`;
  const user = rows[0];
  // Compare against a dummy hash when the user doesn't exist, so timing doesn't reveal valid emails.
  const ok = await bcrypt.compare(password, user?.password_hash ?? "$2b$12$C6UzMDM.H6dfI/f/IKcEeO5x5u0d9o0r4b8uS0zH6Zfx8yJ3qQ5Wm");
  await sql`insert into login_attempts (email, ip_hash, success) values (${email}, ${ip}, ${ok && !!user?.active})`;
  if (!ok || !user || !user.active) return { ok: false, error: "Email or password is incorrect." };
  await sql`delete from sessions where user_id = ${user.id} and expires_at < now()`;
  await createSession(user.id);
  return { ok: true };
}
