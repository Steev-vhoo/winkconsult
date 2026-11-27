"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { destroySession, hashPassword, login, requireUser } from "@/lib/auth";
import { slugify } from "@/lib/content";
import { sql } from "@/lib/db";
import { ICON_NAMES } from "@/lib/icons";
import { isEmail } from "@/lib/email";
import { notifyNewEnquiry } from "@/lib/notify";
import { getSettings, saveSettings, type SiteSettings } from "@/lib/settings";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const bool = (f: FormData, k: string) => f.get(k) === "on" || f.get(k) === "true";
const uuid = z.string().uuid();

function refreshSite() {
  revalidatePath("/", "layout");
}

/* ---------- Auth ---------- */

export async function loginAction(_: { error?: string; email?: string } | null, form: FormData) {
  const res = await login(str(form, "email"), String(form.get("password") ?? ""));
  if (!res.ok) return { error: res.error, email: str(form, "email") };
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}

export async function changePasswordAction(_: { ok?: boolean; error?: string } | null, form: FormData) {
  const user = await requireUser();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  if (next.length < 10) return { error: "New password must be at least 10 characters." };
  if (next !== String(form.get("confirm") ?? "")) return { error: "The new passwords don't match." };
  const bcrypt = (await import("bcryptjs")).default;
  const [row] = await sql<{ password_hash: string }[]>`select password_hash from users where id = ${user.id}`;
  if (!row || !(await bcrypt.compare(current, row.password_hash))) return { error: "Your current password is incorrect." };
  await sql`update users set password_hash = ${await hashPassword(next)} where id = ${user.id}`;
  return { ok: true };
}

/* ---------- Enquiries ---------- */

const ENQ_STATUS = z.enum(["new", "in_progress", "done", "archived"]);

export async function updateEnquiry(form: FormData) {
  await requireUser();
  const id = uuid.parse(str(form, "id"));
  const status = ENQ_STATUS.parse(str(form, "status"));
  const notes = str(form, "notes").slice(0, 5000);
  await sql`update enquiries set status = ${status}, notes = ${notes}, updated_at = now() where id = ${id}`;
  revalidatePath("/admin", "layout");
  redirect(`/admin/enquiries/${id}?saved=1`);
}

export async function setEnquiryStatus(form: FormData) {
  await requireUser();
  const id = uuid.parse(str(form, "id"));
  const status = ENQ_STATUS.parse(str(form, "status"));
  await sql`update enquiries set status = ${status}, updated_at = now() where id = ${id}`;
  revalidatePath("/admin", "layout");
}

export async function deleteEnquiry(form: FormData) {
  await requireUser("admin");
  await sql`delete from enquiries where id = ${uuid.parse(str(form, "id"))}`;
  revalidatePath("/admin", "layout");
  redirect("/admin/enquiries?deleted=1");
}

/* ---------- Bookings ---------- */

const BOOK_STATUS = z.enum(["pending", "confirmed", "cancelled", "completed"]);

export async function updateBooking(form: FormData) {
  await requireUser();
  const id = uuid.parse(str(form, "id"));
  const status = BOOK_STATUS.parse(str(form, "status"));
  const notes = str(form, "notes").slice(0, 5000);
  await sql`update bookings set status = ${status}, notes = ${notes}, updated_at = now() where id = ${id}`;
  revalidatePath("/", "layout");
  redirect(`/admin/bookings/${id}?saved=1`);
}

export async function setBookingStatus(form: FormData) {
  await requireUser();
  await sql`update bookings set status = ${BOOK_STATUS.parse(str(form, "status"))}, updated_at = now() where id = ${uuid.parse(str(form, "id"))}`;
  revalidatePath("/", "layout");
}

export async function deleteBooking(form: FormData) {
  await requireUser("admin");
  await sql`delete from bookings where id = ${uuid.parse(str(form, "id"))}`;
  revalidatePath("/", "layout");
  redirect("/admin/bookings?deleted=1");
}

/* ---------- Classes ---------- */

const classSchema = z.object({
  title: z.string().min(2).max(160),
  kind: z.string().min(1).max(40),
  description: z.string().max(2000),
  start_date: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
  schedule: z.string().max(200),
  mode: z.enum(["Online", "In person", "Hybrid"]),
  location: z.string().max(200),
  capacity: z.coerce.number().int().min(0).max(10000),
  price: z.string().max(80),
  status: z.enum(["open", "closed"]),
});

export async function saveClass(form: FormData) {
  await requireUser();
  const id = str(form, "id");
  const d = classSchema.parse(Object.fromEntries(Object.keys(classSchema.shape).map((k) => [k, str(form, k)])));
  const published = bool(form, "published");
  const start = d.start_date || null;
  if (id) {
    await sql`update classes set title=${d.title}, kind=${d.kind}, description=${d.description}, start_date=${start}, schedule=${d.schedule},
      mode=${d.mode}, location=${d.location}, capacity=${d.capacity}, price=${d.price}, status=${d.status}, published=${published}, updated_at=now()
      where id = ${uuid.parse(id)}`;
  } else {
    await sql`insert into classes (title, kind, description, start_date, schedule, mode, location, capacity, price, status, published)
      values (${d.title}, ${d.kind}, ${d.description}, ${start}, ${d.schedule}, ${d.mode}, ${d.location}, ${d.capacity}, ${d.price}, ${d.status}, ${published})`;
  }
  refreshSite();
  redirect("/admin/classes?saved=1");
}

export async function deleteClass(form: FormData) {
  await requireUser("admin");
  await sql`delete from classes where id = ${uuid.parse(str(form, "id"))}`;
  refreshSite();
  redirect("/admin/classes?deleted=1");
}

/* ---------- Services ---------- */

export async function saveService(form: FormData) {
  await requireUser("admin");
  const id = str(form, "id");
  const title = z.string().min(2).max(160).parse(str(form, "title"));
  const slug = slugify(str(form, "slug") || title);
  const icon = z.enum(ICON_NAMES as [string, ...string[]]).catch("shield").parse(str(form, "icon"));
  const category = z.enum(["core", "partner"]).parse(str(form, "category"));
  const v = {
    summary: str(form, "summary").slice(0, 600), body: str(form, "body_md").slice(0, 20000),
    wa: str(form, "whatsapp_message").slice(0, 500), tile: str(form, "tile_label").slice(0, 40),
    order: z.coerce.number().int().catch(0).parse(str(form, "sort_order")), published: bool(form, "published"),
  };
  try {
    if (id) {
      await sql`update services set slug=${slug}, title=${title}, icon=${icon}, summary=${v.summary}, body_md=${v.body}, whatsapp_message=${v.wa},
        category=${category}, tile_label=${v.tile}, sort_order=${v.order}, published=${v.published}, updated_at=now() where id=${uuid.parse(id)}`;
    } else {
      await sql`insert into services (slug, title, icon, summary, body_md, whatsapp_message, category, tile_label, sort_order, published)
        values (${slug}, ${title}, ${icon}, ${v.summary}, ${v.body}, ${v.wa}, ${category}, ${v.tile}, ${v.order}, ${v.published})`;
    }
  } catch (e) {
    if ((e as { code?: string }).code === "23505") redirect(`/admin/services/${id || "new"}?error=slug`);
    throw e;
  }
  refreshSite();
  redirect("/admin/services?saved=1");
}

export async function deleteService(form: FormData) {
  await requireUser("admin");
  await sql`delete from services where id = ${uuid.parse(str(form, "id"))}`;
  refreshSite();
  redirect("/admin/services?deleted=1");
}

/* ---------- FAQs ---------- */

export async function saveFaq(form: FormData) {
  await requireUser("admin");
  const id = str(form, "id");
  const category = z.string().min(1).max(120).parse(str(form, "category"));
  const question = z.string().min(3).max(400).parse(str(form, "question"));
  const answer = z.string().min(1).max(10000).parse(str(form, "answer_md"));
  const order = z.coerce.number().int().catch(0).parse(str(form, "sort_order"));
  const published = bool(form, "published");
  if (id) {
    await sql`update faqs set category=${category}, question=${question}, answer_md=${answer}, sort_order=${order}, published=${published}, updated_at=now() where id=${uuid.parse(id)}`;
  } else {
    await sql`insert into faqs (category, question, answer_md, sort_order, published) values (${category}, ${question}, ${answer}, ${order}, ${published})`;
  }
  refreshSite();
  redirect("/admin/faqs?saved=1");
}

export async function deleteFaq(form: FormData) {
  await requireUser("admin");
  await sql`delete from faqs where id = ${uuid.parse(str(form, "id"))}`;
  refreshSite();
  redirect("/admin/faqs?deleted=1");
}

/* ---------- Posts ---------- */

export async function savePost(form: FormData) {
  const user = await requireUser();
  const id = str(form, "id");
  const title = z.string().min(2).max(200).parse(str(form, "title"));
  const slug = slugify(str(form, "slug") || title);
  const status = z.enum(["draft", "published"]).parse(str(form, "status"));
  const cover = str(form, "cover_url");
  const coverUrl = cover ? z.string().url().refine((u) => /^https:\/\//.test(u) || u.startsWith("/"), "Use an https:// link").parse(cover) : null;
  const excerpt = str(form, "excerpt").slice(0, 400);
  const body = str(form, "body_md").slice(0, 100000);
  const dateRaw = str(form, "published_at");
  const publishedAt = status === "published" ? (dateRaw ? new Date(`${dateRaw}T08:00:00Z`) : new Date()) : null;
  let newId = id;
  try {
    if (id) {
      await sql`update posts set title=${title}, slug=${slug}, status=${status}, cover_url=${coverUrl}, excerpt=${excerpt}, body_md=${body},
        published_at = case when ${status}::text = 'published' then coalesce(${dateRaw ? publishedAt : null}::timestamptz, published_at, now()) else published_at end,
        updated_at=now() where id=${uuid.parse(id)}`;
    } else {
      const [row] = await sql<{ id: string }[]>`insert into posts (title, slug, status, cover_url, excerpt, body_md, published_at, author_id)
        values (${title}, ${slug}, ${status}, ${coverUrl}, ${excerpt}, ${body}, ${publishedAt}, ${user.id}) returning id`;
      newId = row.id;
    }
  } catch (e) {
    if ((e as { code?: string }).code === "23505") redirect(`/admin/posts/${id || "new"}?error=slug`);
    throw e;
  }
  refreshSite();
  redirect(`/admin/posts/${newId}?saved=1`);
}

export async function deletePost(form: FormData) {
  await requireUser();
  await sql`delete from posts where id = ${uuid.parse(str(form, "id"))}`;
  refreshSite();
  redirect("/admin/posts?deleted=1");
}

/* ---------- Settings ---------- */

const time = z.string().regex(/^\d{2}:\d{2}$/);

export async function saveSettingsAction(form: FormData) {
  await requireUser("admin");
  const cur = await getSettings();
  const day = (p: string) => ({ open: time.catch("09:00").parse(str(form, `${p}_open`)), close: time.catch("17:00").parse(str(form, `${p}_close`)), closed: bool(form, `${p}_closed`) });
  const group = str(form, "whatsappGroup");
  const next: SiteSettings = {
    banner: str(form, "banner").slice(0, 200),
    hero: { title: str(form, "hero_title") || cur.hero.title, accent: str(form, "hero_accent"), lead: str(form, "hero_lead").slice(0, 600) },
    brand: { tagline: str(form, "tagline"), hashtag: str(form, "hashtag") },
    about: { intro: str(form, "about_intro").slice(0, 1000), vision: str(form, "vision").slice(0, 1000), mission: str(form, "mission").slice(0, 1500) },
    contact: {
      whatsapp: z.string().min(7).max(30).parse(str(form, "whatsapp")),
      phone: str(form, "phone").slice(0, 30),
      email: z.union([z.literal(""), z.string().email()]).parse(str(form, "email")),
      tiktok: str(form, "tiktok").replace(/^@/, "").slice(0, 60),
      whatsappGroup: group && /^https:\/\/chat\.whatsapp\.com\//.test(group) ? group : "",
      address: str(form, "address").slice(0, 300),
    },
    hours: { weekdays: day("weekdays"), saturday: day("saturday"), sunday: day("sunday") },
    destinations: str(form, "destinations").split(/\r?\n/).map((x) => x.trim()).filter(Boolean).slice(0, 12),
    notify: { emails: [] },
  };
  const emails = str(form, "notify_emails").split(/[\s,;]+/).map((x) => x.trim().toLowerCase()).filter(Boolean);
  const bad = emails.find((x) => !isEmail(x));
  if (bad) redirect(`/admin/settings?error=email&bad=${encodeURIComponent(bad.slice(0, 80))}`);
  next.notify.emails = [...new Set(emails)].slice(0, 10);
  await saveSettings(next);
  refreshSite();
  redirect("/admin/settings?saved=1");
}

/* ---------- Email alerts ---------- */

export async function sendTestAlert() {
  await requireUser("admin");
  const { alertRecipients } = await import("@/lib/notify");
  const { sendEmail } = await import("@/lib/email");
  const to = await alertRecipients();
  const res = await sendEmail({
    to,
    subject: "Test alert from the WiNK CONSULT website",
    text: "Email alerts are working. You'll get a message like this whenever someone sends an enquiry on the website.",
    html: "<p style=\"font-family:Arial,sans-serif\">Email alerts are working. You'll get a message like this whenever someone sends an enquiry on the website.</p>",
  });
  redirect(res.ok ? `/admin/settings?test=sent&to=${encodeURIComponent(to.join(", "))}#alerts` : `/admin/settings?test=failed&msg=${encodeURIComponent(res.error)}#alerts`);
}

export async function resendEnquiryAlert(form: FormData) {
  await requireUser();
  const id = uuid.parse(str(form, "id"));
  const res = await notifyNewEnquiry(id, { force: true });
  revalidatePath(`/admin/enquiries/${id}`);
  redirect(`/admin/enquiries/${id}?${res.ok ? "alert=sent" : "alert=failed"}`);
}

/* ---------- Users ---------- */

export async function createUserAction(_: { ok?: boolean; error?: string; values?: Record<string, string> } | null, form: FormData) {
  await requireUser("admin");
  const parsed = z.object({
    name: z.string().trim().min(2, "Enter a name").max(120),
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    password: z.string().min(10, "Temporary password must be at least 10 characters"),
    role: z.enum(["admin", "staff"]),
  }).safeParse({ name: str(form, "name"), email: str(form, "email"), password: String(form.get("password") ?? ""), role: str(form, "role") });
  const values = { name: str(form, "name"), email: str(form, "email"), role: str(form, "role") };
  if (!parsed.success) return { error: parsed.error.issues[0].message, values };
  const d = parsed.data;
  try {
    await sql`insert into users (email, name, password_hash, role) values (${d.email}, ${d.name}, ${await hashPassword(d.password)}, ${d.role})`;
  } catch (e) {
    if ((e as { code?: string }).code === "23505") return { error: "A user with that email already exists.", values };
    throw e;
  }
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function updateUserAction(form: FormData) {
  const me = await requireUser("admin");
  const id = uuid.parse(str(form, "id"));
  const op = str(form, "op");
  if (id === me.id && op !== "reset") redirect("/admin/users?error=self");
  if (op === "deactivate") {
    await sql`update users set active = false where id = ${id}`;
    await sql`delete from sessions where user_id = ${id}`;
  } else if (op === "activate") {
    await sql`update users set active = true where id = ${id}`;
  } else if (op === "role") {
    await sql`update users set role = ${z.enum(["admin", "staff"]).parse(str(form, "role"))} where id = ${id}`;
  } else if (op === "reset") {
    const pw = z.string().min(10).safeParse(String(form.get("password") ?? ""));
    if (!pw.success) redirect("/admin/users?error=password");
    await sql`update users set password_hash = ${await hashPassword(pw.data)} where id = ${id}`;
    await sql`delete from sessions where user_id = ${id} and ${id !== me.id}`;
  }
  revalidatePath("/admin/users");
  redirect("/admin/users?saved=1");
}
