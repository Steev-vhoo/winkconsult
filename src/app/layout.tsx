import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: { default: "WiNK CONSULT | Your Global Nursing Journey, Made Simple", template: "%s | WiNK CONSULT" },
  description:
    "WiNK CONSULT helps Ghanaian-trained nurses and midwives with MOH International Clearance, NMC Foreign Verification, PIN Renewal, UK-NMC Registration, CBT and IELTS tuition.",
  icons: { icon: "/favicon.svg" },
  openGraph: { type: "website", siteName: "WiNK CONSULT" },
};

export const viewport: Viewport = { themeColor: "#0E1F4D" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
