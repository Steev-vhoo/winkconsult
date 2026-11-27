import { sql } from "./db";

export type Service = {
  id: string; slug: string; title: string; icon: string; summary: string; body_md: string;
  whatsapp_message: string; category: "core" | "partner"; tile_label: string; sort_order: number; published: boolean;
};
export type Faq = { id: string; category: string; question: string; answer_md: string; sort_order: number; published: boolean };
export type Post = {
  id: string; slug: string; title: string; excerpt: string; body_md: string; cover_url: string | null;
  status: "draft" | "published"; published_at: Date | null; created_at: Date; updated_at: Date;
};
export type ClassRow = {
  id: string; title: string; kind: string; description: string; start_date: string | null; schedule: string;
  mode: "Online" | "In person" | "Hybrid"; location: string; capacity: number; price: string;
  status: "open" | "closed"; published: boolean; taken: number;
};

export const listServices = (all = false) =>
  sql<Service[]>`select * from services where ${all} or published order by category, sort_order, title`;

export const getService = (id: string) => sql<Service[]>`select * from services where id = ${id}`.then((r) => r[0]);

export const listFaqs = (all = false) =>
  sql<Faq[]>`select * from faqs where ${all} or published order by sort_order, category, question`;

export const listPublishedPosts = (limit = 50) => sql<Post[]>`
  select * from posts where status = 'published' and published_at <= now()
  order by published_at desc limit ${limit}`;

export const getPublishedPost = (slug: string) => sql<Post[]>`
  select * from posts where slug = ${slug} and status = 'published' and published_at <= now()`.then((r) => r[0]);

/** Classes with the number of seats taken by pending/confirmed bookings. */
export const listClasses = (opts: { publicOnly?: boolean } = {}) => sql<ClassRow[]>`
  select c.*, to_char(c.start_date, 'YYYY-MM-DD') as start_date,
         coalesce((select count(*)::int from bookings b where b.class_id = c.id and b.status in ('pending','confirmed')), 0) as taken
  from classes c
  where ${!opts.publicOnly} or (c.published and c.status = 'open' and (c.start_date is null or c.start_date >= current_date - 7))
  order by c.start_date nulls last, c.title`;

export const getClass = (id: string) => sql<ClassRow[]>`
  select c.*, to_char(c.start_date, 'YYYY-MM-DD') as start_date,
         coalesce((select count(*)::int from bookings b where b.class_id = c.id and b.status in ('pending','confirmed')), 0) as taken
  from classes c where c.id = ${id}`.then((r) => r[0]);

export function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "item";
}

export function fmtDate(d: Date | string | null, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d.length === 10 ? `${d}T00:00:00Z` : d) : d;
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...opts }).format(date);
}
