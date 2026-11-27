import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

/* Called daily by Vercel Cron (vercel.json): a quick database ping that also keeps the free Atlas cluster active. */
export async function GET() {
  try {
    await (await getDb()).command({ ping: 1 });
    return Response.json({ ok: true, at: new Date().toISOString() });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
