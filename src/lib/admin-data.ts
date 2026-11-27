import "server-only";
import type { Collection, Document, Filter } from "mongodb";
import { type BookingDoc, db, type EnquiryDoc, escapeRegex, type PostDoc, withId } from "./db";

const today = () => new Date().toISOString().slice(0, 10);

async function countBy<T extends Document>(col: Collection<T>) {
  const rows = await col.aggregate<{ _id: string; n: number }>([{ $group: { _id: "$status", n: { $sum: 1 } } }]).toArray();
  return rows.map((r) => ({ status: r._id, n: r.n }));
}

/* ---------- Sidebar + dashboard ---------- */

export async function sidebarCounts() {
  const { enquiries, bookings } = await db();
  const [enq, book] = await Promise.all([enquiries.countDocuments({ status: "new" }), bookings.countDocuments({ status: "pending" })]);
  return { enq, book };
}

export async function dashboardData() {
  const { enquiries, bookings, posts, classes } = await db();
  const [new_enq, week_enq, pending, upcoming, postsN, openEnq, recentBookings, openClasses] = await Promise.all([
    enquiries.countDocuments({ status: "new" }),
    enquiries.countDocuments({ created_at: { $gt: new Date(Date.now() - 7 * 864e5) } }),
    bookings.countDocuments({ status: "pending" }),
    bookings.countDocuments({ type: "consultation", status: "confirmed", preferred_date: { $gte: today() } }),
    posts.countDocuments({ status: "published" }),
    enquiries.find({ status: { $in: ["new", "in_progress"] } }).sort({ created_at: -1 }).limit(6).toArray(),
    bookings.find({ status: { $in: ["pending", "confirmed"] } }).sort({ created_at: -1 }).limit(6).toArray(),
    classes.find({ status: "open" }).toArray(),
  ]);
  openClasses.sort((a, b) => (a.start_date ?? "9999").localeCompare(b.start_date ?? "9999"));
  return {
    stats: { new_enq, week_enq, pending, upcoming, posts: postsN },
    enquiries: openEnq.map(withId),
    bookings: recentBookings.map((b) => ({ ...withId(b), title: b.class_title || null })),
    classes: openClasses.slice(0, 5).map(withId),
  };
}

/* ---------- Enquiries ---------- */

export function enquiryFilter(status: string, q = ""): Filter<EnquiryDoc> {
  const f: Filter<EnquiryDoc> = {};
  if (status === "open") f.status = { $in: ["new", "in_progress"] };
  else if (status !== "all") f.status = status as EnquiryDoc["status"];
  if (q) {
    const re = { $regex: escapeRegex(q), $options: "i" };
    f.$or = [{ name: re }, { phone: re }, { email: re }, { message: re }, { service: re }];
  }
  return f;
}

export async function listEnquiries(status: string, q: string, limit = 200) {
  const { enquiries } = await db();
  const [rows, counts] = await Promise.all([
    enquiries.find(enquiryFilter(status, q)).sort({ created_at: -1 }).limit(limit).toArray(),
    countBy(enquiries),
  ]);
  return { rows: rows.map(withId), counts };
}

export async function getEnquiry(id: string) {
  const doc = await (await db()).enquiries.findOne({ _id: id });
  return doc ? withId(doc) : undefined;
}

/* ---------- Bookings ---------- */

export function bookingFilter(status: string, type = "", classId = ""): Filter<BookingDoc> {
  const f: Filter<BookingDoc> = {};
  if (status === "active") f.status = { $in: ["pending", "confirmed"] };
  else if (status !== "all") f.status = status as BookingDoc["status"];
  if (type) f.type = type as BookingDoc["type"];
  if (classId) f.class_id = classId;
  return f;
}

export async function listBookings(status: string, type: string, classId: string, limit = 300) {
  const { bookings, classes } = await db();
  const [rows, counts, cls] = await Promise.all([
    bookings.find(bookingFilter(status, type, classId)).sort({ created_at: -1 }).limit(limit).toArray(),
    countBy(bookings),
    classes.find({}, { projection: { title: 1, start_date: 1 } }).toArray(),
  ]);
  // Upcoming consultations first (soonest first), then everything else newest first.
  const t = today();
  const upcoming = (b: BookingDoc) => b.type === "consultation" && !!b.preferred_date && b.preferred_date >= t;
  rows.sort((a, b) => {
    const ua = upcoming(a), ub = upcoming(b);
    if (ua !== ub) return ua ? -1 : 1;
    if (ua && ub) return `${a.preferred_date} ${a.preferred_time}`.localeCompare(`${b.preferred_date} ${b.preferred_time}`);
    return b.created_at.getTime() - a.created_at.getTime();
  });
  cls.sort((a, b) => (b.start_date ?? "").localeCompare(a.start_date ?? "") || a.title.localeCompare(b.title));
  return {
    rows: rows.map((b) => ({ ...withId(b), title: b.class_title || null })),
    counts,
    classes: cls.map((c) => ({ id: c._id, title: c.title })),
  };
}

export async function getBooking(id: string) {
  const { bookings, classes } = await db();
  const b = await bookings.findOne({ _id: id });
  if (!b) return undefined;
  const c = b.class_id ? await classes.findOne({ _id: b.class_id }) : null;
  return { ...withId(b), title: c?.title ?? (b.class_title || null), schedule: c?.schedule ?? null, class_start: c?.start_date ?? null };
}

/* ---------- Posts, FAQs, users ---------- */

export async function listAllPosts() {
  const { posts, users } = await db();
  const docs = await posts.find({}).toArray();
  docs.sort((a, b) => (b.published_at ?? b.updated_at).getTime() - (a.published_at ?? a.updated_at).getTime());
  const authors = new Map((await users.find({}, { projection: { name: 1 } }).toArray()).map((u) => [u._id, u.name]));
  return docs.map((p) => ({ ...withId(p), author: (p.author_id && authors.get(p.author_id)) || null }));
}

export async function getPost(id: string): Promise<(Omit<PostDoc, "_id"> & { id: string }) | undefined> {
  const doc = await (await db()).posts.findOne({ _id: id });
  return doc ? withId(doc) : undefined;
}

export async function listUsers() {
  const docs = await (await db()).users.find({}).toArray();
  docs.sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));
  return docs.map((u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, active: u.active, created_at: u.created_at, last: u.last_login_at ?? null }));
}

/* ---------- CSV exports ---------- */

export async function enquiriesForExport(status: string) {
  return (await db()).enquiries.find(enquiryFilter(status)).sort({ created_at: -1 }).toArray();
}

export async function bookingsForExport(status: string, classId: string) {
  return (await db()).bookings.find(bookingFilter(status, "", classId)).sort({ created_at: -1 }).toArray();
}
