import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

/* Called daily by Vercel Cron (vercel.json) so the free Supabase database never sits idle long enough to pause. */
export async function GET() {
  try {
    await sql`select 1`;
    return Response.json({ ok: true, at: new Date().toISOString() });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
