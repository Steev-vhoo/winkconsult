import Link from "next/link";
import { AutoSubmitSelect } from "@/components/admin/ConfirmButton";
import { Flash, fmtDateTime, StatusTabs, Topbar, WaClient } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { fmtDate } from "@/lib/content";
import { sql } from "@/lib/db";
import { fmtTime } from "@/lib/settings";
import { setBookingStatus } from "../../actions";

export const metadata = { title: "Bookings" };

const STATUSES = ["pending", "confirmed", "cancelled", "completed"];
const OPTS: [string, string][] = [["pending", "Pending"], ["confirmed", "Confirmed"], ["completed", "Completed"], ["cancelled", "Cancelled"]];

type Row = { id: string; type: string; name: string; phone: string; email: string; status: string; topic: string; title: string | null;
  preferred_date: string | null; preferred_time: string; created_at: Date };

export default async function Bookings({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser();
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status ?? "") ? sp.status! : sp.status === "all" ? "all" : "active";
  const type = sp.type === "class" || sp.type === "consultation" ? sp.type : "";
  const classId = /^[0-9a-f-]{36}$/i.test(sp.class ?? "") ? sp.class! : "";

  const [rows, counts, classes] = await Promise.all([
    sql<Row[]>`
      select b.id, b.type, b.name, b.phone, b.email, b.status, b.topic, c.title,
             to_char(b.preferred_date,'YYYY-MM-DD') as preferred_date, b.preferred_time, b.created_at
      from bookings b left join classes c on c.id = b.class_id
      where (${status} = 'all' or (${status} = 'active' and b.status in ('pending','confirmed')) or b.status = ${status})
        and (${type} = '' or b.type = ${type})
        and (${classId} = '' or b.class_id::text = ${classId})
      order by case when b.type = 'consultation' and b.preferred_date >= current_date then 0 else 1 end,
               b.preferred_date nulls last, b.created_at desc
      limit 300`,
    sql<{ status: string; n: number }[]>`select status, count(*)::int as n from bookings group by status`,
    sql<{ id: string; title: string }[]>`select id, title from classes order by start_date desc nulls last, title`,
  ]);
  const c = Object.fromEntries(counts.map((r) => [r.status, r.n])) as Record<string, number>;
  const extra = `${type ? `&type=${type}` : ""}${classId ? `&class=${classId}` : ""}`;

  return (
    <>
      <Topbar title="Bookings" sub="Class seats and consultation requests from the website.">
        <a className="btn btn-ghost" href={`/admin/export/bookings?status=${status}${classId ? `&class=${classId}` : ""}`}>Export CSV</a>
      </Topbar>
      <Flash sp={sp} />
      <div className="filters">
        <StatusTabs base="/admin/bookings" current={status} extra={extra} items={[
          ["active", "Active", (c.pending ?? 0) + (c.confirmed ?? 0)], ["pending", "Pending", c.pending ?? 0], ["confirmed", "Confirmed", c.confirmed ?? 0],
          ["completed", "Completed", c.completed ?? 0], ["cancelled", "Cancelled", c.cancelled ?? 0], ["all", "All"],
        ]} />
        <form className="search">
          <input type="hidden" name="status" value={status} />
          <select className="inline-select" name="type" defaultValue={type} aria-label="Type" style={{ width: "auto" }}>
            <option value="">All types</option><option value="class">Classes</option><option value="consultation">Consultations</option>
          </select>
          <select className="inline-select" name="class" defaultValue={classId} aria-label="Class" style={{ width: "auto", maxWidth: 240 }}>
            <option value="">All classes</option>
            {classes.map((k) => <option key={k.id} value={k.id}>{k.title}</option>)}
          </select>
          <button className="btn btn-ghost">Filter</button>
        </form>
      </div>
      <div className="table-wrap">
        {rows.length ? (
          <table className="t">
            <thead><tr><th>What</th><th>When</th><th>Name</th><th>Contact</th><th>Booked</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link className="row-link" href={`/admin/bookings/${r.id}`}>{r.type === "class" ? r.title ?? "Class (deleted)" : "Consultation"}</Link>
                    {r.type === "consultation" && <div className="sub">{r.topic}</div>}
                  </td>
                  <td className="nowrap">{r.type === "consultation" ? `${fmtDate(r.preferred_date)} · ${r.preferred_time ? fmtTime(r.preferred_time) : ""}` : <span className="sub">–</span>}</td>
                  <td>{r.name}</td>
                  <td className="nowrap"><div>{r.phone}</div>{r.email && <div className="sub">{r.email}</div>}
                    <div style={{ marginTop: 6 }}><WaClient phone={r.phone} text={`Hello ${r.name.split(" ")[0]}, this is WiNK CONSULT about your booking.`} /></div></td>
                  <td className="nowrap sub">{fmtDateTime(r.created_at)}</td>
                  <td>
                    <form action={setBookingStatus}>
                      <input type="hidden" name="id" value={r.id} />
                      <AutoSubmitSelect name="status" defaultValue={r.status} options={OPTS} label={`Status for ${r.name}`} />
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="empty">No bookings here yet.</p>}
      </div>
    </>
  );
}
