import Link from "next/link";
import { Flash, Pill, Topbar } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { fmtDate, listClasses } from "@/lib/content";

export const metadata = { title: "Classes" };

export default async function Classes({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser();
  const [sp, rows] = await Promise.all([searchParams, listClasses()]);
  return (
    <>
      <Topbar title="Classes" sub="IELTS, CBT and other classes people can book on the website.">
        <Link className="btn btn-green" href="/admin/classes/new">+ New class</Link>
      </Topbar>
      <Flash sp={sp} />
      <div className="table-wrap">
        {rows.length ? (
          <table className="t">
            <thead><tr><th>Class</th><th>Starts</th><th>Mode</th><th>Seats</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td><Link className="row-link" href={`/admin/classes/${c.id}`}>{c.title}</Link><div className="sub">{c.kind}{c.schedule && ` · ${c.schedule}`}</div></td>
                  <td className="nowrap">{c.start_date ? fmtDate(c.start_date) : "TBA"}</td>
                  <td>{c.mode}</td>
                  <td className="nowrap">{c.taken} / {c.capacity}</td>
                  <td><Pill status={c.published ? c.status : "hidden"} /></td>
                  <td className="nowrap"><Link className="btn btn-ghost btn-sm" href={`/admin/bookings?class=${c.id}&status=all`}>Bookings</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="empty">No classes yet. <Link href="/admin/classes/new">Create the first one</Link>.</p>}
      </div>
    </>
  );
}
