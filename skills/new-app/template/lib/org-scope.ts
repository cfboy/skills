import "server-only";

import { notFound } from "next/navigation";
import { cache } from "react";

import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/client";
import { member, organization } from "@/db/schema";
import { type OrgRole, type Permission, isOrgRole, roleCan } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { createClientForOrg } from "@/lib/supabase/server";

/**
 * One organization, as the request that names it may act in it.
 *
 * The organization comes from the route (/orgs/[orgId]) or the action's input
 * — never from the session — so two tabs on two organizations cannot write into
 * each other. The client carries a token for exactly this organization, which
 * current_org_id() verifies again on every statement.
 */
export type OrgScope = {
  org: { id: string; name: string; slug: string };
  role: OrgRole;
  supabase: Awaited<ReturnType<typeof createClientForOrg>>;
  can(request: Permission): boolean;
};

/** The organizations this person belongs to, oldest membership first. */
export async function membershipsOf(
  userId: string,
): Promise<{ id: string; name: string; slug: string; role: string }[]> {
  return db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      role: member.role,
    })
    .from(member)
    .innerJoin(organization, eq(organization.id, member.organizationId))
    .where(eq(member.userId, userId))
    .orderBy(asc(member.createdAt));
}

/**
 * The organization a request names, if the signed-in person belongs to it.
 * Null for anything else — a malformed id, no session, someone else's.
 */
export const orgScope = cache(async (orgId: string): Promise<OrgScope | null> => {
  if (!z.uuid().safeParse(orgId).success) return null;

  const session = await getSession();
  if (!session) return null;

  const [row] = await db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      role: member.role,
    })
    .from(member)
    .innerJoin(organization, eq(organization.id, member.organizationId))
    .where(and(eq(member.userId, session.userId), eq(member.organizationId, orgId)))
    .limit(1);
  if (!row) return null;
  if (!isOrgRole(row.role)) {
    throw new Error(`member.role holds a role this app does not define: ${row.role}`);
  }

  const role = row.role;
  return {
    org: { id: row.id, name: row.name, slug: row.slug },
    role,
    supabase: await createClientForOrg(row.id, role),
    can: (request) => roleCan(role, request),
  };
});

/**
 * For pages and layouts under /orgs/[orgId]. An organization this person does
 * not belong to is a 404, not a 403: whether it exists is not theirs to know.
 */
export async function requireOrg(orgId: string): Promise<OrgScope> {
  const scope = await orgScope(orgId);
  if (!scope) notFound();
  return scope;
}
