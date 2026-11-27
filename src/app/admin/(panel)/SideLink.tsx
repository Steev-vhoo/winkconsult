"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SideLink({ href, exact, count, children }: { href: string; exact?: boolean; count?: number; children: React.ReactNode }) {
  const path = usePathname();
  const active = exact ? path === href : path === href || path.startsWith(`${href}/`);
  return (
    <Link className="nav" href={href} aria-current={active ? "page" : undefined}>
      <span>{children}</span>
      {!!count && <span className="count">{count}</span>}
    </Link>
  );
}
