import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { Flash, Pill, Topbar } from "@/components/admin/ui";
import { getPost } from "@/lib/admin-data";
import { requireUser } from "@/lib/auth";
import { type Post } from "@/lib/content";
import { deletePost, savePost } from "../../../actions";

export const metadata = { title: "Edit update" };

export default async function EditPost({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const isNew = id === "new";
  if (!isNew && !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const p: Partial<Post> | undefined = isNew ? { status: "draft", body_md: "" } : await getPost(id);
  if (!p) notFound();
  const pubDate = p.published_at ? new Date(p.published_at).toISOString().slice(0, 10) : "";

  return (
    <>
      <Link className="back" href="/admin/posts">← All updates</Link>
      <Topbar title={isNew ? "New update" : p.title!} sub={!isNew ? <Pill status={p.status!} /> : undefined}>
        {!isNew && p.status === "published" && <a className="btn btn-ghost btn-sm" href={`/blog/${p.slug}`} target="_blank" rel="noopener">View on website ↗</a>}
      </Topbar>
      <Flash sp={sp} messages={{ slug: "Another update already uses that web address. Change the title or web address." }} />
      <form className="card f" action={savePost}>
        <input type="hidden" name="id" value={isNew ? "" : p.id} />
        <div><label htmlFor="title">Title</label><input id="title" name="title" type="text" required defaultValue={p.title} /></div>
        <div><label htmlFor="excerpt">Summary</label><textarea id="excerpt" name="excerpt" defaultValue={p.excerpt} style={{ minHeight: 70 }} /><p className="hint">One or two sentences shown on the cards.</p></div>
        <MarkdownEditor name="body_md" label="Article" defaultValue={p.body_md ?? ""} />
        <div className="row2">
          <div><label htmlFor="cover_url">Cover image link (optional)</label><input id="cover_url" name="cover_url" type="url" defaultValue={p.cover_url ?? ""} placeholder="https://…" /></div>
          <div><label htmlFor="slug">Web address</label><input id="slug" name="slug" type="text" defaultValue={p.slug} placeholder="filled in from the title" /></div>
        </div>
        <div className="row2">
          <div><label htmlFor="status">Status</label><select id="status" name="status" defaultValue={p.status}><option value="draft">Draft (hidden)</option><option value="published">Published</option></select></div>
          <div><label htmlFor="published_at">Publish date</label><input id="published_at" name="published_at" type="date" defaultValue={pubDate} /><p className="hint">Leave empty to use today. A future date schedules the post.</p></div>
        </div>
        <div className="actions"><button className="btn btn-primary">{isNew ? "Create update" : "Save changes"}</button></div>
      </form>
      {!isNew && (
        <form action={deletePost} style={{ marginTop: 16 }}>
          <input type="hidden" name="id" value={p.id} />
          <ConfirmButton message="Delete this update permanently?">Delete update</ConfirmButton>
        </form>
      )}
    </>
  );
}
