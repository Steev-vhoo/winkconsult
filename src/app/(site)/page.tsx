import Link from "next/link";
import { Icon } from "@/components/Icon";
import { CtaBand } from "@/components/site/CtaBand";
import { PostCard } from "@/components/site/PostCard";
import { fmtDate, listClasses, listFaqs, listPublishedPosts, listServices } from "@/lib/content";
import { countryCode, getSettings, waLink } from "@/lib/settings";

export const revalidate = 300;

const DEST_GRADIENTS = ["d-uk", "d-us", "d-ca", "d-au", "d-ie"];

export default async function Home() {
  const [s, services, faqs, posts, classes] = await Promise.all([
    getSettings(), listServices(), listFaqs(), listPublishedPosts(3), listClasses({ publicOnly: true }),
  ]);
  const wa = waLink(s.contact.whatsapp, "Hello WiNK CONSULT, I'd like to make an enquiry.");
  const tiles = services.slice(0, 8);
  const quickFaqs = faqs.slice(0, 3);
  const nextClasses = classes.slice(0, 3);
  const chips = services.filter((x) => x.category === "core").slice(0, 3);

  return (
    <>
      <section className="hero-light">
        <div className="container hero-grid">
          <div>
            <h1>
              {s.hero.title} <span className="accent">{s.hero.accent}</span>
            </h1>
            <p className="lead">{s.hero.lead}</p>
            <div className="btn-row">
              <a className="btn btn-gold" href={wa} target="_blank" rel="noopener"><Icon name="wa" /> Chat on WhatsApp</a>
              <Link className="btn btn-outline" href="/classes">Book a class or consultation →</Link>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-blob" />
            <div className="photo-slot">
              <div className="big">Ghana<br /><span>to the</span><br />world.</div>
              <small>Photo from WiNK</small>
            </div>
            <span className="plane"><Icon name="plane" /></span>
            {chips.map((c, i) => (
              <div key={c.id} className={`float-chip chip-${i + 1}`}>
                <span className={`ic${i === 0 ? " ok" : i === 2 ? " or" : ""}`}><Icon name={i === 0 ? "check" : c.icon} /></span>
                <div><strong>{c.title}</strong><span>{c.tile_label}</span></div>
              </div>
            ))}
          </div>
        </div>
        <div className="container">
          <div className="feature-bar">
            <div><Icon name="globe" /><div><strong>Home &amp; diaspora</strong><span>Support wherever you are</span></div></div>
            <div><Icon name="eye" /><div><strong>Transparent advice</strong><span>Pay only for what you need</span></div></div>
            <div><Icon name="compass" /><div><strong>Step-by-step</strong><span>From start to finish</span></div></div>
            <div><Icon name="chat" /><div><strong>WhatsApp support</strong><span>Mon–Sat, GMT hours</span></div></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container svc-split">
          <div>
            <span className="eyebrow">Our services</span>
            <h2>Complete support for your journey abroad</h2>
            <p className="lead">From MOH clearance to UK-NMC registration, CBT and IELTS, we handle the paperwork and exams that stand between you and your international nursing career.</p>
            <Link className="btn btn-primary" href="/services">Explore our services →</Link>
          </div>
          <div className="tile-grid">
            {tiles.map((t) => (
              <Link key={t.id} className={`tile${t.category === "partner" ? " partner" : ""}`} href={`/services#${t.slug}`}>
                <span className="ti"><Icon name={t.icon} /></span>
                <b>{t.title}</b>
                <small>{t.tile_label}</small>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {nextClasses.length > 0 && (
        <section className="section section-alt">
          <div className="container">
            <div className="head-row">
              <div className="section-head">
                <span className="eyebrow">Classes</span>
                <h2>Open for registration</h2>
              </div>
              <Link className="arrow-link" href="/classes">All classes →</Link>
            </div>
            <div className="grid grid-3">
              {nextClasses.map((c) => (
                <div key={c.id} className="card class-card">
                  <span className="kind">{c.kind}</span>
                  <h3>{c.title}</h3>
                  <p>{c.start_date ? `Starts ${fmtDate(c.start_date)}` : "Start date to be announced"}{c.schedule && ` · ${c.schedule}`}</p>
                  <Link className="card-link" href={`/classes?class=${c.id}#book`}>Reserve a seat →</Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {s.destinations.length > 0 && (
        <section className={`section${nextClasses.length ? "" : " section-alt"}`}>
          <div className="container">
            <div className="head-row">
              <div className="section-head">
                <span className="eyebrow">Where you&apos;re headed</span>
                <h2>Popular destinations</h2>
                <p className="lead">Wherever you plan to practise, we help you get your Ghana documents and exams in order.</p>
              </div>
              <Link className="arrow-link" href="/contact">Ask about your country →</Link>
            </div>
            <div className="dest-grid">
              {s.destinations.map((d, i) => (
                <a key={d} className="dest" style={{ textDecoration: "none" }} target="_blank" rel="noopener"
                  href={waLink(s.contact.whatsapp, `Hello WiNK CONSULT, I want to practise as a nurse/midwife in ${d}. Can you help?`)}>
                  <div className={`dest-top ${DEST_GRADIENTS[i % DEST_GRADIENTS.length]}`}>{countryCode(d)}</div>
                  <div className="dest-body"><strong>{d}</strong><span>Ask what you need →</span></div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section why-band">
        <div className="container why-grid">
          <div>
            <span className="eyebrow">Why WiNK CONSULT</span>
            <h2>We don&apos;t just process documents. <span className="accent">We walk with you.</span></h2>
            <p className="lead">The journey to working abroad can be confusing, stressful and full of paperwork. We&apos;re here to make it simple.</p>
            <Link className="btn btn-gold" href="/about">More about us →</Link>
          </div>
          <div className="why-items">
            <div className="why-item"><span className="wi"><Icon name="compass" /></span><div><strong>Clear guidance</strong><span>Exactly what you need, and when you need it.</span></div></div>
            <div className="why-item"><span className="wi"><Icon name="eye" /></span><div><strong>Honest advice</strong><span>Including when you don&apos;t need to pay for something yet.</span></div></div>
            <div className="why-item"><span className="wi"><Icon name="shield" /></span><div><strong>Reliable support</strong><span>Step-by-step, from start to finish.</span></div></div>
            <div className="why-item"><span className="wi"><Icon name="users" /></span><div><strong>Trusted partners</strong><span>OSCE &amp; NCLEX tuition, passports, police reports and more.</span></div></div>
          </div>
        </div>
      </section>

      {posts.length > 0 ? (
        <section className="section">
          <div className="container">
            <div className="head-row">
              <div className="section-head"><span className="eyebrow">Latest updates</span><h2>News &amp; tips</h2></div>
              <Link className="arrow-link" href="/blog">All updates →</Link>
            </div>
            <div className="post-list">
              {posts.map((p, i) => <PostCard key={p.id} post={p} i={i} />)}
            </div>
          </div>
        </section>
      ) : (
        quickFaqs.length > 0 && (
          <section className="section section-alt">
            <div className="container">
              <div className="section-head center"><span className="eyebrow">Common questions</span><h2>Quick answers</h2></div>
              <div className="faq-list">
                {quickFaqs.map((f) => (
                  <details key={f.id} className="faq-item"><summary>{f.question}</summary><div className="faq-a"><p>{f.answer_md.replace(/\*\*/g, "")}</p></div></details>
                ))}
                <p style={{ textAlign: "center", marginTop: 24 }}><Link className="btn btn-outline" href="/faq">See all FAQs</Link></p>
              </div>
            </div>
          </section>
        )
      )}

      <CtaBand settings={s} />
    </>
  );
}
