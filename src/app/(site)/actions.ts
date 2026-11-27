"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getClass } from "@/lib/content";
import { sql } from "@/lib/db";
import { ipHash } from "@/lib/security";
import { getSettings, hoursFor, slotsFor, waLink } from "@/lib/settings";

export type FormState = { ok: boolean; message: string; waUrl?: string; errors?: Record<string, string>; values?: Record<string, string> } | null;

const MAX_PER_HOUR = 5;
const phone = z.string().trim().min(7, "Enter a phone or WhatsApp number").max(30).regex(/^[+\d][\d\s()-]{6,}$/, "Enter a valid phone number");
const optEmail = z.union([z.literal(""), z.string().trim().email("Enter a valid email").max(200)]);

function errorsOf(e: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of e.issues) out[String(i.path[0])] ??= i.message;
  return out;
}

async function tooMany(table: "enquiries" | "bookings", ip: string) {
  const rows = table === "enquiries"
    ? await sql<{ n: number }[]>`select count(*)::int as n from enquiries where ip_hash = ${ip} and created_at > now() - interval '1 hour'`
    : await sql<{ n: number }[]>`select count(*)::int as n from bookings where ip_hash = ${ip} and created_at > now() - interval '1 hour'`;
  return rows[0].n >= MAX_PER_HOUR;
}

/* ---------- Contact / enquiry ---------- */

const enquirySchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  phone,
  email: optEmail,
  location: z.string().trim().max(120),
  service: z.string().trim().max(160),
  message: z.string().trim().max(3000),
});

export async function submitEnquiry(_: FormState, form: FormData): Promise<FormState> {
  if (form.get("website")) return { ok: true, message: "Thank you! We'll be in touch soon." }; // honeypot
  const values = Object.fromEntries(["name", "phone", "email", "location", "service", "message"].map((k) => [k, String(form.get(k) ?? "")]));
  const parsed = enquirySchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "Please check the highlighted fields.", errors: errorsOf(parsed.error), values };
  const d = parsed.data;
  const ip = await ipHash();
  if (await tooMany("enquiries", ip)) return { ok: false, message: "You've sent several messages already. Please chat with us on WhatsApp instead.", values };

  await sql`insert into enquiries (name, phone, email, location, service, message, ip_hash)
            values (${d.name}, ${d.phone}, ${d.email}, ${d.location}, ${d.service}, ${d.message}, ${ip})`;
  revalidatePath("/admin", "layout");

  const s = await getSettings();
  const text = [`Hello WiNK CONSULT, I just sent an enquiry on your website.`, `Name: ${d.name}`, d.service && `Service: ${d.service}`, d.message]
    .filter(Boolean).join("\n");
  return { ok: true, message: `Thank you, ${d.name.split(" ")[0]}! We've received your enquiry and will contact you during booking hours.`, waUrl: waLink(s.contact.whatsapp, text) };
}

/* ---------- Class / consultation booking ---------- */

const bookingSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("class"),
    class_id: z.string().uuid("Choose a class"),
    name: z.string().trim().min(2, "Enter your name").max(120),
    phone,
    email: optEmail,
    message: z.string().trim().max(2000),
  }),
  z.object({
    type: z.literal("consultation"),
    topic: z.string().trim().min(1, "Choose a topic").max(160),
    preferred_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
    preferred_time: z.string().regex(/^\d{2}:\d{2}$/, "Choose a time"),
    name: z.string().trim().min(2, "Enter your name").max(120),
    phone,
    email: optEmail,
    message: z.string().trim().max(2000),
  }),
]);

export async function submitBooking(_: FormState, form: FormData): Promise<FormState> {
  if (form.get("website")) return { ok: true, message: "Thank you! We'll confirm your booking soon." };
  const raw = Object.fromEntries(["type", "class_id", "topic", "preferred_date", "preferred_time", "name", "phone", "email", "message"].map((k) => [k, String(form.get(k) ?? "")]));
  const parsed = bookingSchema.safeParse(raw);
  const values = raw;
  if (!parsed.success) return { ok: false, message: "Please check the highlighted fields.", errors: errorsOf(parsed.error), values };
  const d = parsed.data;
  const ip = await ipHash();
  if (await tooMany("bookings", ip)) return { ok: false, message: "You've made several bookings already. Please chat with us on WhatsApp instead.", values };
  const s = await getSettings();

  if (d.type === "class") {
    const c = await getClass(d.class_id);
    if (!c || !c.published || c.status !== "open") return { ok: false, message: "That class is no longer taking bookings.", errors: { class_id: "Choose another class" }, values };
    // Lock the class row so two last-seat bookings can't both succeed.
    const result = await sql.begin(async (tx) => {
      await tx`select id from classes where id = ${c.id} for update`;
      const [{ n }] = await tx<{ n: number }[]>`select count(*)::int as n from bookings where class_id = ${c.id} and status in ('pending','confirmed')`;
      if (n >= c.capacity) return "full";
      await tx`insert into bookings (type, class_id, name, phone, email, message, ip_hash)
               values ('class', ${c.id}, ${d.name}, ${d.phone}, ${d.email}, ${d.message}, ${ip})`;
      return "ok";
    });
    if (result === "full") return { ok: false, message: "Sorry, that class is full. Message us on WhatsApp to join the waiting list.", errors: { class_id: "Class is full" }, values };
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `Thank you, ${d.name.split(" ")[0]}! Your seat in “${c.title}” is reserved. We'll contact you to confirm and share payment details.`,
      waUrl: waLink(s.contact.whatsapp, `Hello WiNK CONSULT, I just booked a seat in "${c.title}" on your website. Name: ${d.name}`),
    };
  }

  // Consultation: date must be today..90 days ahead, on an open day, at an offered slot.
  const date = new Date(`${d.preferred_date}T00:00:00Z`);
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  const days = (date.getTime() - today.getTime()) / 864e5;
  if (Number.isNaN(days) || days < 0 || days > 90) return { ok: false, message: "Please choose a date within the next 90 days.", errors: { preferred_date: "Choose a date within the next 90 days" }, values };
  const slots = slotsFor(hoursFor(s, date));
  if (!slots.length) return { ok: false, message: "We're closed on that day. Please choose another date.", errors: { preferred_date: "We're closed that day" }, values };
  if (!slots.includes(d.preferred_time)) return { ok: false, message: "Please choose one of the available times.", errors: { preferred_time: "Choose an available time" }, values };

  await sql`insert into bookings (type, name, phone, email, topic, preferred_date, preferred_time, message, ip_hash)
            values ('consultation', ${d.name}, ${d.phone}, ${d.email}, ${d.topic}, ${d.preferred_date}, ${d.preferred_time}, ${d.message}, ${ip})`;
  revalidatePath("/admin", "layout");
  return {
    ok: true,
    message: `Thank you, ${d.name.split(" ")[0]}! We've received your consultation request and will confirm the time with you.`,
    waUrl: waLink(s.contact.whatsapp, `Hello WiNK CONSULT, I just requested a consultation (${d.topic}) for ${d.preferred_date} at ${d.preferred_time}. Name: ${d.name}`),
  };
}
