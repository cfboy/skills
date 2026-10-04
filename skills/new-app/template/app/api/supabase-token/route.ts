import { type NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { orgScope } from "@/lib/org-scope";
import { TOKEN_TTL_SECONDS, mintSupabaseToken } from "@/lib/supabase/token";

/**
 * A short-lived Supabase token for the signed-in browser, for one organization.
 * See lib/supabase/client.ts. The organization is the page's, passed by the
 * caller; the database verifies the claim again, so this check exists to
 * refuse legibly, not to protect anything.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ token: null }, { status: 401 });

  const orgId = request.nextUrl.searchParams.get("org");
  if (!orgId) return NextResponse.json({ token: null }, { status: 400 });
  const scope = await orgScope(orgId);
  if (!scope) return NextResponse.json({ token: null }, { status: 403 });

  return NextResponse.json(
    {
      token: await mintSupabaseToken({ ...session, orgId: scope.org.id, role: scope.role }),
      expiresIn: TOKEN_TTL_SECONDS,
    },
    // A bearer token must never be cached by anything between here and the tab.
    { headers: { "Cache-Control": "no-store" } },
  );
}
