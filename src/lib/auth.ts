import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db, newId, type Role } from "./db";
import { ipHash, randomToken, sha256 } from "./security";

export const SESSION_COOKIE = "wink_session";
const SESSION_DAYS = 14;
const MAX_FAILED_PER_15_MIN = 8;

export type { Role };
export type User = { id: string; email: string; name: string; role: Role };

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12);
}

export async function createSession(userId: string) {
  const token = randomToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  await (await db()).sessions.insertOne({ _id: sha256(token), user_id: userId, expires_at: expires, created_at: new Date() });
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
  if (token) await (await db()).sessions.deleteOne({ _id: sha256(token) });
  jar.delete(SESSION_COOKIE);
}

/** The signed-in user for this request, or null. */
export const getUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const { sessions, users } = await db();
  const session = await sessions.findOne({ _id: sha256(token), expires_at: { $gt: new Date() } });
  if (!session) return null;
  const u = await users.findOne({ _id: session.user_id, active: true }, { projection: { email: 1, name: 1, role: 1 } });
  return u ? { id: u._id, email: u.email, name: u.name, role: u.role } : null;
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
  const { loginAttempts, users, sessions } = await db();
  const n = await loginAttempts.countDocuments({
    success: false, $or: [{ email }, { ip_hash: ip }], created_at: { $gt: new Date(Date.now() - 15 * 60_000) },
  });
  if (n >= MAX_FAILED_PER_15_MIN) {
    return { ok: false, error: "Too many failed attempts. Please wait 15 minutes and try again." };
  }
  const user = await users.findOne({ email });
  // Compare against a dummy hash when the user doesn't exist, so timing doesn't reveal valid emails.
  const ok = await bcrypt.compare(password, user?.password_hash ?? "$2b$12$C6UzMDM.H6dfI/f/IKcEeO5x5u0d9o0r4b8uS0zH6Zfx8yJ3qQ5Wm");
  const success = ok && !!user?.active;
  await loginAttempts.insertOne({ _id: newId(), email, ip_hash: ip, success, created_at: new Date() });
  if (!success || !user) return { ok: false, error: "Email or password is incorrect." };
  await users.updateOne({ _id: user._id }, { $set: { last_login_at: new Date() } });
  await sessions.deleteMany({ user_id: user._id, expires_at: { $lt: new Date() } });
  await createSession(user._id);
  return { ok: true };
}
