import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

/* Health check for uptime monitors: returns ok when the database answers. */
export async function GET() {
  try {
    await sql`select 1`;
    return Response.json({ ok: true, at: new Date().toISOString() });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
