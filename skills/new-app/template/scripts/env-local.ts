/**
 * Writes .env.local from the running local Supabase stack.
 *
 * Every value a fresh clone needs is either printed by `supabase status` or
 * generated here, so nobody copies keys by hand. An existing .env.local is
 * never overwritten — it may hold values someone chose — unless --force.
 *
 *   pnpm env:local           # write .env.local if it does not exist
 *   pnpm env:local --force   # rewrite it from the stack
 */
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const PATH = ".env.local";

function main() {
  if (existsSync(PATH) && !process.argv.includes("--force")) {
    console.log(`${PATH} already exists; leaving it alone (--force to rewrite).`);
    return;
  }

  const status = execFileSync("./scripts/supabase.sh", ["status", "-o", "env"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  const stack = Object.fromEntries(
    status
      .split("\n")
      .map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/))
      .filter((match): match is RegExpMatchArray => match !== null)
      .map(([, key, value]) => [key, value]),
  );

  const required = ["API_URL", "DB_URL", "PUBLISHABLE_KEY", "SECRET_KEY"];
  const absent = required.filter((key) => !stack[key]);
  if (absent.length > 0) {
    console.error(`supabase status did not report ${absent.join(", ")}. Is the stack running?`);
    process.exit(1);
  }

  const keys = JSON.parse(readFileSync("supabase/signing_keys.json", "utf8"));
  const smtpPort = readFileSync("supabase/config.toml", "utf8").match(/smtp_port\s*=\s*(\d+)/)?.[1];

  const env = {
    NEXT_PUBLIC_SUPABASE_URL: stack.API_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: stack.PUBLISHABLE_KEY,
    SUPABASE_URL: stack.API_URL,
    SUPABASE_SECRET_KEY: stack.SECRET_KEY,
    DATABASE_URL: stack.DB_URL,
    // One line, single-quoted: dotenv keeps the JSON's inner quotes intact.
    SUPABASE_JWT_SIGNING_KEY: `'${JSON.stringify(keys[0])}'`,
    BETTER_AUTH_URL: "http://localhost:3000",
    BETTER_AUTH_SECRET: randomBytes(32).toString("base64url"),
    SMTP_URL: `smtp://127.0.0.1:${smtpPort ?? "54325"}`,
    EMAIL_FROM: '"__APP_NAME__ <no-reply@example.com>"',
  };

  writeFileSync(
    PATH,
    `${Object.entries(env)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n")}\n`,
  );
  console.log(`Wrote ${PATH} from the local stack.`);
}

main();
