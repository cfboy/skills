import { type JWK, SignJWT, importJWK } from "jose";

import type { OrgRole } from "@/lib/auth/permissions";

// App code imports this from lib/supabase/token.ts (server-only guarded).
// scripts/rls-check.ts imports it directly, so the RLS check exercises the very
// function the app signs with instead of a copy of it.

/** Short: it is re-minted per request on the server and cached briefly in the browser. */
export const TOKEN_TTL_SECONDS = 5 * 60;

let signingKey: Promise<{ key: CryptoKey; kid: string }> | null = null;

/**
 * The private half of one of the project's JWT Signing Keys (ES256).
 *
 * Supabase's asymmetric signing keys, the replacement for the legacy shared JWT
 * secret: PostgREST verifies against the public half, and only this server holds
 * the private half. Locally it is supabase/signing_keys.json (gitignored), wired
 * in by `signing_keys_path` in config.toml; in production the same kind of key
 * is imported under Project Settings → JWT Keys.
 *
 * Read from process.env directly, not lib/env.ts: scripts sign tokens too, and
 * they need only this one variable.
 */
function getSigningKey() {
  signingKey ??= (async () => {
    const raw = process.env.SUPABASE_JWT_SIGNING_KEY;
    if (!raw) throw new Error("SUPABASE_JWT_SIGNING_KEY is not set.");

    const jwk = JSON.parse(raw) as JWK;
    if (!jwk.kid) throw new Error("SUPABASE_JWT_SIGNING_KEY has no kid.");

    // The JWK describes the key pair, so it lists sign and verify. WebCrypto
    // only imports a private key for signing, so ask for exactly that.
    const key = await importJWK({ ...jwk, key_ops: ["sign"] }, "ES256");
    return { key: key as CryptoKey, kid: jwk.kid };
  })();
  return signingKey;
}

/**
 * Carries a BetterAuth session into Supabase as a JWT PostgREST will accept.
 *
 * The claims are exactly what RLS reads, and two of them fail silently if wrong:
 *
 *  - `sub` must be the uuid of public."user": auth.uid() casts it to uuid.
 *  - `role` must be "authenticated". Without it PostgREST runs the request as
 *    anon and every policy written `to authenticated` stops matching — reads
 *    come back empty instead of erroring.
 *
 * `org_id` is read by current_org_id(), so a person in several organizations is
 * never ambiguous about which one a request is for. It is the organization the
 * request names, never one the session remembers, and null for a request about
 * no organization. The database checks it against the caller's memberships
 * instead of believing it.
 *
 * What is deliberately NOT a claim: the set of organizations this person may
 * reach. It is read from member on every statement, so removing someone takes
 * effect at once rather than whenever a five-minute token happens to expire.
 */
export async function mintSupabaseToken(input: {
  userId: string;
  email: string;
  /** The organization this token acts in; null for what belongs to none. */
  orgId: string | null;
  /** The role the person holds there, for legibility. No policy reads it. */
  role: OrgRole | null;
}): Promise<string> {
  const { key, kid } = await getSigningKey();

  return new SignJWT({
    role: "authenticated",
    email: input.email,
    org_id: input.orgId,
    app_role: input.role,
  })
    .setProtectedHeader({ alg: "ES256", typ: "JWT", kid })
    .setSubject(input.userId)
    .setAudience("authenticated")
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(key);
}
