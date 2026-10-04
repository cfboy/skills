import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

/**
 * The direct Postgres connection. Import it from db/client.ts in app code, which
 * adds the server-only guard; scripts import this module directly.
 *
 * Used by BetterAuth (which owns its own tables), by identity lookups that RLS
 * itself depends on (which organizations a person belongs to), and by scripts —
 * NOT by application reads and writes. Those go through supabase-js so every
 * one carries the signed-in user's JWT and is decided by RLS. A pool connects
 * as the database owner, which policies do not apply to.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Vercel functions are short-lived and reused; a small pool per instance.
  max: 4,
});

export const db = drizzle(pool, { schema, casing: "snake_case" });
