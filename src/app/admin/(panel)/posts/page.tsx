import Link from "next/link";
import { Flash, Pill, Topbar } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { fmtDate, type Post } from "@/lib/content";
import { sql } from "@/lib/db";

export const metadata = { title: "Updates" };

export default async function Posts({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser();
  const [sp, rows] = await Promise.all([
    searchParams,
    sql<(Post & { author: string | null })[]>`select p.*, u.name as author from posts p left join users u on u.id = p.author_id order by coalesce(p.published_at, p.updated_at) desc`,
  ]);
  return (
    <>
      <Topbar title="Updates" sub="News and tips shown on the Updates page and the Home page.">
        <Link className="btn btn-green" href="/admin/posts/new">+ New update</Link>
      </Topbar>
      <Flash sp={sp} />
      <div className="table-wrap">
        {rows.length ? (
          <table className="t">
            <thead><tr><th>Title</th><th>Status</th><th>Date</th><th>Author</th><th></th></tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td><Link className="row-link" href={`/admin/posts/${p.id}`}>{p.title}</Link><div className="sub">{p.excerpt}</div></td>
                  <td><Pill status={p.status} /></td>
                  <td className="nowrap">{fmtDate(p.published_at ?? p.updated_at)}</td>
                  <td className="nowrap sub">{p.author ?? "–"}</td>
                  <td className="nowrap">{p.status === "published" && <a className="btn btn-ghost btn-sm" href={`/blog/${p.slug}`} target="_blank" rel="noopener">View ↗</a>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="empty">No updates yet. <Link href="/admin/posts/new">Write the first one</Link>.</p>}
      </div>
    </>
  );
}
