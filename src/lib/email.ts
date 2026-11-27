import "server-only";

/* Sends email through Resend's HTTP API (https://resend.com, free tier: 3,000 emails/month).
   No SDK needed. Configure with RESEND_API_KEY and EMAIL_FROM. */

export type Email = { to: string[]; subject: string; text: string; html: string; replyTo?: string };
export type SendResult = { ok: true; id: string } | { ok: false; error: string };

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(msg: Email): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "Email is not set up yet (RESEND_API_KEY is missing)." };
  if (!msg.to.length) return { ok: false, error: "No alert recipients are set in Site settings." };

  try {
    const res = await fetch(process.env.RESEND_API_URL ?? "https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "WiNK Website <onboarding@resend.dev>",
        to: msg.to,
        subject: oneLine(msg.subject).slice(0, 200),
        text: msg.text,
        html: msg.html,
        ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) return { ok: false, error: `Email service error ${res.status}: ${body.message ?? res.statusText}`.slice(0, 300) };
    return { ok: true, id: body.id ?? "" };
  } catch (e) {
    return { ok: false, error: `Could not reach the email service: ${(e as Error).message}`.slice(0, 300) };
  }
}

export function oneLine(s: string) {
  return s.replace(/[\r\n]+/g, " ").trim();
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export const isEmail = (s: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s) && s.length <= 200;
