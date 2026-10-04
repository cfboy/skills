import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

/**
 * Service-role client. BYPASSES RLS ENTIRELY.
 *
 * Scripts only (fixtures, seeding, maintenance) — never import this from
 * anything under app/, actions/ or components/. The ESLint config enforces it.
 */
export function createAdminClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error(
      "createAdminClient requires SUPABASE_URL and SUPABASE_SECRET_KEY. " +
        "These belong in .env.local for local scripts and must never be exposed to the browser.",
    );
  }

  return createSupabaseClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
