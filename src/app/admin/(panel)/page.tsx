import Link from "next/link";
import { fmtDateTime, Pill, Topbar } from "@/components/admin/ui";
import { dashboardData } from "@/lib/admin-data";
import { requireUser } from "@/lib/auth";
import { fmtDate } from "@/lib/content";

export const metadata = { title: "Dashboard" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const { stats, enquiries, bookings, classes } = await dashboardData();

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
