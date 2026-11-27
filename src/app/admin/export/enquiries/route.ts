import { getUser } from "@/lib/auth";
import { csvResponse, toCsv } from "@/lib/csv";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await getUser())) return new Response("Unauthorized", { status: 401 });
  const status = new URL(req.url).searchParams.get("status") ?? "all";
  const rows = await sql<Record<string, string | Date>[]>`
    select created_at, name, phone, email, location, service, message, status, notes from enquiries
    where (${status} = 'all' or (${status} = 'open' and status in ('new','in_progress')) or status = ${status})
    order by created_at desc`;
  const cols = ["created_at", "name", "phone", "email", "location", "service", "message", "status", "notes"];
  return csvResponse("wink-enquiries", toCsv(cols, rows.map((r) => cols.map((c) => r[c]))));
}
