import { enquiriesForExport } from "@/lib/admin-data";
import { getUser } from "@/lib/auth";
import { csvResponse, toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await getUser())) return new Response("Unauthorized", { status: 401 });
  const status = new URL(req.url).searchParams.get("status") ?? "all";
  const rows = await enquiriesForExport(status);
  const cols = ["created_at", "name", "phone", "email", "location", "service", "message", "status", "notes"] as const;
  return csvResponse("wink-enquiries", toCsv([...cols], rows.map((r) => cols.map((c) => r[c]))));
}
