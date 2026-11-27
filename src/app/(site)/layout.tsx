import Link from "next/link";
import "../site.css";
import { Icon } from "@/components/Icon";
import { Nav } from "@/components/site/NavToggle";
import { listServices } from "@/lib/content";
import { fmtDay, getSettings, telLink, waLink } from "@/lib/settings";

export const revalidate = 300;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [s, services] = await Promise.all([getSettings(), listServices()]);
  const wa = waLink(s.contact.whatsapp, "Hello WiNK CONSULT, I'd like to make an enquiry.");
  const core = services.filter((x) => x.category === "core").slice(0, 6);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      {s.banner && <div className="notice-bar">{s.banner}</div>}
      <header className="site-header">
        <nav className="container nav" aria-label="Main">
          <Link className="logo" href="/" aria-label="WiNK CONSULT home">
            <img src="/brand/logo.svg" alt="WiNK CONSULT" width={180} height={56} />
          </Link>
          <Nav waHref={wa} />
        </nav>
      </header>

      <main id="main">{children}</main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link className="logo" href="/" aria-label="WiNK CONSULT home">
                <img src="/brand/logo-reverse.svg" alt="WiNK CONSULT" width={200} height={62} />
              </Link>
              <p>Trusted support for Ghanaian-trained nurses and midwives at home and in the diaspora.</p>
              <p className="tagline-foot">{s.brand.tagline}</p>
              {s.brand.hashtag && <p className="hashtag">{s.brand.hashtag}</p>}
            </div>
            <div>
              <h4>Services</h4>
              <ul>
                {core.map((x) => (
                  <li key={x.id}><Link href={`/services#${x.slug}`}>{x.title}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Company</h4>
              <ul>
                <li><Link href="/about">About us</Link></li>
                <li><Link href="/classes">Classes &amp; booking</Link></li>
                <li><Link href="/blog">Updates</Link></li>
                <li><Link href="/faq">FAQ</Link></li>
                <li><Link href="/contact">Contact</Link></li>
                {s.contact.whatsappGroup && (
                  <li><a href={s.contact.whatsappGroup} target="_blank" rel="noopener">Join our WhatsApp group</a></li>
                )}
              </ul>
            </div>
            <div>
              <h4>Get in touch</h4>
              <ul>
                <li><a href={wa} target="_blank" rel="noopener">WhatsApp: {s.contact.whatsapp}</a></li>
                {s.contact.phone && <li><a href={telLink(s.contact.phone)}>Call: {s.contact.phone}</a></li>}
                {s.contact.email && <li><a href={`mailto:${s.contact.email}`}>{s.contact.email}</a></li>}
                {s.contact.address && <li>{s.contact.address}</li>}
              </ul>
              <div className="socials">
                {s.contact.tiktok && (
                  <a href={`https://www.tiktok.com/@${s.contact.tiktok}`} target="_blank" rel="noopener" aria-label="TikTok"><Icon name="tiktok" /></a>
                )}
                <a href={wa} target="_blank" rel="noopener" aria-label="WhatsApp"><Icon name="wa" /></a>
                {s.contact.email && <a href={`mailto:${s.contact.email}`} aria-label="Email"><Icon name="mail" /></a>}
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} WiNK CONSULT. All rights reserved.</span>
            <span>
              Mon–Fri {fmtDay(s.hours.weekdays)} · Sat {fmtDay(s.hours.saturday)}
              {!s.hours.sunday.closed && ` · Sun ${fmtDay(s.hours.sunday)}`} (GMT)
            </span>
          </div>
        </div>
      </footer>

      <a className="wa-float" href={wa} target="_blank" rel="noopener" aria-label="Chat with WiNK CONSULT on WhatsApp">
        <Icon name="wa" />
        <span className="wa-label">Chat with us on WhatsApp</span>
      </a>
    </>
  );
}
