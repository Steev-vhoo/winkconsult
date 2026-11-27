import Link from "next/link";
import { digits } from "@/lib/settings";

export const STATUS_LABEL: Record<string, string> = {
  new: "New", in_progress: "In progress", done: "Done", archived: "Archived",
  pending: "Pending", confirmed: "Confirmed", cancelled: "Cancelled", completed: "Completed",
  draft: "Draft", published: "Published", open: "Open", closed: "Closed", hidden: "Hidden",
  admin: "Admin", staff: "Staff",
};

export function Pill({ status }: { status: string }) {
  return <span className={`pill ${status}`}>{STATUS_LABEL[status] ?? status}</span>;
}

export function Flash({ sp, messages = {} }: { sp: Record<string, string | undefined>; messages?: Record<string, string> }) {
  if (sp.saved) return <div className="flash ok" role="status">Saved.</div>;
  if (sp.deleted) return <div className="flash ok" role="status">Deleted.</div>;
  if (sp.error) return <div className="flash err" role="alert">{messages[sp.error] ?? "Something went wrong. Please try again."}</div>;
  return null;
}

export function fmtDateTime(d: Date | string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Accra", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(d));
}

/** Link that opens a WhatsApp chat with the client (not WiNK's number). */
export function WaClient({ phone, text, children = "WhatsApp" }: { phone: string; text?: string; children?: React.ReactNode }) {
  let d = digits(phone);
  if (d.startsWith("0") && d.length === 10) d = `233${d.slice(1)}`; // Ghana local format
  if (d.length < 8) return null;
  return (
    <a className="btn btn-wa btn-sm" target="_blank" rel="noopener" href={`https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ""}`}>{children}</a>
  );
}

export function Topbar({ title, sub, children }: { title: string; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="topbar">
      <div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>
      {children && <div className="actions">{children}</div>}
    </div>
  );
}

export function StatusTabs({ base, current, items, extra = "" }: { base: string; current: string; items: [string, string, number?][]; extra?: string }) {
  return (
    <nav className="tabs" aria-label="Filter by status">
      {items.map(([key, label, n]) => (
        <Link key={key} href={`${base}?status=${key}${extra}`} aria-current={current === key ? "page" : undefined}>
          {label}{n !== undefined && <span className="c">{n}</span>}
        </Link>
      ))}
    </nav>
  );
}
