import { existsSync, readFileSync } from "node:fs";
import postgres from "postgres";

/** Minimal .env loader for scripts (Next.js loads these files itself). */
export function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m || process.env[m[1]] !== undefined) continue;
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  if (!process.env.DATABASE_URL) {
    console.error(
      process.env.VERCEL
        ? "DATABASE_URL is not set. In Vercel open Project → Storage, connect a Neon database to this project " +
          "(it adds DATABASE_URL for you), then redeploy."
        : "DATABASE_URL is not set (see .env.example).",
    );
    process.exit(1);
  }
}

/** A single connection for scripts. Prefers Neon's direct (unpooled) URL, which suits schema changes. */
export function connect() {
  loadEnv();
  return postgres(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL!, { prepare: false, max: 1, onnotice: () => {} });
}

/** Runs `fn` with a connection, closes it, and exits non-zero on failure. */
export async function run(fn: (sql: postgres.Sql) => Promise<void>) {
  const sql = connect();
  try {
    await fn(sql);
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}
