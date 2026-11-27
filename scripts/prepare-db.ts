/* Runs before every build: brings the database schema up to date, loads the starting
   content the first time, and creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD
   if there are no accounts yet. Every step is safe to repeat. */
import { createAdmin } from "./create-admin";
import { run } from "./env";
import { migrate } from "./migrate";
import { seed } from "./seed";

run(async (sql) => {
  await migrate(sql);
  await seed(sql);
  await createAdmin(sql, { ifNone: true });
});
