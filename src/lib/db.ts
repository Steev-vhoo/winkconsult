import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __winkSql: postgres.Sql | undefined;
}

function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      process.env.VERCEL
        ? "DATABASE_URL is not set. In Vercel open Project → Settings → Environment Variables, add DATABASE_URL " +
          "(the Supabase 'Transaction pooler' connection string) for Production and Preview, then redeploy. " +
          "The build reads the database to pre-render pages, so run `npm run db:migrate` against it first."
        : "DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.",
    );
  }
  return postgres(url, {
    // Supabase's transaction pooler does not support prepared statements.
    prepare: false,
    max: process.env.NODE_ENV === "production" ? 5 : 3,
    idle_timeout: 20,
    transform: { undefined: null },
  });
}

/** One shared connection pool (reused across hot reloads in development). */
export const sql: postgres.Sql = globalThis.__winkSql ?? (globalThis.__winkSql = connect());
