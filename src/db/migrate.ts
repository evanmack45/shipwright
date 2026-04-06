import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:shipwright.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client);

async function run() {
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations applied successfully");
  client.close();
}

run();
