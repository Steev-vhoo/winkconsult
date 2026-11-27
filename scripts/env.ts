import { existsSync, readFileSync } from "node:fs";
import { MongoClient } from "mongodb";

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
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set (see .env.example).");
    process.exit(1);
  }
}

/** Connects, runs `fn` with the database, then closes the connection. */
export async function withDb(fn: (db: import("mongodb").Db) => Promise<void>) {
  loadEnv();
  const client = new MongoClient(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 15_000 });
  try {
    await client.connect();
    await fn(client.db(process.env.MONGODB_DB || "wink"));
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}
