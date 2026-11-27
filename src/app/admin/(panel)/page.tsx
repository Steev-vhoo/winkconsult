import Link from "next/link";
import { fmtDateTime, Pill, Topbar } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { fmtDate } from "@/lib/content";
import { sql } from "@/lib/db";

export const metadata = { title: "Dashboard" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const [[stats], enquiries, bookings, classes] = await Promise.all([
    sql<{ new_enq: number; week_enq: number; pending: number; upcoming: number; posts: number }[]>`
      select (select count(*)::int from enquiries where status = 'new') as new_enq,
             (select count(*)::int from enquiries where created_at > now() - interval '7 days') as week_enq,
             (select count(*)::int from bookings where status = 'pending') as pending,
             (select count(*)::int from bookings where type = 'consultation' and status = 'confirmed' and preferred_date >= current_date) as upcoming,
             (select count(*)::int from posts where status = 'published') as posts`,
    sql<{ id: string; name: string; service: string; status: string; created_at: Date }[]>`
      select id, name, service, status, created_at from enquiries where status in ('new','in_progress') order by created_at desc limit 6`,
    sql<{ id: string; name: string; type: string; status: string; title: string | null; preferred_date: string | null; preferred_time: string; created_at: Date }[]>`
      select b.id, b.name, b.type, b.status, c.title, to_char(b.preferred_date,'YYYY-MM-DD') as preferred_date, b.preferred_time, b.created_at
      from bookings b left join classes c on c.id = b.class_id
      where b.status in ('pending','confirmed') order by b.created_at desc limit 6`,
    sql<{ id: string; title: string; start_date: string | null; capacity: number; taken: number; status: string }[]>`
      select c.id, c.title, to_char(c.start_date,'YYYY-MM-DD') as start_date, c.capacity, c.status,
        (select count(*)::int from bookings b where b.class_id = c.id and b.status in ('pending','confirmed')) as taken
      from classes c where c.status = 'open' order by c.start_date nulls last limit 5`,
  ]);

  return (
    <>
      {sp.denied && <div className="flash err">That page is for administrators only.</div>}
      <Topbar title={`Hello, ${user.name.split(" ")[0]}`} sub="Here's what needs attention today." />
      <div className="stats">
        <Link className="stat hot" href="/admin/enquiries?status=new"><div className="n">{stats.new_enq}</div><div className="l">New enquiries</div></Link>
        <Link className="stat hot" href="/admin/bookings?status=pending"><div className="n">{stats.pending}</div><div className="l">Bookings to confirm</div></Link>
        <Link className="stat" href="/admin/bookings?status=confirmed"><div className="n">{stats.upcoming}</div><div className="l">Upcoming consultations</div></Link>
        <Link className="stat" href="/admin/enquiries?status=all"><div className="n">{stats.week_enq}</div><div className="l">Enquiries in last 7 days</div></Link>
      </div>
      <div className="cols2">
        <section className="card">
          <div className="topbar" style={{ marginBottom: 10 }}><h2>Open enquiries</h2><Link href="/admin/enquiries">View all →</Link></div>
          {enquiries.length ? (
            <table className="t"><tbody>
              {enquiries.map((e) => (
                <tr key={e.id}>
                  <td><Link className="row-link" href={`/admin/enquiries/${e.id}`}>{e.name}</Link><div className="sub">{e.service || "General"}</div></td>
                  <td className="nowrap sub">{fmtDateTime(e.created_at)}</td>
                  <td><Pill status={e.status} /></td>
                </tr>
              ))}
            </tbody></table>
          ) : <p className="empty">No open enquiries.</p>}
        </section>
        <section className="card" style={{ marginTop: 0 }}>
          <div className="topbar" style={{ marginBottom: 10 }}><h2>Recent bookings</h2><Link href="/admin/bookings">View all →</Link></div>
          {bookings.length ? (
            <table className="t"><tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td><Link className="row-link" href={`/admin/bookings/${b.id}`}>{b.name}</Link>
                    <div className="sub">{b.type === "class" ? b.title ?? "Class" : `Consultation · ${fmtDate(b.preferred_date)} ${b.preferred_time}`}</div></td>
                  <td><Pill status={b.status} /></td>
                </tr>
              ))}
            </tbody></table>
          ) : <p className="empty">No active bookings.</p>}
        </section>
      </div>
      <section className="card" style={{ marginTop: 18 }}>
        <div className="topbar" style={{ marginBottom: 10 }}><h2>Open classes</h2><Link href="/admin/classes">Manage classes →</Link></div>
        {classes.length ? (
          <table className="t">
            <thead><tr><th>Class</th><th>Starts</th><th>Seats taken</th></tr></thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.id}>
                  <td><Link className="row-link" href={`/admin/bookings?class=${c.id}&status=all`}>{c.title}</Link></td>
                  <td className="nowrap">{c.start_date ? fmtDate(c.start_date) : "TBA"}</td>
                  <td>{c.taken} / {c.capacity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="empty">No open classes. <Link href="/admin/classes/new">Create one</Link>.</p>}
      </section>
    </>
  );
}
