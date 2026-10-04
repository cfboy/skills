import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { OrgRole } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import type { Database } from "@/lib/database.types";
import { serverEnv } from "@/lib/env";
import { mintSupabaseToken } from "@/lib/supabase/token";

function clientWithToken(token: string | null) {
  const env = serverEnv();
  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { accessToken: async () => token },
  );
}

/**
 * Server client for Server Components, Server Actions and Route Handlers, for
 * what belongs to no organization: the person themselves.
 *
 * Every request carries a token minted from the BetterAuth session, so RLS sees
 * auth.uid() and decides what comes back. With no session it carries no token
 * and runs as anon, which the policies refuse outright.
 *
 * Anything inside an organization goes through orgScope (lib/org-scope.ts),
 * which builds createClientForOrg for the organization the route names.
 *
 * The `auth` namespace of this client is unavailable by design: supabase-js
 * disables it when accessToken is set. Identity comes from lib/auth/session.ts.
 */
export async function createClient() {
  const session = await getSession();
  const token = session ? await mintSupabaseToken({ ...session, orgId: null, role: null }) : null;
  return clientWithToken(token);
}

/**
 * The same client, acting in one named organization.
 *
 * The app is not trusted with which organization: current_org_id() returns the
 * claim only if the caller is a member there, so asking for an organization
 * this account does not belong to scopes the request to nothing rather than to
 * someone else's data.
 */
export async function createClientForOrg(orgId: string, role: OrgRole) {
  const session = await getSession();
  if (!session) return clientWithToken(null);
  return clientWithToken(await mintSupabaseToken({ ...session, orgId, role }));
}
