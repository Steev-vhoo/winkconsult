"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ICONS } from "@/lib/icons";

const NAV = [
  ["/", "Home"],
  ["/about", "About"],
  ["/services", "Services"],
  ["/classes", "Classes"],
  ["/blog", "Updates"],
  ["/faq", "FAQ"],
  ["/contact", "Contact"],
] as const;

export function Nav({ waHref }: { waHref: string }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <>
      <button className="nav-toggle" aria-label="Open menu" aria-expanded={open} aria-controls="nav-links" onClick={() => setOpen(!open)}>
        <span className="i" dangerouslySetInnerHTML={{ __html: ICONS.menu }} />
      </button>
      <ul className={`nav-links${open ? " open" : ""}`} id="nav-links">
        {NAV.map(([href, label]) => (
          <li key={href}>
            <Link href={href} aria-current={active(href) ? "page" : undefined}>{label}</Link>
          </li>
        ))}
        <li>
          <a className="btn btn-wa nav-cta" href={waHref} target="_blank" rel="noopener">
            <span className="i" dangerouslySetInnerHTML={{ __html: ICONS.wa }} /> Chat with us
          </a>
        </li>
      </ul>
    </>
  );
}
