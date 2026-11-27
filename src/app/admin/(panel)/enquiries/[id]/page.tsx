import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Flash, fmtDateTime, Pill, Topbar, WaClient } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { deleteEnquiry, resendEnquiryAlert, updateEnquiry } from "../../../actions";

export const metadata = { title: "Enquiry" };

export default async function EnquiryDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [e] = await sql<{ id: string; name: string; phone: string; email: string; location: string; service: string; message: string; status: string; notes: string; created_at: Date; updated_at: Date; notified_at: Date | null; notify_error: string }[]>`
    select * from enquiries where id = ${id}`;
  if (!e) notFound();

  return (
    <>
      <Link className="back" href="/admin/enquiries">← All enquiries</Link>
      <Topbar title={e.name} sub={<>Received {fmtDateTime(e.created_at)} · <Pill status={e.status} /></>}>
        <WaClient phone={e.phone} text={`Hello ${e.name.split(" ")[0]}, this is WiNK CONSULT following up on your enquiry.`}>Reply on WhatsApp</WaClient>
        {e.email && <a className="btn btn-ghost btn-sm" href={`mailto:${e.email}`}>Email</a>}
      </Topbar>
      <Flash sp={sp} />
      {sp.alert === "sent" && <div className="flash ok">Email alert sent.</div>}
      {sp.alert === "failed" && <div className="flash err">Email alert failed: {e.notify_error}</div>}
      <div className="detail">
        <section className="card">
          <h2>Details</h2>
          <dl className="kv">
            <dt>Phone</dt><dd><a href={`tel:${e.phone.replace(/[^\d+]/g, "")}`}>{e.phone}</a></dd>
            <dt>Email</dt><dd>{e.email || "–"}</dd>
            <dt>Location</dt><dd>{e.location || "–"}</dd>
            <dt>Service</dt><dd>{e.service || "–"}</dd>
          </dl>
          <div className="msg">{e.message || "No message."}</div>
          <form action={resendEnquiryAlert} className="actions" style={{ marginTop: 16, fontSize: ".86rem", color: "var(--muted)" }}>
            <input type="hidden" name="id" value={e.id} />
            <span>
              {e.notified_at ? `Email alert sent ${fmtDateTime(e.notified_at)}.` : e.notify_error ? `Email alert not sent: ${e.notify_error}` : "Email alert pending."}
            </span>
            <button className="btn btn-ghost btn-sm">{e.notified_at ? "Send again" : "Send alert"}</button>
          </form>
        </section>
        <section className="card" style={{ marginTop: 0 }}>
          <h2>Follow-up</h2>
          <form className="f" action={updateEnquiry}>
            <input type="hidden" name="id" value={e.id} />
            <div>
              <label htmlFor="status">Status</label>
              <select id="status" name="status" defaultValue={e.status}>
                <option value="new">New</option><option value="in_progress">In progress</option>
                <option value="done">Done</option><option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label htmlFor="notes">Internal notes</label>
              <textarea id="notes" name="notes" defaultValue={e.notes} placeholder="e.g. Called on Monday, sending MOH clearance steps." />
              <p className="hint">Only staff can see these notes.</p>
            </div>
            <div className="actions"><button className="btn btn-primary">Save</button></div>
          </form>
          {user.role === "admin" && (
            <form action={deleteEnquiry} style={{ marginTop: 18, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
              <input type="hidden" name="id" value={e.id} />
              <ConfirmButton message="Delete this enquiry permanently?">Delete enquiry</ConfirmButton>
            </form>
          )}
        </section>
      </div>
    </>
  );
}
