/**
 * Loads .env.local for scripts. Import it FIRST.
 *
 * ES imports evaluate in order, and db/index.ts and lib/auth/auth.ts read
 * process.env as they load. A script that imported them before loading the
 * environment would build a database pool with no connection string. Loading
 * through dotenv (rather than `source .env.local` in a shell) also keeps values
 * like the JSON signing key intact — a shell strips their inner quotes.
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
