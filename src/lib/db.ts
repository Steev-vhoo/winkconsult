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
        ? "DATABASE_URL is not set. In Vercel open Project → Storage and connect a Neon database to this project " +
          "for Production and Preview (it adds DATABASE_URL automatically), then redeploy."
        : "DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.",
    );
  }
  return postgres(url, {
    // Neon's pooled connection (PgBouncer, transaction mode) does not support prepared statements.
    prepare: false,
    max: process.env.NODE_ENV === "production" ? 5 : 3,
    idle_timeout: 20,
    transform: { undefined: null },
  });
}

/** One shared connection pool (reused across hot reloads in development). */
export const sql: postgres.Sql = globalThis.__winkSql ?? (globalThis.__winkSql = connect());
