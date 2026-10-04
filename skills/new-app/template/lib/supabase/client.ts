import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { publicEnv } from "@/lib/env";

/**
 * Browser client. Runs as the signed-in user, so every query is subject to RLS.
 * Only for genuinely client-driven reads (a typeahead, a picker); writes go
 * through Server Actions, and pages read on the server.
 *
 * The browser never holds the signing key, so it asks /api/supabase-token for
 * a short-lived token, authenticated by the BetterAuth session cookie. A
 * cross-site page cannot read that response, so the route is safe as a GET.
 *
 * The token is per organization: a page names the one it acts in, and a token
 * minted for one carries no weight in another. Cached per organization, so two
 * tabs on two organizations do not fight over one cached token.
 */
const cached = new Map<string, { token: string; expiresAt: number }>();
const pending = new Map<string, Promise<string | null>>();

async function fetchToken(orgId: string): Promise<string | null> {
  const hit = cached.get(orgId);
  // Refresh a little early so a token never expires mid-request.
  if (hit && hit.expiresAt - 30_000 > Date.now()) return hit.token;

  // supabase-js may call this concurrently; share one in-flight request per organization.
  let inFlight = pending.get(orgId);
  if (!inFlight) {
    inFlight = (async () => {
      try {
        const res = await fetch(`/api/supabase-token?org=${encodeURIComponent(orgId)}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          cached.delete(orgId);
          return null;
        }
        const { token, expiresIn } = (await res.json()) as { token: string; expiresIn: number };
        cached.set(orgId, { token, expiresAt: Date.now() + expiresIn * 1000 });
        return token;
      } finally {
        pending.delete(orgId);
      }
    })();
    pending.set(orgId, inFlight);
  }
  return inFlight;
}

/** Browser client acting in one organization: the page's. */
export function createClient(orgId: string) {
  return createSupabaseClient<Database>(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey, {
    accessToken: () => fetchToken(orgId),
  });
}
