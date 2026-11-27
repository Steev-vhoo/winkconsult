import Link from "next/link";
import { AutoSubmitSelect } from "@/components/admin/ConfirmButton";
import { Flash, fmtDateTime, StatusTabs, Topbar, WaClient } from "@/components/admin/ui";
import { listEnquiries } from "@/lib/admin-data";
import { requireUser } from "@/lib/auth";
import { setEnquiryStatus } from "../../actions";

export const metadata = { title: "Enquiries" };

const STATUSES = ["new", "in_progress", "done", "archived"] as const;
const OPTS: [string, string][] = [["new", "New"], ["in_progress", "In progress"], ["done", "Done"], ["archived", "Archived"]];
type Row = { id: string; name: string; phone: string; email: string; location: string; service: string; message: string; status: string; created_at: Date };

export default async function Enquiries({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser();
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as never) ? sp.status! : sp.status === "all" ? "all" : "open";
  const q = (sp.q ?? "").trim().slice(0, 100);
  const { rows, counts } = await listEnquiries(status, q);
  const c = Object.fromEntries(counts.map((r) => [r.status, r.n])) as Record<string, number>;
  const extra = q ? `&q=${encodeURIComponent(q)}` : "";

  return (
    <>
      <Topbar title="Enquiries" sub="Messages sent from the website's contact form.">
        <a className="btn btn-ghost" href={`/admin/export/enquiries?status=${status}${extra}`}>Export CSV</a>
      </Topbar>
      <Flash sp={sp} />
      <div className="filters">
        <StatusTabs base="/admin/enquiries" current={status} extra={extra} items={[
          ["open", "Open", (c.new ?? 0) + (c.in_progress ?? 0)], ["new", "New", c.new ?? 0], ["in_progress", "In progress", c.in_progress ?? 0],
          ["done", "Done", c.done ?? 0], ["archived", "Archived", c.archived ?? 0], ["all", "All"],
        ]} />
        <form className="search" role="search">
          <input type="hidden" name="status" value={status} />
          <input name="q" defaultValue={q} placeholder="Search name, phone, message…" aria-label="Search enquiries" />
          <button className="btn btn-ghost">Search</button>
        </form>
      </div>
      <div className="table-wrap">
        {rows.length ? (
          <table className="t">
            <thead><tr><th>Received</th><th>Name</th><th>Service</th><th>Message</th><th>Contact</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="nowrap sub">{fmtDateTime(r.created_at)}</td>
                  <td><Link className="row-link" href={`/admin/enquiries/${r.id}`}>{r.name}</Link>{r.location && <div className="sub">{r.location}</div>}</td>
                  <td>{r.service || <span className="sub">–</span>}</td>
                  <td className="sub" style={{ maxWidth: 320 }}>{r.message.length > 120 ? `${r.message.slice(0, 120)}…` : r.message || "–"}</td>
                  <td className="nowrap"><div>{r.phone}</div>{r.email && <div className="sub">{r.email}</div>}
                    <div style={{ marginTop: 6 }}><WaClient phone={r.phone} text={`Hello ${r.name.split(" ")[0]}, this is WiNK CONSULT following up on your enquiry.`} /></div></td>
                  <td>
                    <form action={setEnquiryStatus}>
                      <input type="hidden" name="id" value={r.id} />
                      <AutoSubmitSelect name="status" defaultValue={r.status} options={OPTS} label={`Status for ${r.name}`} />
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="empty">No enquiries {q ? "match your search" : "here yet"}.</p>}
      </div>
    </>
  );
}
