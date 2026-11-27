import "server-only";
import { type BookingDoc, type BookingStatus, db } from "./db";

/* Each class keeps `taken` = number of its pending + confirmed bookings.
   Every change below adjusts it with a single atomic update, so two people
   can never take the last seat at the same moment (no transactions needed). */

const ACTIVE: BookingStatus[] = ["pending", "confirmed"];
export const isActive = (s: BookingStatus) => ACTIVE.includes(s);

export type ReserveResult = { ok: true } | { ok: false; reason: "closed" | "full" | "changed" };

/** Atomically takes one seat, then records the booking. */
export async function reserveSeat(
  classId: string,
  booking: Omit<BookingDoc, "type" | "class_id" | "class_title" | "status" | "notes" | "created_at" | "updated_at" | "preferred_date" | "preferred_time" | "topic">,
): Promise<ReserveResult & { title?: string }> {
  const { classes, bookings } = await db();
  const c = await classes.findOne({ _id: classId });
  if (!c || !c.published || c.status !== "open") return { ok: false, reason: "closed" };
  if (c.taken >= c.capacity) return { ok: false, reason: "full" };

  // Succeeds only if the seat count hasn't moved past capacity (and capacity wasn't edited) since we read it.
  const claimed = await classes.findOneAndUpdate(
    { _id: classId, status: "open", published: true, capacity: c.capacity, taken: { $lt: c.capacity } },
    { $inc: { taken: 1 }, $set: { updated_at: new Date() } },
  );
  if (!claimed) {
    const now = await classes.findOne({ _id: classId });
    return { ok: false, reason: !now || now.status !== "open" || !now.published ? "closed" : now.taken >= now.capacity ? "full" : "changed" };
  }
  try {
    const t = new Date();
    await bookings.insertOne({
      ...booking, type: "class", class_id: classId, class_title: c.title, status: "pending", notes: "",
      preferred_date: null, preferred_time: "", topic: "", created_at: t, updated_at: t,
    });
  } catch (e) {
    await classes.updateOne({ _id: classId, taken: { $gt: 0 } }, { $inc: { taken: -1 } }); // give the seat back
    throw e;
  }
  return { ok: true, title: c.title };
}

/** Changes a booking's status (and optionally notes), keeping the class seat count in step. */
export async function updateBookingStatus(id: string, status: BookingStatus, notes?: string) {
  const { bookings, classes } = await db();
  const before = await bookings.findOneAndUpdate(
    { _id: id },
    { $set: { status, updated_at: new Date(), ...(notes !== undefined ? { notes } : {}) } },
    { returnDocument: "before" },
  );
  if (!before?.class_id) return;
  const was = isActive(before.status), now = isActive(status);
  if (was && !now) await classes.updateOne({ _id: before.class_id, taken: { $gt: 0 } }, { $inc: { taken: -1 } });
  if (!was && now) await classes.updateOne({ _id: before.class_id }, { $inc: { taken: 1 } }); // staff may re-open a seat past capacity on purpose
}

export async function removeBooking(id: string) {
  const { bookings, classes } = await db();
  const gone = await bookings.findOneAndDelete({ _id: id });
  if (gone?.class_id && isActive(gone.status)) {
    await classes.updateOne({ _id: gone.class_id, taken: { $gt: 0 } }, { $inc: { taken: -1 } });
  }
}

/** Deletes a class; its bookings are kept (they still show the class title). */
export async function removeClass(id: string) {
  const { bookings, classes } = await db();
  await bookings.updateMany({ class_id: id }, { $set: { class_id: null } });
  await classes.deleteOne({ _id: id });
}
