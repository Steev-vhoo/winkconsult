import Link from "next/link";
import { sidebarCounts } from "@/lib/admin-data";
import { requireUser } from "@/lib/auth";
import { logoutAction } from "../actions";
import { SideLink } from "./SideLink";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const c = await sidebarCounts();
  const admin = user.role === "admin";
  return (
    <div className="shell">
      <aside className="side">
        <Link href="/admin" className="brand" aria-label="Dashboard"><img src="/brand/logo-reverse.svg" alt="WiNK CONSULT" /></Link>
        <nav aria-label="Admin">
          <SideLink href="/admin" exact>Dashboard</SideLink>
          <div className="group">Leads</div>
          <SideLink href="/admin/enquiries" count={c.enq}>Enquiries</SideLink>
          <SideLink href="/admin/bookings" count={c.book}>Bookings</SideLink>
          <SideLink href="/admin/classes">Classes</SideLink>
          <div className="group">Website</div>
          <SideLink href="/admin/posts">Updates (blog)</SideLink>
          {admin && <SideLink href="/admin/services">Services</SideLink>}
          {admin && <SideLink href="/admin/faqs">FAQs</SideLink>}
          {admin && <SideLink href="/admin/settings">Site settings</SideLink>}
          <div className="group">Account</div>
          {admin && <SideLink href="/admin/users">Staff accounts</SideLink>}
          <SideLink href="/admin/account">My password</SideLink>
          <a className="nav" href="/" target="_blank" rel="noopener">View website ↗</a>
        </nav>
        <div className="foot">
          <div><b>{user.name}</b>{user.role === "admin" ? "Administrator" : "Staff"}</div>
          <form action={logoutAction}><button type="submit">Sign out</button></form>
        </div>
      </aside>
      <div className="main">{children}</div>
    </div>
  );
}
