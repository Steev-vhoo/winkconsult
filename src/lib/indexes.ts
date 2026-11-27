import type { Db } from "mongodb";

/** Creates every index the app relies on. Idempotent: safe to run on each deploy. */
export async function ensureIndexes(d: Db) {
  await Promise.all([
    d.collection("users").createIndex({ email: 1 }, { unique: true }),
    d.collection("sessions").createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 }), // expired sessions are deleted automatically
    d.collection("sessions").createIndex({ user_id: 1 }),
    d.collection("login_attempts").createIndex({ created_at: 1 }, { expireAfterSeconds: 86_400 }), // keep one day
    d.collection("login_attempts").createIndex({ email: 1, created_at: -1 }),
    d.collection("login_attempts").createIndex({ ip_hash: 1, created_at: -1 }),
    d.collection("services").createIndex({ slug: 1 }, { unique: true }),
    d.collection("services").createIndex({ category: 1, sort_order: 1 }),
    d.collection("faqs").createIndex({ sort_order: 1 }),
    d.collection("posts").createIndex({ slug: 1 }, { unique: true }),
    d.collection("posts").createIndex({ status: 1, published_at: -1 }),
    d.collection("enquiries").createIndex({ status: 1, created_at: -1 }),
    d.collection("enquiries").createIndex({ ip_hash: 1, created_at: -1 }),
    d.collection("classes").createIndex({ start_date: 1 }),
    d.collection("bookings").createIndex({ status: 1, created_at: -1 }),
    d.collection("bookings").createIndex({ class_id: 1 }),
    d.collection("bookings").createIndex({ ip_hash: 1, created_at: -1 }),
  ]);
}
