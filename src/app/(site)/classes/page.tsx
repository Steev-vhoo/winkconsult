import type { Metadata } from "next";
import { PageHero } from "@/components/site/CtaBand";
import { BookingForm } from "@/components/site/Forms";
import { fmtDate, listClasses, listServices } from "@/lib/content";
import { fmtDay, getSettings, slotsFor } from "@/lib/settings";

export const dynamic = "force-dynamic"; // seat counts must be live
export const metadata: Metadata = {
  title: "Classes & Booking",
  description: "Book a seat in WiNK CONSULT's IELTS and CBT classes, or book a consultation.",
};

export default async function Classes({ searchParams }: { searchParams: Promise<{ class?: string }> }) {
  const [{ class: initialClass }, s, classes, services] = await Promise.all([
    searchParams, getSettings(), listClasses({ publicOnly: true }), listServices(),
  ]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHero eyebrow="Classes & booking" title="Book your seat or a consultation"
        lead="Join an upcoming IELTS or CBT class, or book a one-to-one consultation to plan your next steps." />
      <section className="section">
        <div className="container">
          <div className="section-head"><span className="eyebrow">Upcoming classes</span><h2>Open for registration</h2></div>
          {classes.length ? (
            <div className="grid grid-3">
              {classes.map((c) => {
                const left = Math.max(0, c.capacity - c.taken);
                return (
                  <article key={c.id} className="card class-card">
                    <span className="kind">{c.kind}</span>
                    <h3 style={{ margin: 0 }}>{c.title}</h3>
                    {c.description && <p style={{ margin: 0 }}>{c.description}</p>}
                    <dl className="class-meta">
                      <dt>Starts</dt><dd>{c.start_date ? fmtDate(c.start_date) : "To be announced"}</dd>
                      {c.schedule && <><dt>When</dt><dd>{c.schedule}</dd></>}
                      <dt>Where</dt><dd>{c.mode}{c.location && ` · ${c.location}`}</dd>
                      {c.price && <><dt>Fee</dt><dd>{c.price}</dd></>}
                    </dl>
                    <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span className={`seats${left === 0 ? " full" : ""}`}>{left === 0 ? "Full" : `${left} seat${left === 1 ? "" : "s"} left`}</span>
                      {left > 0 && <a className="card-link" href={`?class=${c.id}#book`}>Reserve a seat →</a>}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="empty">No classes are open for registration right now. Book a consultation below, or message us to hear about the next intake.</p>
          )}
        </div>
      </section>
      <section className="section section-alt" id="book" style={{ scrollMarginTop: 72 }}>
        <div className="container contact-grid">
          <div>
            <span className="eyebrow">Book now</span>
            <h2>Reserve a seat or book a consultation</h2>
            <p className="lead">Choose what you&apos;d like to book. We&apos;ll contact you on WhatsApp or by phone to confirm and share payment details.</p>
            <table className="hours" style={{ marginTop: 20 }}><tbody>
              <tr><td>Monday – Friday</td><td>{fmtDay(s.hours.weekdays)}</td></tr>
              <tr><td>Saturday</td><td>{fmtDay(s.hours.saturday)}</td></tr>
              <tr><td>Sunday</td><td>{fmtDay(s.hours.sunday)}</td></tr>
            </tbody></table>
          </div>
          <div className="panel" style={{ background: "#fff" }}>
            <BookingForm
              key={initialClass ?? "none"}
              today={today}
              initialClass={classes.some((c) => c.id === initialClass) ? initialClass : undefined}
              classes={classes.map((c) => ({
                id: c.id,
                label: `${c.title}${c.start_date ? ` (starts ${fmtDate(c.start_date)})` : ""}`,
                full: c.taken >= c.capacity,
              }))}
              topics={services.map((x) => x.title)}
              slots={{ weekdays: slotsFor(s.hours.weekdays), saturday: slotsFor(s.hours.saturday), sunday: slotsFor(s.hours.sunday) }}
            />
          </div>
        </div>
      </section>
    </>
  );
}
