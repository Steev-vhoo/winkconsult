import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Flash, Pill, Topbar } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { listServices } from "@/lib/content";

export const metadata = { title: "Services" };

export default async function Services({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser("admin");
  const [sp, rows] = await Promise.all([searchParams, listServices(true)]);
  return (
    <>
      <Topbar title="Services" sub="Shown on the Home and Services pages, in the order below.">
        <Link className="btn btn-green" href="/admin/services/new">+ New service</Link>
      </Topbar>
      <Flash sp={sp} />
      <div className="table-wrap">
        <table className="t">
          <thead><tr><th style={{ width: 40 }}></th><th>Service</th><th>Group</th><th>Order</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td style={{ color: "var(--green-d)", width: 40 }}><span style={{ display: "inline-block", width: 22 }}><Icon name={s.icon} /></span></td>
                <td><Link className="row-link" href={`/admin/services/${s.id}`}>{s.title}</Link><div className="sub">{s.summary}</div></td>
                <td>{s.category === "core" ? "Core" : "Partner"}</td>
                <td>{s.sort_order}</td>
                <td><Pill status={s.published ? "published" : "hidden"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
