/* Creates the indexes the app needs and re-checks class seat counts. Safe to run any time. */
import { ensureIndexes } from "../src/lib/indexes";
import { withDb } from "./env";

withDb(async (db) => {
  await ensureIndexes(db);
  // Safety check: seat counts must equal each class's pending + confirmed bookings.
  const counts = await db.collection("bookings").aggregate<{ _id: string; n: number }>([
    { $match: { class_id: { $ne: null }, status: { $in: ["pending", "confirmed"] } } },
    { $group: { _id: "$class_id", n: { $sum: 1 } } },
  ]).toArray();
  const byClass = new Map(counts.map((c) => [c._id, c.n]));
  let fixed = 0;
  for (const c of await db.collection<{ _id: string; taken: number }>("classes").find({}, { projection: { taken: 1 } }).toArray()) {
    const n = byClass.get(c._id) ?? 0;
    if (n !== c.taken) { await db.collection<{ _id: string }>("classes").updateOne({ _id: c._id }, { $set: { taken: n } }); fixed++; }
  }
  console.log(`indexes ready${fixed ? `; corrected seat counts on ${fixed} class(es)` : ""}`);
});
