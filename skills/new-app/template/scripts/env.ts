/**
 * Which environment a script is about to talk to.
 *
 * dotenv fills in any variable the caller did not already export, so sourcing
 * a production env file and then loading .env.local silently mixes them: a
 * script can end up holding a production key pointed at the local database, or
 * the reverse — which reads as a permissions bug and is not one.
 *
 * So every script resolves its target through here, and a target that
 * contradicts itself refuses to run rather than doing something surprising.
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

export type Target = {
  apiUrl: string;
  secretKey: string;
  publishableKey: string;
  dbUrl: string | null;
  isLocal: boolean;
  label: string;
};

const isLocalHost = (value: string) =>
  /(^|\/\/|@)(127\.0\.0\.1|localhost|host\.docker\.internal)([:/]|$)/.test(value);

export function resolveTarget(options: { requireDbUrl?: boolean } = {}): Target {
  const apiUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? "";
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  const dbUrl = process.env.DATABASE_URL ?? null;

  const missing = [
    !apiUrl && "SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)",
    !secretKey && "SUPABASE_SECRET_KEY",
    options.requireDbUrl && !dbUrl && "DATABASE_URL",
  ].filter(Boolean);

  if (missing.length > 0) {
    console.error(`Missing variables: ${missing.join(", ")}. Run \`pnpm env:local\`.`);
    process.exit(1);
  }

  // If the API url says one environment and the database url says another,
  // somebody's shell is mixing two files. Stop.
  if (dbUrl && isLocalHost(apiUrl) !== isLocalHost(dbUrl)) {
    console.error(
      "\nThe target contradicts itself:\n" +
        `  API:      ${isLocalHost(apiUrl) ? "local " : "remote"}  ${apiUrl}\n` +
        `  Database: ${isLocalHost(dbUrl) ? "local " : "remote"}  (DATABASE_URL)\n\n` +
        "Two env files are probably being mixed. Export both from the same file.\n",
    );
    process.exit(1);
  }

  const isLocal = isLocalHost(apiUrl);
  return {
    apiUrl,
    secretKey,
    publishableKey,
    dbUrl,
    isLocal,
    label: isLocal ? "local" : `PRODUCTION (${new URL(apiUrl).hostname})`,
  };
}

/** Announces the target, so nobody has to infer it from the output. */
export function announce(target: Target): void {
  console.log(`\nTarget: ${target.label}\n`);
}
