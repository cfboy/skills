import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local", quiet: true });

/**
 * The local Supabase Postgres, unless a database url is exported.
 *
 * Deliberately defaulted rather than required: the common case is working
 * against the local stack, and a config that silently picks up a production
 * url from a stray shell variable is how a script ends up writing to the wrong
 * database. Production only ever receives migrations through CI.
 */
const url = process.env.DRIZZLE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:__DB_PORT__/postgres";

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema",
  // Supabase's own folder and file naming, so `supabase db reset` and
  // `drizzle-kit generate` agree on one ordered set of migrations. Hand-written
  // SQL (policies, functions, triggers) goes in `pnpm db:custom --name=<what>`
  // files in the same journal, ordered with the tables they depend on.
  out: "./supabase/migrations",
  migrations: { prefix: "supabase" },
  dbCredentials: { url },
  // auth and storage belong to Supabase. People live in public."user" (BetterAuth).
  schemaFilter: ["public"],
  casing: "snake_case",
  verbose: true,
  strict: true,
});
