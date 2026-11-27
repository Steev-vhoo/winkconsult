import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { Topbar } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { type Faq } from "@/lib/content";
import { sql } from "@/lib/db";
import { deleteFaq, saveFaq } from "../../../actions";

export const metadata = { title: "Edit FAQ" };

export default async function EditFaq({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("admin");
  const { id } = await params;
  const isNew = id === "new";
  if (!isNew && !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [f, cats] = await Promise.all([
    isNew ? Promise.resolve<Partial<Faq>>({ sort_order: 100, published: true, answer_md: "" }) : sql<Faq[]>`select * from faqs where id = ${id}`.then((r) => r[0]),
    sql<{ category: string }[]>`select distinct category from faqs order by category`,
  ]);
  if (!f) notFound();

  return (
    <>
      <Link className="back" href="/admin/faqs">← All FAQs</Link>
      <Topbar title={isNew ? "New question" : "Edit question"} />
      <form className="card f" action={saveFaq}>
        <input type="hidden" name="id" value={isNew ? "" : f.id} />
        <div><label htmlFor="question">Question</label><input id="question" name="question" type="text" required defaultValue={f.question} /></div>
        <MarkdownEditor name="answer_md" label="Answer" defaultValue={f.answer_md ?? ""} rows={6} />
        <div className="row3">
          <div>
            <label htmlFor="category">Topic</label>
            <input id="category" name="category" type="text" list="cats" required defaultValue={f.category} />
            <datalist id="cats">{cats.map((c) => <option key={c.category} value={c.category} />)}</datalist>
          </div>
          <div><label htmlFor="sort_order">Order</label><input id="sort_order" name="sort_order" type="number" defaultValue={f.sort_order} /></div>
          <div style={{ alignSelf: "end" }}><label className="check"><input type="checkbox" name="published" defaultChecked={f.published} /> Show on website</label></div>
        </div>
        <div className="actions"><button className="btn btn-primary">{isNew ? "Add question" : "Save changes"}</button></div>
      </form>
      {!isNew && (
        <form action={deleteFaq} style={{ marginTop: 16 }}>
          <input type="hidden" name="id" value={f.id} />
          <ConfirmButton message="Delete this question?">Delete question</ConfirmButton>
        </form>
      )}
    </>
  );
}
