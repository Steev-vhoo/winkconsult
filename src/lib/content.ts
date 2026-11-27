import { type ClassDoc, db, type FaqDoc, type PostDoc, type ServiceDoc, withId } from "./db";

export type Service = Omit<ServiceDoc, "_id"> & { id: string };
export type Faq = Omit<FaqDoc, "_id"> & { id: string };
export type Post = Omit<PostDoc, "_id"> & { id: string };
export type ClassRow = Omit<ClassDoc, "_id"> & { id: string };

export async function listServices(all = false): Promise<Service[]> {
  const { services } = await db();
  const docs = await services.find(all ? {} : { published: true }).sort({ category: 1, sort_order: 1, title: 1 }).toArray();
  return docs.map(withId);
}

export async function getService(id: string): Promise<Service | undefined> {
  const doc = await (await db()).services.findOne({ _id: id });
  return doc ? withId(doc) : undefined;
}

export async function listFaqs(all = false): Promise<Faq[]> {
  const { faqs } = await db();
  return (await faqs.find(all ? {} : { published: true }).sort({ sort_order: 1, category: 1, question: 1 }).toArray()).map(withId);
}

export async function getFaq(id: string): Promise<Faq | undefined> {
  const doc = await (await db()).faqs.findOne({ _id: id });
  return doc ? withId(doc) : undefined;
}

export async function faqCategories(): Promise<string[]> {
  return ((await (await db()).faqs.distinct("category")) as string[]).sort();
}

export async function listPublishedPosts(limit = 50): Promise<Post[]> {
  const { posts } = await db();
  const docs = await posts.find({ status: "published", published_at: { $lte: new Date() } }).sort({ published_at: -1 }).limit(limit).toArray();
  return docs.map(withId);
}

export async function getPublishedPost(slug: string): Promise<Post | undefined> {
  const doc = await (await db()).posts.findOne({ slug, status: "published", published_at: { $lte: new Date() } });
  return doc ? withId(doc) : undefined;
}

/** Classes; for the public site only published, open ones that haven't long started. */
export async function listClasses(opts: { publicOnly?: boolean } = {}): Promise<ClassRow[]> {
  const { classes } = await db();
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const filter = opts.publicOnly
    ? { published: true, status: "open" as const, $or: [{ start_date: null }, { start_date: { $gte: weekAgo } }] }
    : {};
  const docs = await classes.find(filter).toArray();
  // Dated classes first (soonest first), then undated; ties by title.
  docs.sort((a, b) => (a.start_date ?? "9999") .localeCompare(b.start_date ?? "9999") || a.title.localeCompare(b.title));
  return docs.map(withId);
}

export async function getClass(id: string): Promise<ClassRow | undefined> {
  const doc = await (await db()).classes.findOne({ _id: id });
  return doc ? withId(doc) : undefined;
}

export function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "item";
}

export function fmtDate(d: Date | string | null, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d.length === 10 ? `${d}T00:00:00Z` : d) : d;
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...opts }).format(date);
}
