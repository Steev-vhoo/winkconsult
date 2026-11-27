import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { PageHero } from "@/components/site/CtaBand";
import { EnquiryForm } from "@/components/site/Forms";
import { listServices } from "@/lib/content";
import { fmtDay, getSettings, telLink, waLink } from "@/lib/settings";

export const revalidate = 300;
export const metadata: Metadata = { title: "Contact Us", description: "Contact WiNK CONSULT on WhatsApp, by phone or email." };

export default async function Contact() {
  const [s, services] = await Promise.all([getSettings(), listServices()]);
  const wa = waLink(s.contact.whatsapp, "Hello WiNK CONSULT, I'd like to make an enquiry.");
  return (
    <>
      <PageHero eyebrow="Contact us" title="Let's talk about your journey" lead="WhatsApp is the fastest way to reach us. You can also call, email, or send an enquiry below." />
      <section className="section">
        <div className="container contact-grid">
          <div>
            <div className="contact-item"><div className="icon" style={{ background: "#e5f9ed", color: "#1a9e4b" }}><Icon name="wa" /></div><div><strong>WhatsApp</strong><a href={wa} target="_blank" rel="noopener">{s.contact.whatsapp}</a><br /><span>Fastest response</span></div></div>
            {s.contact.phone && <div className="contact-item"><div className="icon"><Icon name="phone" /></div><div><strong>Phone call</strong><a href={telLink(s.contact.phone)}>{s.contact.phone}</a></div></div>}
            {s.contact.email && <div className="contact-item"><div className="icon"><Icon name="mail" /></div><div><strong>Email</strong><a href={`mailto:${s.contact.email}`}>{s.contact.email}</a></div></div>}
            {s.contact.whatsappGroup && <div className="contact-item"><div className="icon"><Icon name="users" /></div><div><strong>WhatsApp community</strong><a href={s.contact.whatsappGroup} target="_blank" rel="noopener">Join our WhatsApp group</a><br /><span>Updates and tips for nurses and midwives</span></div></div>}
            {s.contact.tiktok && <div className="contact-item"><div className="icon"><Icon name="tiktok" /></div><div><strong>TikTok</strong><a href={`https://www.tiktok.com/@${s.contact.tiktok}`} target="_blank" rel="noopener">@{s.contact.tiktok}</a></div></div>}
            {s.contact.address && <div className="contact-item"><div className="icon"><Icon name="compass" /></div><div><strong>Office</strong><span>{s.contact.address}</span></div></div>}
            <div className="panel" style={{ marginTop: 20 }}>
              <h3>Booking hours (GMT)</h3>
              <table className="hours"><tbody>
                <tr><td>Monday – Friday</td><td>{fmtDay(s.hours.weekdays)}</td></tr>
                <tr><td>Saturday</td><td>{fmtDay(s.hours.saturday)}</td></tr>
                <tr><td>Sunday</td><td>{fmtDay(s.hours.sunday)}</td></tr>
              </tbody></table>
            </div>
          </div>
          <div className="panel">
            <h2 style={{ fontSize: "1.5rem" }}>Send an enquiry</h2>
            <p style={{ color: "var(--muted)" }}>Leave your details and we&apos;ll get back to you during booking hours.</p>
            <EnquiryForm services={services.map((x) => x.title)} />
          </div>
        </div>
      </section>
    </>
  );
}
