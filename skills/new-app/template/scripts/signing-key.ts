/**
 * Makes the local JWT signing key, if there is not one already.
 *
 * supabase/config.toml points at supabase/signing_keys.json and the file is
 * gitignored — it is a private key — so a fresh clone has nothing to start
 * with. Without it `supabase start` comes up and every minted token is
 * unverifiable, which reads as "RLS refuses everything" rather than as a
 * missing file.
 *
 * The pair is ES256 because that is what PostgREST verifies and what
 * lib/supabase/sign-token.ts signs with. The file is a LOCAL key: production's
 * is a different one, imported under Supabase → Project Settings → JWT Keys.
 *
 *   pnpm keys:ensure              # writes the local file if absent
 *   pnpm keys:ensure --print      # also prints it, one line, for SUPABASE_JWT_SIGNING_KEY
 *   pnpm keys:ensure --generate   # prints a NEW key and writes nothing: production's
 */
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { exportJWK, generateKeyPair } from "jose";

const PATH = "supabase/signing_keys.json";

async function newKey() {
  const { privateKey } = await generateKeyPair("ES256", { extractable: true });
  const jwk = await exportJWK(privateKey);
  return {
    ...jwk,
    alg: "ES256",
    use: "sig",
    kid: randomUUID(),
    ext: true,
    key_ops: ["sign", "verify"],
  };
}

async function main() {
  if (process.argv.includes("--generate")) {
    // One line, no spaces: it is pasted into Supabase and into Vercel's
    // SUPABASE_JWT_SIGNING_KEY, where a newline would cut the JSON in half.
    process.stdout.write(`${JSON.stringify(await newKey())}\n`);
    return;
  }

  if (!existsSync(PATH)) {
    writeFileSync(PATH, `${JSON.stringify([await newKey()], null, 2)}\n`);
    console.error(`Signing key written to ${PATH} (local only, never committed).`);
  }

  if (process.argv.includes("--print")) {
    const keys = JSON.parse(readFileSync(PATH, "utf8"));
    process.stdout.write(JSON.stringify(keys[0]));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
