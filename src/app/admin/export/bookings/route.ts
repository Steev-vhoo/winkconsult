import { getUser } from "@/lib/auth";
import { csvResponse, toCsv } from "@/lib/csv";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await getUser())) return new Response("Unauthorized", { status: 401 });
  const p = new URL(req.url).searchParams;
  const status = p.get("status") ?? "all";
  const classId = p.get("class") ?? "";
  const rows = await sql<Record<string, string | Date>[]>`
    select b.created_at, b.type, coalesce(c.title, '') as class, b.topic, to_char(b.preferred_date,'YYYY-MM-DD') as preferred_date,
           b.preferred_time, b.name, b.phone, b.email, b.message, b.status, b.notes
    from bookings b left join classes c on c.id = b.class_id
    where (${status} = 'all' or (${status} = 'active' and b.status in ('pending','confirmed')) or b.status = ${status})
      and (${classId} = '' or b.class_id::text = ${classId})
    order by b.created_at desc`;
  const cols = ["created_at", "type", "class", "topic", "preferred_date", "preferred_time", "name", "phone", "email", "message", "status", "notes"];
  return csvResponse("wink-bookings", toCsv(cols, rows.map((r) => cols.map((c) => r[c]))));
}
