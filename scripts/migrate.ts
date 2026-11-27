/* Applies every db/migrations/*.sql file once, in name order. */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type postgres from "postgres";
import { run } from "./env";

export async function migrate(sql: postgres.Sql) {
  await sql`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`;
  const dir = join(process.cwd(), "db", "migrations");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  const done = new Set((await sql<{ name: string }[]>`select name from schema_migrations`).map((r) => r.name));
  for (const f of files) {
    if (done.has(f)) continue;
    await sql.begin(async (tx) => {
      await tx.unsafe(readFileSync(join(dir, f), "utf8"));
      await tx`insert into schema_migrations (name) values (${f})`;
    });
    console.log("applied", f);
  }
  console.log("migrations up to date");
}

if (process.argv[1]?.endsWith("migrate.ts")) run(migrate);
