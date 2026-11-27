import { randomUUID } from "node:crypto";
import { type Db, MongoClient } from "mongodb";

/* ---------- Document shapes (one collection each) ---------- */

export type Role = "admin" | "staff";
export type UserDoc = { _id: string; email: string; name: string; password_hash: string; role: Role; active: boolean; created_at: Date; last_login_at: Date | null };
export type SessionDoc = { _id: string /* sha256 of cookie token */; user_id: string; expires_at: Date; created_at: Date };
export type LoginAttemptDoc = { _id: string; email: string; ip_hash: string; success: boolean; created_at: Date };
export type SettingsDoc = { _id: string; value: unknown; updated_at: Date };
export type ServiceDoc = {
  _id: string; slug: string; title: string; icon: string; summary: string; body_md: string; whatsapp_message: string;
  category: "core" | "partner"; tile_label: string; sort_order: number; published: boolean; updated_at: Date;
};
export type FaqDoc = { _id: string; category: string; question: string; answer_md: string; sort_order: number; published: boolean; updated_at: Date };
export type PostDoc = {
  _id: string; slug: string; title: string; excerpt: string; body_md: string; cover_url: string | null;
  status: "draft" | "published"; published_at: Date | null; author_id: string | null; created_at: Date; updated_at: Date;
};
export type EnquiryStatus = "new" | "in_progress" | "done" | "archived";
export type EnquiryDoc = {
  _id: string; name: string; phone: string; email: string; location: string; service: string; message: string;
  status: EnquiryStatus; notes: string; ip_hash: string; notified_at: Date | null; notify_error: string; created_at: Date; updated_at: Date;
};
export type ClassDoc = {
  _id: string; title: string; kind: string; description: string; start_date: string | null /* YYYY-MM-DD */; schedule: string;
  mode: "Online" | "In person" | "Hybrid"; location: string; capacity: number; price: string; status: "open" | "closed";
  published: boolean; taken: number /* pending + confirmed bookings, kept in step atomically */; created_at: Date; updated_at: Date;
};
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type BookingDoc = {
  _id: string; type: "class" | "consultation"; class_id: string | null; class_title: string; name: string; phone: string; email: string;
  preferred_date: string | null /* YYYY-MM-DD */; preferred_time: string; topic: string; message: string;
  status: BookingStatus; notes: string; ip_hash: string; created_at: Date; updated_at: Date;
};

/* ---------- Connection (one pool per server instance) ---------- */

declare global {
  // eslint-disable-next-line no-var
  var __winkMongo: Promise<MongoClient> | undefined;
}

function uri() {
  const u = process.env.MONGODB_URI;
  if (u) return u;
  throw new Error(
    process.env.VERCEL
      ? "MONGODB_URI is not set. In Vercel open Project → Settings → Environment Variables, add MONGODB_URI " +
        "(your MongoDB Atlas connection string) for Production and Preview, then redeploy. The build reads the database " +
        "to pre-render pages, so run `npm run db:setup` against it first."
      : "MONGODB_URI is not set. Copy .env.example to .env.local and fill it in.",
  );
}

export async function getDb(): Promise<Db> {
  globalThis.__winkMongo ??= new MongoClient(uri(), {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10_000,
    appName: "wink-consult-web",
  }).connect().catch((e) => {
    globalThis.__winkMongo = undefined; // let the next request retry
    throw e;
  });
  const client = await globalThis.__winkMongo;
  return client.db(process.env.MONGODB_DB || "wink");
}

/** Typed collection handles. */
export async function db() {
  const d = await getDb();
  return {
    users: d.collection<UserDoc>("users"),
    sessions: d.collection<SessionDoc>("sessions"),
    loginAttempts: d.collection<LoginAttemptDoc>("login_attempts"),
    settings: d.collection<SettingsDoc>("settings"),
    services: d.collection<ServiceDoc>("services"),
    faqs: d.collection<FaqDoc>("faqs"),
    posts: d.collection<PostDoc>("posts"),
    enquiries: d.collection<EnquiryDoc>("enquiries"),
    classes: d.collection<ClassDoc>("classes"),
    bookings: d.collection<BookingDoc>("bookings"),
  };
}

export const newId = () => randomUUID();

/** Converts a stored document's `_id` to `id` for use in pages. */
export function withId<T extends { _id: string }>(doc: T): Omit<T, "_id"> & { id: string } {
  const { _id, ...rest } = doc;
  return { id: _id, ...rest };
}

export const isDuplicateKey = (e: unknown) => (e as { code?: number })?.code === 11000;

/** Escapes text for use inside a MongoDB $regex (for search boxes). */
export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
