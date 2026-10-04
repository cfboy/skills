/**
 * People, accounts and organizations for scripts, through the same BetterAuth
 * instance as the app — so a script-made account signs in under exactly the
 * app's rules.
 */
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { member, organization, user } from "@/db/schema";
import { auth } from "@/lib/auth/auth";
import type { OrgRole } from "@/lib/auth/permissions";

/** Finds a person by email, or creates them with no password and no organization. */
export async function ensureUser(input: { email: string; name: string }): Promise<string> {
  const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, input.email));
  if (existing) return existing.id;

  const created = await auth.api.createUser({ body: { email: input.email, name: input.name } });
  return created.user.id;
}

/**
 * Gives a person a password — what accepting an invitation does, done directly
 * for local development and bootstrapping.
 */
export async function giveAccount(userId: string, password: string): Promise<void> {
  const ctx = await auth.$context;
  await ctx.internalAdapter.updateUser(userId, { emailVerified: true });

  const hash = await ctx.password.hash(password);
  const credential = await ctx.internalAdapter.findCredentialAccount(userId);
  if (credential) {
    await ctx.internalAdapter.updatePassword(userId, hash);
  } else {
    await ctx.internalAdapter.createAccount({
      userId,
      providerId: "credential",
      accountId: userId,
      password: hash,
    });
  }
}

/** Finds an organization by slug, or creates it with `ownerId` as its owner. */
export async function ensureOrg(input: {
  slug: string;
  name: string;
  ownerId: string;
}): Promise<string> {
  const [existing] = await db
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.slug, input.slug));
  if (existing) return existing.id;

  const created = await auth.api.createOrganization({
    body: { name: input.name, slug: input.slug, userId: input.ownerId },
  });
  if (!created) throw new Error(`Could not create organization ${input.slug}.`);
  return created.id;
}

/** Gives a person `role` in an organization, adding or updating the membership. */
export async function ensureMember(input: {
  orgId: string;
  userId: string;
  role: OrgRole;
}): Promise<void> {
  const [membership] = await db
    .select({ id: member.id })
    .from(member)
    .where(and(eq(member.userId, input.userId), eq(member.organizationId, input.orgId)));

  if (membership) {
    await db.update(member).set({ role: input.role }).where(eq(member.id, membership.id));
  } else {
    await auth.api.addMember({
      body: { userId: input.userId, role: input.role, organizationId: input.orgId },
    });
  }
}

/** The admin plugin's platform role; the first platform admin has nobody to ask. */
export async function setPlatformRole(userId: string, role: "admin" | "user"): Promise<void> {
  await db.update(user).set({ role }).where(eq(user.id, userId));
}
