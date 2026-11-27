import { Icon } from "@/components/Icon";
import { type SiteSettings, telLink, waLink } from "@/lib/settings";

export function CtaBand({ settings: s }: { settings: SiteSettings }) {
  return (
    <section className="section">
      <div className="container">
        <div className="cta-band">
          <div>
            <h2>Ready to start your journey?</h2>
            <p>Send us a message on WhatsApp. We&apos;ll tell you exactly what you need and walk with you every step of the way.</p>
          </div>
          <div className="btn-row">
            <a className="btn btn-wa" href={waLink(s.contact.whatsapp, "Hello WiNK CONSULT, I'd like to make an enquiry.")} target="_blank" rel="noopener">
              <Icon name="wa" /> Chat on WhatsApp
            </a>
            {s.contact.phone && <a className="btn btn-outline-light" href={telLink(s.contact.phone)}><Icon name="phone" /> Call us</a>}
          </div>
        </div>
      </div>
    </section>
  );
}

export function PageHero({ eyebrow, title, lead }: { eyebrow: string; title: React.ReactNode; lead?: string }) {
  return (
    <section className="page-hero">
      <div className="container">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {lead && <p>{lead}</p>}
      </div>
    </section>
  );
}
