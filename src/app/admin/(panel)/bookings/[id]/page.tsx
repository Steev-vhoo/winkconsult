import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Flash, fmtDateTime, Pill, Topbar, WaClient } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { fmtDate } from "@/lib/content";
import { sql } from "@/lib/db";
import { fmtTime } from "@/lib/settings";
import { deleteBooking, updateBooking } from "../../../actions";

export const metadata = { title: "Booking" };

export default async function BookingDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [b] = await sql<{ id: string; type: string; class_id: string | null; title: string | null; schedule: string | null; class_start: string | null;
    name: string; phone: string; email: string; topic: string; preferred_date: string | null; preferred_time: string; message: string;
    status: string; notes: string; created_at: Date }[]>`
    select b.*, to_char(b.preferred_date,'YYYY-MM-DD') as preferred_date, c.title, c.schedule, to_char(c.start_date,'YYYY-MM-DD') as class_start
    from bookings b left join classes c on c.id = b.class_id where b.id = ${id}`;
  if (!b) notFound();

  const what = b.type === "class" ? b.title ?? "Class (deleted)" : `Consultation: ${b.topic}`;
  const when = b.type === "class"
    ? [b.class_start && `starts ${fmtDate(b.class_start)}`, b.schedule].filter(Boolean).join(" · ")
    : `${fmtDate(b.preferred_date, { weekday: "short", day: "numeric", month: "short", year: "numeric" })} at ${fmtTime(b.preferred_time)} (GMT)`;
  const confirmText = b.type === "class"
    ? `Hello ${b.name.split(" ")[0]}, this is WiNK CONSULT. Your seat in "${b.title}" is confirmed${b.class_start ? ` (starts ${fmtDate(b.class_start)})` : ""}.`
    : `Hello ${b.name.split(" ")[0]}, this is WiNK CONSULT. Your consultation is confirmed for ${when}.`;

  return (
    <>
      <Link className="back" href="/admin/bookings">← All bookings</Link>
      <Topbar title={b.name} sub={<>{what} · <Pill status={b.status} /></>}>
        <WaClient phone={b.phone} text={confirmText}>Send confirmation on WhatsApp</WaClient>
        {b.email && <a className="btn btn-ghost btn-sm" href={`mailto:${b.email}`}>Email</a>}
      </Topbar>
      <Flash sp={sp} />
      <div className="detail">
        <section className="card">
          <h2>Booking</h2>
          <dl className="kv">
            <dt>Type</dt><dd>{b.type === "class" ? "Class seat" : "Consultation"}</dd>
            <dt>{b.type === "class" ? "Class" : "Topic"}</dt><dd>{b.type === "class" ? (b.class_id ? <Link href={`/admin/classes/${b.class_id}`}>{b.title}</Link> : "Deleted class") : b.topic}</dd>
            <dt>When</dt><dd>{when || "–"}</dd>
            <dt>Phone</dt><dd><a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`}>{b.phone}</a></dd>
            <dt>Email</dt><dd>{b.email || "–"}</dd>
            <dt>Booked</dt><dd>{fmtDateTime(b.created_at)}</dd>
          </dl>
          <div className="msg">{b.message || "No message."}</div>
        </section>
        <section className="card" style={{ marginTop: 0 }}>
          <h2>Manage</h2>
          <form className="f" action={updateBooking}>
            <input type="hidden" name="id" value={b.id} />
            <div>
              <label htmlFor="status">Status</label>
              <select id="status" name="status" defaultValue={b.status}>
                <option value="pending">Pending</option><option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option><option value="cancelled">Cancelled</option>
              </select>
              <p className="hint">Cancelling a class booking frees the seat on the website.</p>
            </div>
            <div><label htmlFor="notes">Internal notes</label><textarea id="notes" name="notes" defaultValue={b.notes} placeholder="e.g. Paid deposit via MoMo on 3 Dec." /></div>
            <div className="actions"><button className="btn btn-primary">Save</button></div>
          </form>
          {user.role === "admin" && (
            <form action={deleteBooking} style={{ marginTop: 18, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
              <input type="hidden" name="id" value={b.id} />
              <ConfirmButton message="Delete this booking permanently?">Delete booking</ConfirmButton>
            </form>
          )}
        </section>
      </div>
    </>
  );
}
