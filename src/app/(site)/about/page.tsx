import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { CtaBand, PageHero } from "@/components/site/CtaBand";
import { listServices } from "@/lib/content";
import { getSettings } from "@/lib/settings";

export const revalidate = 300;
export const metadata: Metadata = { title: "About Us" };

export default async function About() {
  const [s, services] = await Promise.all([getSettings(), listServices()]);
  const core = services.filter((x) => x.category === "core");
  return (
    <>
      <PageHero eyebrow="About us" title="About WiNK CONSULT" lead={s.about.intro} />
      <section className="section">
        <div className="container split">
          <div>
            <span className="eyebrow">Who we are</span>
            <h2>Making the journey abroad simple</h2>
            <p>We understand that the journey to working abroad can be confusing, stressful and full of paperwork. That is why we are here: to make it simple.</p>
            <p>We specialise in <strong>{core.map((x) => x.title).join(", ")}</strong>, providing clear guidance, honest advice and step-by-step support from start to finish.</p>
            <p>At WiNK CONSULT, we don&apos;t just process documents. We walk with you, so you can achieve your global career dreams with confidence, transparency and peace of mind.</p>
          </div>
          <div className="panel">
            <div className="icon gold"><Icon name="briefcase" /></div>
            <h3>Trusted partner services</h3>
            <p style={{ color: "var(--muted)" }}>We have trustworthy partners who can provide additional services such as:</p>
            <ul className="checklist">
              <li>OSCE &amp; NCLEX tuition</li><li>Passports</li><li>Birth certificates</li><li>Bank statements</li><li>Police reports</li><li>And more</li>
            </ul>
          </div>
        </div>
      </section>
      <section className="section section-alt">
        <div className="container mv-grid">
          <div className="mv-card vision"><div className="icon gold"><Icon name="eye" /></div><h3>Our vision</h3><p>{s.about.vision}</p></div>
          <div className="mv-card mission"><div className="icon" style={{ background: "#fff" }}><Icon name="heart" /></div><h3>Our mission</h3><p>{s.about.mission}</p></div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="section-head center"><span className="eyebrow">What we stand for</span><h2>How we work with you</h2></div>
          <div className="grid grid-3">
            <div className="card"><div className="icon"><Icon name="shield" /></div><h3>Reliable</h3><p>We do what we say, on time, every time.</p></div>
            <div className="card"><div className="icon"><Icon name="eye" /></div><h3>Transparent</h3><p>Honest advice about what you need, and what you don&apos;t.</p></div>
            <div className="card"><div className="icon"><Icon name="heart" /></div><h3>Stress-free</h3><p>We handle the confusion so you can focus on your career.</p></div>
          </div>
        </div>
      </section>
      <CtaBand settings={s} />
    </>
  );
}
