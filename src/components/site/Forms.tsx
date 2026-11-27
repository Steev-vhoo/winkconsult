"use client";

import { useActionState, useMemo, useState } from "react";
import { type FormState, submitBooking, submitEnquiry } from "@/app/(site)/actions";
import { ICONS } from "@/lib/icons";

const WaIcon = () => <span className="i" dangerouslySetInnerHTML={{ __html: ICONS.wa }} />;

function Field({ label, name, error, children }: { label: string; name: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      {children}
      {error && <p className="field-err" id={`${name}-err`}>{error}</p>}
    </div>
  );
}

function Result({ state }: { state: FormState }) {
  if (!state) return null;
  return (
    <div className={`form-msg ${state.ok ? "ok" : "err"}`} role={state.ok ? "status" : "alert"}>
      <p style={{ margin: 0 }}>{state.message}</p>
      {state.ok && state.waUrl && (
        <p style={{ margin: "12px 0 0" }}>
          <a className="btn btn-wa" href={state.waUrl} target="_blank" rel="noopener"><WaIcon /> Also message us on WhatsApp</a>
        </p>
      )}
    </div>
  );
}

const Honeypot = () => (
  <div className="hp" aria-hidden="true">
    <label htmlFor="website">Leave this empty</label>
    <input id="website" name="website" tabIndex={-1} autoComplete="off" />
  </div>
);

/* ---------- Contact form ---------- */

export function EnquiryForm({ services }: { services: string[] }) {
  const [state, action, pending] = useActionState(submitEnquiry, null);
  if (state?.ok) return <Result state={state} />;
  const e = state?.errors ?? {};
  const v = state?.values ?? {};
  const inv = (k: string) => (e[k] ? { "aria-invalid": true, "aria-describedby": `${k}-err` } : {});
  return (
    <form className="form" action={action} noValidate>
      <Honeypot />
      <div className="form-row">
        <Field label="Full name" name="name" error={e.name}><input id="name" name="name" required autoComplete="name" defaultValue={v.name} {...inv("name")} /></Field>
        <Field label="Phone / WhatsApp" name="phone" error={e.phone}><input id="phone" name="phone" required type="tel" autoComplete="tel" placeholder="e.g. 024 000 0000" defaultValue={v.phone} {...inv("phone")} /></Field>
      </div>
      <div className="form-row">
        <Field label="Email (optional)" name="email" error={e.email}><input id="email" name="email" type="email" autoComplete="email" defaultValue={v.email} {...inv("email")} /></Field>
        <Field label="Where are you based?" name="location"><input id="location" name="location" placeholder="e.g. Kumasi, or London" defaultValue={v.location} /></Field>
      </div>
      <Field label="Service" name="service">
        <select id="service" name="service" defaultValue={v.service}>
          {services.map((s) => <option key={s}>{s}</option>)}
          <option>Not sure, I need advice</option>
        </select>
      </Field>
      <Field label="Message" name="message" error={e.message}>
        <textarea id="message" name="message" placeholder="Tell us a little about where you trained and where you're hoping to go." defaultValue={v.message} />
      </Field>
      {state && !state.ok && <Result state={state} />}
      <button className="btn btn-gold" type="submit" disabled={pending}>{pending ? "Sending…" : "Send enquiry"}</button>
    </form>
  );
}

/* ---------- Booking form ---------- */

type ClassOpt = { id: string; label: string; full: boolean };
type DaySlots = { weekdays: string[]; saturday: string[]; sunday: string[] };

export function BookingForm({ classes, topics, slots, initialClass, today }: {
  classes: ClassOpt[]; topics: string[]; slots: DaySlots; initialClass?: string; today: string;
}) {
  const [state, action, pending] = useActionState(submitBooking, null);
  const [type, setType] = useState<"class" | "consultation">(classes.some((c) => !c.full) || initialClass ? "class" : "consultation");
  const [date, setDate] = useState("");
  const daySlots = useMemo(() => {
    if (!date) return [];
    const d = new Date(`${date}T00:00:00Z`).getUTCDay();
    return d === 0 ? slots.sunday : d === 6 ? slots.saturday : slots.weekdays;
  }, [date, slots]);
  const max = new Date(Date.parse(`${today}T00:00:00Z`) + 90 * 864e5).toISOString().slice(0, 10);

  if (state?.ok) return <Result state={state} />;
  const e = state?.errors ?? {};
  const v = state?.values ?? {};
  const inv = (k: string) => (e[k] ? { "aria-invalid": true, "aria-describedby": `${k}-err` } : {});
  const fmt = (t: string) => { const h = +t.slice(0, 2); return `${h % 12 || 12}:00${h >= 12 ? "pm" : "am"}`; };

  return (
    <form className="form" action={action} noValidate>
      <Honeypot />
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ fontWeight: 600, fontSize: ".92rem", color: "var(--navy)", marginBottom: 8 }}>What would you like to book?</legend>
        <div className="seg">
          <label><input type="radio" name="type" value="class" checked={type === "class"} onChange={() => setType("class")} /><span>A class</span></label>
          <label><input type="radio" name="type" value="consultation" checked={type === "consultation"} onChange={() => setType("consultation")} /><span>A consultation</span></label>
        </div>
      </fieldset>

      {type === "class" ? (
        classes.length ? (
          <Field label="Class" name="class_id" error={e.class_id}>
            <select id="class_id" name="class_id" defaultValue={v.class_id || initialClass} {...inv("class_id")}>
              {classes.map((c) => <option key={c.id} value={c.id} disabled={c.full}>{c.label}{c.full ? " (full)" : ""}</option>)}
            </select>
          </Field>
        ) : (
          <p className="notice">No classes are open right now. Book a consultation, or message us to hear about the next intake.</p>
        )
      ) : (
        <>
          <Field label="Topic" name="topic" error={e.topic}>
            <select id="topic" name="topic" defaultValue={v.topic} {...inv("topic")}>{topics.map((t) => <option key={t}>{t}</option>)}<option>Not sure, I need advice</option></select>
          </Field>
          <div className="form-row">
            <Field label="Preferred date" name="preferred_date" error={e.preferred_date}>
              <input id="preferred_date" name="preferred_date" type="date" min={today} max={max} value={date} onChange={(ev) => setDate(ev.target.value)} required {...inv("preferred_date")} />
            </Field>
            <Field label="Preferred time (GMT)" name="preferred_time" error={e.preferred_time}>
              <select id="preferred_time" name="preferred_time" disabled={!date || !daySlots.length} defaultValue={v.preferred_time} {...inv("preferred_time")}>
                {!date && <option value="">Choose a date first</option>}
                {date && !daySlots.length && <option value="">Closed on this day</option>}
                {daySlots.map((t) => <option key={t} value={t}>{fmt(t)}</option>)}
              </select>
            </Field>
          </div>
        </>
      )}

      <div className="form-row">
        <Field label="Full name" name="name" error={e.name}><input id="name" name="name" required autoComplete="name" defaultValue={v.name} {...inv("name")} /></Field>
        <Field label="Phone / WhatsApp" name="phone" error={e.phone}><input id="phone" name="phone" type="tel" required autoComplete="tel" defaultValue={v.phone} {...inv("phone")} /></Field>
      </div>
      <Field label="Email (optional)" name="email" error={e.email}><input id="email" name="email" type="email" autoComplete="email" defaultValue={v.email} {...inv("email")} /></Field>
      <Field label="Anything we should know? (optional)" name="message"><textarea id="message" name="message" style={{ minHeight: 90 }} defaultValue={v.message} /></Field>
      {state && !state.ok && <Result state={state} />}
      <button className="btn btn-gold" type="submit" disabled={pending || (type === "class" && !classes.some((c) => !c.full))}>
        {pending ? "Booking…" : type === "class" ? "Reserve my seat" : "Request consultation"}
      </button>
      <p className="form-note">We&apos;ll contact you on WhatsApp or by phone to confirm.</p>
    </form>
  );
}
