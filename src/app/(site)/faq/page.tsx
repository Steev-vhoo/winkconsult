import type { Metadata } from "next";
import { Markdown } from "@/components/Markdown";
import { CtaBand, PageHero } from "@/components/site/CtaBand";
import { type Faq, listFaqs, slugify } from "@/lib/content";
import { getSettings, waLink } from "@/lib/settings";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about MOH International Clearance, NMC Foreign Verification, GH-NMC PIN renewal and IELTS.",
};

export default async function FaqPage() {
  const [s, faqs] = await Promise.all([getSettings(), listFaqs()]);
  const groups = new Map<string, Faq[]>();
  for (const f of faqs) groups.set(f.category, [...(groups.get(f.category) ?? []), f]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer_md.replace(/\*\*/g, "") } })),
  };

  return (
    <>
      <PageHero eyebrow="FAQ" title="Frequently asked questions" lead="Straight answers to the questions Ghanaian nurses and midwives ask us most." />
      <section className="section">
        <div className="container">
          <div className="faq-list">
            {[...groups.entries()].map(([cat, items]) => (
              <div key={cat}>
                <h2 className="faq-cat" id={slugify(cat)} style={{ scrollMarginTop: 90 }}>{cat}</h2>
                {items.map((f) => (
                  <details key={f.id} className="faq-item">
                    <summary>{f.question}</summary>
                    <Markdown className="faq-a">{f.answer_md}</Markdown>
                  </details>
                ))}
              </div>
            ))}
            <div className="notice" style={{ marginTop: 32 }}>
              Didn&apos;t find your question?{" "}
              <a href={waLink(s.contact.whatsapp, "Hello WiNK CONSULT, I have a question.")} target="_blank" rel="noopener"><strong>Ask us on WhatsApp</strong></a>{" "}
              and we&apos;ll get back to you during booking hours.
            </div>
          </div>
        </div>
      </section>
      <CtaBand settings={s} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
