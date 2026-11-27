import { cache } from "react";
import { sql } from "./db";

export type DayHours = { open: string; close: string; closed: boolean };

export type SiteSettings = {
  banner: string;
  hero: { title: string; accent: string; lead: string };
  brand: { tagline: string; hashtag: string };
  about: { intro: string; vision: string; mission: string };
  contact: {
    whatsapp: string; // as displayed, e.g. "+233 20 837 6517"
    phone: string;
    email: string;
    tiktok: string; // handle without @
    whatsappGroup: string; // invite URL
    address: string;
  };
  hours: { weekdays: DayHours; saturday: DayHours; sunday: DayHours };
  destinations: string[];
  notify: { emails: string[] }; // staff who get an email for each new enquiry
};

export const DEFAULT_SETTINGS: SiteSettings = {
  banner: "",
  hero: {
    title: "Your Global Nursing Journey,",
    accent: "Made Simple.",
    lead: "Reliable, transparent and stress-free support with MOH International Clearance, NMC Foreign Verification, NMC PIN Renewal, UK-NMC Registration, CBT and IELTS tuition, at home and in the diaspora.",
  },
  brand: { tagline: "Your Global Nursing Journey, Made Simple", hashtag: "#ReliablyConvenient" },
  about: {
    intro:
      "WiNK CONSULT is a trusted consultancy dedicated to Ghanaian-trained nurses and midwives at home and in the diaspora.",
    vision:
      "To be the most trusted consultancy for Ghanaian nurses and midwives, empowering them to achieve their global career dreams with confidence and ease.",
    mission:
      "To provide reliable, transparent and stress-free support to Ghanaian-trained nurses and midwives at home and in the diaspora, through MOH International Clearance, NMC Verification, NMC PIN Renewal and expert IELTS tuition, guiding them every step of the way to international opportunities.",
  },
  contact: {
    whatsapp: "+233 20 837 6517",
    phone: "+233 24 037 3726",
    email: "winkconsult24@gmail.com",
    tiktok: "wink_consult",
    whatsappGroup: "https://chat.whatsapp.com/BzG98iptnDDDMwTGRBERUi",
    address: "",
  },
  hours: {
    weekdays: { open: "08:00", close: "17:00", closed: false },
    saturday: { open: "09:00", close: "16:00", closed: false },
    sunday: { open: "09:00", close: "16:00", closed: true },
  },
  destinations: ["United Kingdom", "United States", "Canada", "Australia", "Ireland"],
  notify: { emails: [] },
};

function merge<T>(base: T, over: unknown): T {
  if (Array.isArray(base)) return (Array.isArray(over) ? over : base) as T;
  if (base && typeof base === "object") {
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    const o = (over && typeof over === "object" ? over : {}) as Record<string, unknown>;
    for (const k of Object.keys(out)) out[k] = merge(out[k], o[k]);
    return out as T;
  }
  return (over === undefined || over === null ? base : over) as T;
}

/** Site-wide settings, read once per request. Missing fields fall back to defaults. */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  const rows = await sql<{ value: unknown }[]>`select value from settings where key = 'site'`;
  return merge(DEFAULT_SETTINGS, rows[0]?.value);
});

export async function saveSettings(s: SiteSettings) {
  await sql`
    insert into settings (key, value, updated_at) values ('site', ${sql.json(s as never)}, now())
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
}

/* ---------- helpers ---------- */

export const digits = (s: string) => s.replace(/\D/g, "");

export function waLink(number: string, message?: string) {
  const base = `https://wa.me/${digits(number)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function telLink(number: string) {
  return `tel:+${digits(number)}`;
}

export function fmtTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m ? `:${String(m).padStart(2, "0")}` : ""}${suffix}`;
}

export function fmtDay(d: DayHours) {
  return d.closed ? "Closed" : `${fmtTime(d.open)} – ${fmtTime(d.close)}`;
}

export function hoursFor(s: SiteSettings, date: Date): DayHours {
  const day = date.getUTCDay();
  return day === 0 ? s.hours.sunday : day === 6 ? s.hours.saturday : s.hours.weekdays;
}

/** Hourly consultation slots for a day, e.g. ["08:00", "09:00", …] (last slot starts an hour before closing). */
export function slotsFor(h: DayHours): string[] {
  if (h.closed) return [];
  const [oh] = h.open.split(":").map(Number);
  const [ch, cm] = h.close.split(":").map(Number);
  const out: string[] = [];
  for (let t = oh; t + 1 <= ch + (cm ? cm / 60 : 0); t++) out.push(`${String(t).padStart(2, "0")}:00`);
  return out;
}

const CODES: Record<string, string> = {
  "united kingdom": "UK", uk: "UK", "united states": "US", usa: "US", canada: "CA", australia: "AU",
  ireland: "IE", "new zealand": "NZ", germany: "DE", "united arab emirates": "AE", uae: "AE",
  "saudi arabia": "SA", qatar: "QA", netherlands: "NL", belgium: "BE",
};
export function countryCode(name: string) {
  return CODES[name.trim().toLowerCase()] ?? name.trim().slice(0, 2).toUpperCase();
}
