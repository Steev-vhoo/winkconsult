import "server-only";
import { sql } from "./db";
import { escapeHtml, isEmail, sendEmail, type SendResult } from "./email";
import { digits, getSettings } from "./settings";

type Enquiry = { id: string; name: string; phone: string; email: string; location: string; service: string; message: string; created_at: Date; notified_at: Date | null };

/** Who receives alerts: the addresses in Site settings, or NOTIFY_TO as a fallback. */
export async function alertRecipients() {
  const s = await getSettings();
  const list = s.notify.emails.length ? s.notify.emails : (process.env.NOTIFY_TO ?? "").split(/[,\s]+/);
  return [...new Set(list.map((e) => e.trim().toLowerCase()).filter(isEmail))].slice(0, 10);
}

function siteUrl() {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

function whatsappFor(phone: string) {
  let d = digits(phone);
  if (d.startsWith("0") && d.length === 10) d = `233${d.slice(1)}`;
  return d.length >= 8 ? `https://wa.me/${d}` : "";
}

export function enquiryEmail(e: Enquiry) {
  const adminLink = `${siteUrl()}/admin/enquiries/${e.id}`;
  const wa = whatsappFor(e.phone);
  const when = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Accra", dateStyle: "medium", timeStyle: "short" }).format(e.created_at);
  const rows: [string, string][] = [
    ["Name", e.name], ["Phone", e.phone], ["Email", e.email || "–"], ["Location", e.location || "–"],
    ["Service", e.service || "–"], ["Received", `${when} (GMT)`],
  ];

  const text = [
    `New enquiry from the WiNK CONSULT website`,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    "Message:",
    e.message || "(no message)",
    "",
    ...(wa ? [`Reply on WhatsApp: ${wa}`] : []),
    `Open in the dashboard: ${adminLink}`,
  ].join("\n");

  const td = 'style="padding:6px 12px 6px 0;color:#5D6778;font-size:14px;vertical-align:top;white-space:nowrap"';
  const tv = 'style="padding:6px 0;color:#0E1F4D;font-size:14px;font-weight:600"';
  const btn = (href: string, label: string, bg: string) =>
    `<a href="${escapeHtml(href)}" style="display:inline-block;background:${bg};color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 18px;border-radius:999px;margin:0 8px 8px 0">${label}</a>`;
  const html = `<!doctype html><html><body style="margin:0;background:#F5F7FB;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
  <div style="background:#0E1F4D;color:#fff;border-radius:14px 14px 0 0;padding:18px 22px">
    <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#7BE0A0;font-weight:700">New enquiry</div>
    <div style="font-size:20px;font-weight:800;margin-top:4px">${escapeHtml(e.name)}</div>
  </div>
  <div style="background:#fff;border:1px solid #E3E7EE;border-top:0;border-radius:0 0 14px 14px;padding:20px 22px">
    <table role="presentation" style="border-collapse:collapse">${rows.map(([k, v]) => `<tr><td ${td}>${k}</td><td ${tv}>${escapeHtml(v)}</td></tr>`).join("")}</table>
    <div style="margin:16px 0;padding:14px;background:#FAFBFD;border:1px solid #E3E7EE;border-radius:10px;color:#1B2433;font-size:14px;line-height:1.55;white-space:pre-wrap">${escapeHtml(e.message || "(no message)")}</div>
    ${wa ? btn(wa, "Reply on WhatsApp", "#25D366") : ""}${btn(adminLink, "Open in dashboard", "#0E1F4D")}
  </div>
  <p style="color:#8A93A3;font-size:12px;text-align:center;margin-top:16px">Sent by the WiNK CONSULT website. Change who gets these alerts in Admin → Site settings.</p>
</div></body></html>`;

  const subject = `New enquiry: ${e.name}${e.service ? ` · ${e.service}` : ""}`;
  return { subject, text, html, replyTo: isEmail(e.email) ? e.email : undefined };
}

/** Emails staff about one enquiry and records the outcome. Safe to call more than once. */
export async function notifyNewEnquiry(id: string, opts: { force?: boolean } = {}): Promise<SendResult> {
  const [e] = await sql<Enquiry[]>`select id, name, phone, email, location, service, message, created_at, notified_at from enquiries where id = ${id}`;
  if (!e) return { ok: false, error: "Enquiry not found." };
  if (e.notified_at && !opts.force) return { ok: true, id: "already-sent" };

  const result = await sendEmail({ to: await alertRecipients(), ...enquiryEmail(e) });
  if (result.ok) {
    await sql`update enquiries set notified_at = now(), notify_error = '' where id = ${id}`;
  } else {
    await sql`update enquiries set notify_error = ${result.error} where id = ${id}`;
    console.error(`[enquiry-alert] ${id}: ${result.error}`);
  }
  return result;
}
