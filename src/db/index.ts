import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

const INIT_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY NOT NULL,
  email text NOT NULL UNIQUE,
  name text,
  linear_api_key text,
  stripe_customer_id text,
  subscription_status text DEFAULT 'free',
  updates_generated integer DEFAULT 0,
  created_at integer NOT NULL
);
CREATE TABLE IF NOT EXISTS projects (
  id text PRIMARY KEY NOT NULL,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  linear_team_id text NOT NULL,
  linear_team_name text NOT NULL,
  name text NOT NULL,
  status text DEFAULT 'active',
  created_at integer NOT NULL
);
CREATE TABLE IF NOT EXISTS updates (
  id text PRIMARY KEY NOT NULL,
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  week_start text NOT NULL,
  week_end text NOT NULL,
  draft_markdown text NOT NULL,
  edited_markdown text,
  status text DEFAULT 'draft',
  generated_at integer NOT NULL,
  sent_at integer
);
`;

let _client: Client | null = null;
let _db: LibSQLDatabase<typeof schema> | null = null;
let _initialized = false;

function getClient(): Client {
  if (!_client) {
    _client = createClient({
      url: process.env.TURSO_DATABASE_URL ?? "file:shipwright.db",
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return _client;
}

async function ensureSchema(): Promise<void> {
  if (_initialized) return;
  const client = getClient();
  const statements = INIT_SQL.split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const sql of statements) {
    await client.execute(sql);
  }
  _initialized = true;
}

function getDb(): LibSQLDatabase<typeof schema> {
  if (!_db) {
    _db = drizzle(getClient(), { schema });
  }
  return _db;
}

export { getDb, ensureSchema };

export const db = new Proxy({} as LibSQLDatabase<typeof schema>, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
