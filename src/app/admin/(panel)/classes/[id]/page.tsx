import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { Topbar } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { type ClassRow, getClass } from "@/lib/content";
import { deleteClass, saveClass } from "../../../actions";

export const metadata = { title: "Edit class" };

const BLANK: Partial<ClassRow> = { kind: "IELTS", mode: "Online", capacity: 20, status: "open", published: true };

export default async function EditClass({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const isNew = id === "new";
  if (!isNew && !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const c = isNew ? BLANK : await getClass(id);
  if (!c) notFound();

  return (
    <>
      <Link className="back" href="/admin/classes">← All classes</Link>
      <Topbar title={isNew ? "New class" : c.title!} sub={!isNew ? `${c.taken} of ${c.capacity} seats taken` : undefined} />
      <form className="card f" action={saveClass}>
        <input type="hidden" name="id" value={isNew ? "" : c.id} />
        <div className="row2">
          <div><label htmlFor="title">Class name</label><input id="title" name="title" type="text" required defaultValue={c.title} placeholder="e.g. IELTS Academic, January intake" /></div>
          <div>
            <label htmlFor="kind">Type</label>
            <input id="kind" name="kind" type="text" list="kinds" required defaultValue={c.kind} />
            <datalist id="kinds"><option value="IELTS" /><option value="CBT" /><option value="OSCE" /><option value="NCLEX" /></datalist>
          </div>
        </div>
        <div><label htmlFor="description">Short description</label><textarea id="description" name="description" defaultValue={c.description} style={{ minHeight: 80 }} /></div>
        <div className="row3">
          <div><label htmlFor="start_date">Start date</label><input id="start_date" name="start_date" type="date" defaultValue={c.start_date ?? ""} /></div>
          <div><label htmlFor="schedule">Schedule</label><input id="schedule" name="schedule" type="text" defaultValue={c.schedule} placeholder="e.g. Mon, Wed, Fri · 6–8pm" /></div>
          <div><label htmlFor="price">Fee</label><input id="price" name="price" type="text" defaultValue={c.price} placeholder="e.g. GH₵ 1,200" /></div>
        </div>
        <div className="row3">
          <div><label htmlFor="mode">Mode</label><select id="mode" name="mode" defaultValue={c.mode}><option>Online</option><option>In person</option><option>Hybrid</option></select></div>
          <div><label htmlFor="location">Location / link note</label><input id="location" name="location" type="text" defaultValue={c.location} placeholder="e.g. Zoom, or Kumasi office" /></div>
          <div><label htmlFor="capacity">Seats</label><input id="capacity" name="capacity" type="number" min={0} required defaultValue={c.capacity} /></div>
        </div>
        <div className="row2">
          <div><label htmlFor="status">Registration</label><select id="status" name="status" defaultValue={c.status}><option value="open">Open</option><option value="closed">Closed</option></select></div>
          <div style={{ alignSelf: "end" }}><label className="check"><input type="checkbox" name="published" defaultChecked={c.published} /> Show on website</label></div>
        </div>
        <div className="actions"><button className="btn btn-primary">{isNew ? "Create class" : "Save changes"}</button></div>
      </form>
      {!isNew && user.role === "admin" && (
        <form action={deleteClass} style={{ marginTop: 16 }}>
          <input type="hidden" name="id" value={c.id} />
          <ConfirmButton message="Delete this class? Its bookings will be kept but no longer linked to a class.">Delete class</ConfirmButton>
        </form>
      )}
    </>
  );
}
