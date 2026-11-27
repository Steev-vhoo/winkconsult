import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Markdown } from "@/components/Markdown";
import { CtaBand, PageHero } from "@/components/site/CtaBand";
import { listServices } from "@/lib/content";
import { fmtDay, getSettings, waLink } from "@/lib/settings";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Services",
  description: "MOH International Clearance, GH-NMC Foreign Verification, PIN Renewal, UK-NMC Registration, CBT and IELTS tuition for Ghanaian-trained nurses and midwives.",
};

export default async function Services() {
  const [s, services] = await Promise.all([getSettings(), listServices()]);
  return (
    <>
      <PageHero eyebrow="Our services" title="How we help you get there"
        lead="Clear guidance, honest advice and step-by-step support for every stage of your international nursing or midwifery journey." />
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          {services.map((x) => (
            <article key={x.id} className="service" id={x.slug}>
              <div className="service-aside">
                <div className={`icon${x.category === "partner" ? " gold" : ""}`}><Icon name={x.icon} /></div>
                <h2>{x.title}</h2>
                <p style={{ color: "var(--muted)" }}>{x.summary}</p>
                <a className="btn btn-wa" href={waLink(s.contact.whatsapp, x.whatsapp_message || `Hello WiNK CONSULT, I'd like help with ${x.title}.`)} target="_blank" rel="noopener">
                  <Icon name="wa" /> Enquire on WhatsApp
                </a>
              </div>
              <Markdown className="service-body prose">{x.body_md}</Markdown>
            </article>
          ))}
        </div>
      </section>
      <section className="section section-alt">
        <div className="container split">
          <div>
            <span className="eyebrow">Book a session</span>
            <h2>Talk it through with us</h2>
            <p className="lead">Not sure which steps apply to you? Book a consultation and we&apos;ll give you a clear plan.</p>
            <Link className="btn btn-primary" href="/classes#book">Book a consultation →</Link>
          </div>
          <div className="panel">
            <div className="icon"><Icon name="clock" /></div>
            <h3>Booking hours (GMT)</h3>
            <table className="hours"><tbody>
              <tr><td>Monday – Friday</td><td>{fmtDay(s.hours.weekdays)}</td></tr>
              <tr><td>Saturday</td><td>{fmtDay(s.hours.saturday)}</td></tr>
              <tr><td>Sunday</td><td>{fmtDay(s.hours.sunday)}</td></tr>
            </tbody></table>
          </div>
        </div>
      </section>
      <CtaBand settings={s} />
    </>
  );
}
