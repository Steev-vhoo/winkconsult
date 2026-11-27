import { bookingsForExport } from "@/lib/admin-data";
import { getUser } from "@/lib/auth";
import { csvResponse, toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await getUser())) return new Response("Unauthorized", { status: 401 });
  const p = new URL(req.url).searchParams;
  const classId = /^[0-9a-f-]{36}$/i.test(p.get("class") ?? "") ? p.get("class")! : "";
  const rows = await bookingsForExport(p.get("status") ?? "all", classId);
  const header = ["created_at", "type", "class", "topic", "preferred_date", "preferred_time", "name", "phone", "email", "message", "status", "notes"];
  return csvResponse("wink-bookings", toCsv(header, rows.map((r) => [
    r.created_at, r.type, r.class_title, r.topic, r.preferred_date, r.preferred_time, r.name, r.phone, r.email, r.message, r.status, r.notes,
  ])));
}
