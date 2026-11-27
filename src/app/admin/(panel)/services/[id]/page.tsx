import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { Flash, Topbar } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { storageConfigured } from "@/lib/storage";
import { getService, type Service } from "@/lib/content";
import { ICON_NAMES } from "@/lib/icons";
import { deleteService, saveService } from "../../../actions";

export const metadata = { title: "Edit service" };

export default async function EditService({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser("admin");
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const isNew = id === "new";
  if (!isNew && !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const s: Partial<Service> | undefined = isNew ? { icon: "shield", category: "core", sort_order: 100, published: true, body_md: "" } : await getService(id);
  if (!s) notFound();

  return (
    <>
      <Link className="back" href="/admin/services">← All services</Link>
      <Topbar title={isNew ? "New service" : s.title!} />
      <Flash sp={sp} messages={{ slug: "Another service already uses that web address. Choose a different one." }} />
      <form className="card f" action={saveService}>
        <input type="hidden" name="id" value={isNew ? "" : s.id} />
        <div className="row2">
          <div><label htmlFor="title">Name</label><input id="title" name="title" type="text" required defaultValue={s.title} /></div>
          <div><label htmlFor="slug">Web address</label><input id="slug" name="slug" type="text" defaultValue={s.slug} placeholder="filled in from the name" /><p className="hint">Used for links like /services#moh-clearance.</p></div>
        </div>
        <div><label htmlFor="summary">Short summary</label><textarea id="summary" name="summary" defaultValue={s.summary} style={{ minHeight: 70 }} /></div>
        <MarkdownEditor name="body_md" label="Full description" defaultValue={s.body_md ?? ""} rows={12} uploads={storageConfigured()} />
        <div><label htmlFor="whatsapp_message">WhatsApp message</label><input id="whatsapp_message" name="whatsapp_message" type="text" defaultValue={s.whatsapp_message} placeholder="Hello WiNK CONSULT, I'd like help with…" /><p className="hint">Pre-filled when someone taps “Enquire on WhatsApp”.</p></div>
        <div className="row3">
          <div><label htmlFor="icon">Icon</label><select id="icon" name="icon" defaultValue={s.icon}>{ICON_NAMES.map((n) => <option key={n}>{n}</option>)}</select></div>
          <div><label htmlFor="tile_label">Small label on Home tile</label><input id="tile_label" name="tile_label" type="text" defaultValue={s.tile_label} placeholder="e.g. Exams" /></div>
          <div><label htmlFor="category">Group</label><select id="category" name="category" defaultValue={s.category}><option value="core">Core service</option><option value="partner">Partner service</option></select></div>
        </div>
        <div className="row2">
          <div><label htmlFor="sort_order">Order</label><input id="sort_order" name="sort_order" type="number" defaultValue={s.sort_order} /><p className="hint">Lower numbers appear first.</p></div>
          <div style={{ alignSelf: "center" }}><label className="check"><input type="checkbox" name="published" defaultChecked={s.published} /> Show on website</label></div>
        </div>
        <div className="actions"><button className="btn btn-primary">{isNew ? "Create service" : "Save changes"}</button></div>
      </form>
      {!isNew && (
        <form action={deleteService} style={{ marginTop: 16 }}>
          <input type="hidden" name="id" value={s.id} />
          <ConfirmButton message="Delete this service from the website?">Delete service</ConfirmButton>
        </form>
      )}
    </>
  );
}
