"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { destroySession, hashPassword, login, requireUser } from "@/lib/auth";
import { slugify } from "@/lib/content";
import { removeBooking, removeClass, updateBookingStatus } from "@/lib/bookings";
import { db, isDuplicateKey, newId } from "@/lib/db";
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
  const { users } = await db();
  const row = await users.findOne({ _id: user.id });
  if (!row || !(await bcrypt.compare(current, row.password_hash))) return { error: "Your current password is incorrect." };
  await users.updateOne({ _id: user.id }, { $set: { password_hash: await hashPassword(next) } });
  return { ok: true };
}

/* ---------- Enquiries ---------- */

const ENQ_STATUS = z.enum(["new", "in_progress", "done", "archived"]);

export async function updateEnquiry(form: FormData) {
  await requireUser();
  const id = uuid.parse(str(form, "id"));
  const status = ENQ_STATUS.parse(str(form, "status"));
  const notes = str(form, "notes").slice(0, 5000);
  await (await db()).enquiries.updateOne({ _id: id }, { $set: { status, notes, updated_at: new Date() } });
  revalidatePath("/admin", "layout");
  redirect(`/admin/enquiries/${id}?saved=1`);
}

export async function setEnquiryStatus(form: FormData) {
  await requireUser();
  const id = uuid.parse(str(form, "id"));
  const status = ENQ_STATUS.parse(str(form, "status"));
  await (await db()).enquiries.updateOne({ _id: id }, { $set: { status, updated_at: new Date() } });
  revalidatePath("/admin", "layout");
}

export async function deleteEnquiry(form: FormData) {
  await requireUser("admin");
  await (await db()).enquiries.deleteOne({ _id: uuid.parse(str(form, "id")) });
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
  await updateBookingStatus(id, status, notes);
  revalidatePath("/", "layout");
  redirect(`/admin/bookings/${id}?saved=1`);
}

export async function setBookingStatus(form: FormData) {
  await requireUser();
  await updateBookingStatus(uuid.parse(str(form, "id")), BOOK_STATUS.parse(str(form, "status")));
  revalidatePath("/", "layout");
}

export async function deleteBooking(form: FormData) {
  await requireUser("admin");
  await removeBooking(uuid.parse(str(form, "id")));
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
  const { classes, bookings } = await db();
  const fields = { ...d, start_date: start, published, updated_at: new Date() };
  if (id) {
    await classes.updateOne({ _id: uuid.parse(id) }, { $set: fields });
    // Keep the title shown on existing bookings in step with the class name.
    await bookings.updateMany({ class_id: id }, { $set: { class_title: d.title } });
  } else {
    await classes.insertOne({ _id: newId(), ...fields, taken: 0, created_at: new Date() });
  }
  refreshSite();
  redirect("/admin/classes?saved=1");
}

export async function deleteClass(form: FormData) {
  await requireUser("admin");
  await removeClass(uuid.parse(str(form, "id")));
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
    const { services } = await db();
    const fields = {
      slug, title, icon, category, summary: v.summary, body_md: v.body, whatsapp_message: v.wa,
      tile_label: v.tile, sort_order: v.order, published: v.published, updated_at: new Date(),
    };
    if (id) await services.updateOne({ _id: uuid.parse(id) }, { $set: fields });
    else await services.insertOne({ _id: newId(), ...fields });
  } catch (e) {
    if (isDuplicateKey(e)) redirect(`/admin/services/${id || "new"}?error=slug`);
    throw e;
  }
  refreshSite();
  redirect("/admin/services?saved=1");
}

export async function deleteService(form: FormData) {
  await requireUser("admin");
  await (await db()).services.deleteOne({ _id: uuid.parse(str(form, "id")) });
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
  const { faqs } = await db();
  const fields = { category, question, answer_md: answer, sort_order: order, published, updated_at: new Date() };
  if (id) await faqs.updateOne({ _id: uuid.parse(id) }, { $set: fields });
  else await faqs.insertOne({ _id: newId(), ...fields });
  refreshSite();
  redirect("/admin/faqs?saved=1");
}

export async function deleteFaq(form: FormData) {
  await requireUser("admin");
  await (await db()).faqs.deleteOne({ _id: uuid.parse(str(form, "id")) });
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
  const postId = id ? uuid.parse(id) : newId();
  try {
    const { posts } = await db();
    const fields = { title, slug, status, cover_url: coverUrl, excerpt, body_md: body, updated_at: new Date() };
    if (id) {
      const existing = await posts.findOne({ _id: postId }, { projection: { published_at: 1 } });
      // Publishing keeps the original date unless a new one is chosen; drafts keep theirs for later.
      const published_at = status === "published" ? (dateRaw ? publishedAt : existing?.published_at ?? new Date()) : existing?.published_at ?? null;
      await posts.updateOne({ _id: postId }, { $set: { ...fields, published_at } });
    } else {
      await posts.insertOne({ _id: postId, ...fields, published_at: publishedAt, author_id: user.id, created_at: new Date() });
    }
  } catch (e) {
    if (isDuplicateKey(e)) redirect(`/admin/posts/${id || "new"}?error=slug`);
    throw e;
  }
  refreshSite();
  redirect(`/admin/posts/${postId}?saved=1`);
}

export async function deletePost(form: FormData) {
  await requireUser();
  await (await db()).posts.deleteOne({ _id: uuid.parse(str(form, "id")) });
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
    await (await db()).users.insertOne({
      _id: newId(), email: d.email, name: d.name, password_hash: await hashPassword(d.password), role: d.role,
      active: true, created_at: new Date(), last_login_at: null,
    });
  } catch (e) {
    if (isDuplicateKey(e)) return { error: "A user with that email already exists.", values };
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
  const { users, sessions } = await db();
  if (op === "deactivate") {
    await users.updateOne({ _id: id }, { $set: { active: false } });
    await sessions.deleteMany({ user_id: id });
  } else if (op === "activate") {
    await users.updateOne({ _id: id }, { $set: { active: true } });
  } else if (op === "role") {
    await users.updateOne({ _id: id }, { $set: { role: z.enum(["admin", "staff"]).parse(str(form, "role")) } });
  } else if (op === "reset") {
    const pw = z.string().min(10).safeParse(String(form.get("password") ?? ""));
    if (!pw.success) redirect("/admin/users?error=password");
    await users.updateOne({ _id: id }, { $set: { password_hash: await hashPassword(pw.data) } });
    if (id !== me.id) await sessions.deleteMany({ user_id: id }); // sign them out everywhere
  }
  revalidatePath("/admin/users");
  redirect("/admin/users?saved=1");
}
