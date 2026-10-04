import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth/server";

/**
 * Who is signed in. Never which organization: that is named by the request's
 * route or its action's input (lib/org-scope.ts), so two tabs on two
 * organizations can never write into each other.
 */
export type AppSession = {
  userId: string;
  email: string;
  name: string;
  /** The admin plugin's platform-wide role ("admin" or "user"), apart from any organization. */
  platformRole: string | null;
  /** Where the person landed last; a hint for the home page, not a scope. */
  activeOrgId: string | null;
};

/**
 * The one place the app asks who is signed in.
 *
 * The identity is BetterAuth's: getSession verifies the cookie against the
 * session table, never a bare cookie read. That identity is what the Supabase
 * token is minted from; everything after goes through supabase-js and RLS.
 *
 * Wrapped in React's cache() so a page, its layout and its components resolve
 * it once per request.
 */
export const getSession = cache(async (): Promise<AppSession | null> => {
  const current = await auth.api.getSession({ headers: await headers() });
  if (!current) return null;

  return {
    userId: current.user.id,
    email: current.user.email,
    name: current.user.name,
    platformRole: current.user.role ?? null,
    activeOrgId: current.session.activeOrganizationId ?? null,
  };
});

/** Guard for every page under app/(app). */
export async function requireSession(): Promise<AppSession> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
