/* Loads WiNK's starting content. Only inserts what is missing, so it is safe to run again. */
import postgres from "postgres";
import { loadEnv } from "./env";

loadEnv();
const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });

const DRAFT = "_Draft: WiNK to confirm the details for this service._";

const services = [
  {
    slug: "moh-clearance", title: "MOH International Clearance", icon: "shield", tile: "Clearance",
    summary: "Clearance from the Ministry of Health for nurses and midwives trained in public institutions (NMTCs).",
    wa: "Hello WiNK CONSULT, I'd like help with my MOH International Clearance.",
    body: `### Who needs it?
Any nurse or midwife who attended a public training institution (NMTC) for a 2-year or 3-year programme.

### When do you need it?
Depending on your cadre, clearance could be needed after school, after your rotation, or when you are permanently posted.

### How we help
The MOH International Clearance can be purchased online on the Ministry of Health website, and we can help you with that, guiding you through the process so it's done right.`,
  },
  {
    slug: "nmc-verification", title: "GH-NMC Foreign Verification", icon: "filecheck", tile: "Verification",
    summary: "We guide you through your Ghana NMC foreign verification when your overseas regulator requests it.",
    wa: "Hello WiNK CONSULT, I'd like help with my NMC Foreign Verification.",
    body: `### Do I need MOH clearance first?
- **Public training institution:** Yes, you need your MOH International Clearance before requesting NMC Foreign Verification.
- **Private institution or 4-year degree programme:** You can request NMC Foreign Verification without MOH clearance.

### When should I pay?
Only when it is needed or requested. You don't pay for NMC Foreign Verification before your international process starts.

### Certificate of Good Standing
NMC Ghana can issue a Certificate of Good Standing (for example, for a UK process) once the necessary payments are made. It isn't given to you directly; it is sent to the institution requesting it.`,
  },
  {
    slug: "pin-renewal", title: "GH-NMC PIN Renewal", icon: "refresh", tile: "Renewal",
    summary: "Keep your GH-NMC PIN active with yearly renewal, including for nurses and midwives abroad.",
    wa: "Hello WiNK CONSULT, I'd like help renewing my GH-NMC PIN.",
    body: `### How often?
GH-NMC PIN renewal is done once every year, not after the 4- or 5-year validity period on the card.

### Renewing from the diaspora
Nurses and midwives abroad pay £90 or $100 on the WCEA app to access and accumulate enough CPD points to renew their GH-NMC PIN. We guide you through it.`,
  },
  {
    slug: "uk-nmc", title: "UK-NMC Registration", icon: "globe", tile: "Registration",
    summary: "Support with your registration with the Nursing and Midwifery Council in the United Kingdom.",
    wa: "Hello WiNK CONSULT, I'd like help with my UK-NMC registration.",
    body: `### How we help
We guide you through your UK-NMC registration, alongside your Ghana documents such as NMC verification and the Certificate of Good Standing.

${DRAFT}`,
  },
  {
    slug: "cbt", title: "CBT Voucher, Booking & Tuition", icon: "cert", tile: "Exams",
    summary: "Get your CBT voucher, book your test and prepare with our tuition.",
    wa: "Hello WiNK CONSULT, I'd like help with my CBT (voucher, booking or tuition).",
    body: `### Voucher and booking
We help you get your CBT voucher and book your test.

### Tuition
Prepare for the CBT with tuition from WiNK. See open classes on our [Classes page](/classes).

${DRAFT}`,
  },
  {
    slug: "ielts", title: "IELTS Tuition & Booking", icon: "book", tile: "Exams",
    summary: "IELTS lessons and exam booking to help you reach the score your destination needs.",
    wa: "Hello WiNK CONSULT, I'm interested in your IELTS tuition.",
    body: `### IELTS tuition
Expert IELTS lessons to prepare you for the score you need to practise abroad. See open classes on our [Classes page](/classes).

### Exam booking
We help you register for the right IELTS test. The type you need depends on your purpose and the country you're taking it to.

### Good to know
IELTS results expire after two years, so plan your test date around your application timeline.`,
  },
  {
    slug: "research", title: "Research Work", icon: "badge", tile: "Academic",
    summary: "Support with research work for nurses and midwives.",
    wa: "Hello WiNK CONSULT, I'd like to ask about research work support.",
    body: `### How we help
Support with research work. Ask us on WhatsApp about what you need.

${DRAFT}`,
  },
  {
    slug: "partner-services", title: "Partner services", icon: "passport", tile: "Via partners", category: "partner",
    summary: "Through trusted partners: OSCE & NCLEX tuition, passports, birth certificates, bank statements, police reports and more.",
    wa: "Hello WiNK CONSULT, I'd like help with partner services (e.g. OSCE/NCLEX tuition, passport, police report).",
    body: `We have trustworthy partners who can help with:

- OSCE & NCLEX tuition
- Passports
- Birth certificates
- Bank statements
- Police reports
- And more`,
  },
];

const faqs: [string, string, string][] = [
  ["MOH International Clearance", "Which group of nurses are required to clear themselves from the MOH?", "Any nurse or midwife who ever attended a public training institution (NMTC) for a 2-year or 3-year programme."],
  ["MOH International Clearance", "How can one get access to the MOH International Clearance?", "It can be purchased online on the MOH website. We can also help you with that."],
  ["MOH International Clearance", "At what point does one have to clear themselves from the MOH?", "Depending on your cadre, it could be after school, after your rotation, or when you are permanently posted."],
  ["NMC Foreign Verification", "Can I request NMC Foreign Verification without doing my MOH International Clearance?", "**No**, if you ever attended a public training institution.\n\n**Yes**, if you attended a private institution or pursued a degree programme (4 years)."],
  ["NMC Foreign Verification", "Can we pay for the NMC Foreign Verification before we start our international process?", "No. You pay for your NMC Foreign Verification only when it's needed or requested."],
  ["NMC Foreign Verification", "Can NMC Ghana give me a Certificate of Good Standing for my UK process?", "Yes, they can, after the necessary payments are made. However, it isn't given to you; it is sent to the institution requesting it."],
  ["NMC PIN Renewal", "How can I renew my GH-NMC PIN as a nurse or midwife in the diaspora?", "You pay £90 or $100 on the WCEA app to get access to accumulate enough CPD points to renew your GH-NMC PIN."],
  ["NMC PIN Renewal", "Do we renew our GH-NMC PINs after the 4- or 5-year validity period on the card?", "No. PIN renewal is done once every year."],
  ["IELTS", "Which type of IELTS exam should I register for?", "That depends on your purpose and the place you'd like to take it to. Message us and we'll help you choose."],
  ["IELTS", "Does the IELTS expire?", "Yes. IELTS results expire after two years."],
];

async function main() {
  let i = 0;
  for (const s of services) {
    i += 10;
    await sql`
      insert into services (slug, title, icon, summary, body_md, whatsapp_message, category, tile_label, sort_order)
      values (${s.slug}, ${s.title}, ${s.icon}, ${s.summary}, ${s.body}, ${s.wa}, ${s.category ?? "core"}, ${s.tile}, ${i})
      on conflict (slug) do nothing`;
  }
  const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from faqs`;
  if (n === 0) {
    let j = 0;
    for (const [cat, q, a] of faqs) {
      j += 10;
      await sql`insert into faqs (category, question, answer_md, sort_order) values (${cat}, ${q}, ${a}, ${j})`;
    }
  }
  await sql`insert into settings (key, value) values ('site', ${sql.json({
    banner: "Preview site: some details are still being confirmed with WiNK.",
  })}) on conflict (key) do nothing`;
  await sql`
    insert into posts (slug, title, excerpt, body_md, status)
    values ('do-you-need-moh-clearance', 'Do you need MOH International Clearance?',
      'If you trained at a public institution (NMTC) on a 2- or 3-year programme, yes. Here is what to know.',
      ${"If you trained at a public nursing or midwifery training college (NMTC) on a 2-year or 3-year programme, you need MOH International Clearance before you can request your NMC Foreign Verification.\n\n## When to get it\n\nDepending on your cadre, it could be after school, after your rotation, or when you are permanently posted.\n\n## How to get it\n\nIt can be purchased online on the Ministry of Health website. [Chat with us](/contact) and we'll guide you through it."},
      'draft')
    on conflict (slug) do nothing`;
  console.log("seed complete");
}

main().then(() => sql.end()).catch(async (e) => { console.error(e); await sql.end(); process.exit(1); });
