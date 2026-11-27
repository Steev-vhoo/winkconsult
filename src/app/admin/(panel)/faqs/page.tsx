import Link from "next/link";
import { Flash, Pill, Topbar } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { listFaqs } from "@/lib/content";

export const metadata = { title: "FAQs" };

export default async function Faqs({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser("admin");
  const [sp, rows] = await Promise.all([searchParams, listFaqs(true)]);
  return (
    <>
      <Topbar title="FAQs" sub="Questions on the FAQ page, grouped by topic.">
        <Link className="btn btn-green" href="/admin/faqs/new">+ New question</Link>
      </Topbar>
      <Flash sp={sp} />
      <div className="table-wrap">
        <table className="t">
          <thead><tr><th>Question</th><th>Topic</th><th>Order</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((f) => (
              <tr key={f.id}>
                <td><Link className="row-link" href={`/admin/faqs/${f.id}`}>{f.question}</Link></td>
                <td className="nowrap">{f.category}</td>
                <td>{f.sort_order}</td>
                <td><Pill status={f.published ? "published" : "hidden"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
