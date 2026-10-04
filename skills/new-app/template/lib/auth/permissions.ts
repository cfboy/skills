import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements as platformDefaultStatements,
  adminAc as platformAdminAc,
  userAc as platformUserAc,
} from "better-auth/plugins/admin/access";
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";

/**
 * Who may do what inside an organization.
 *
 * Defined in code rather than in a roles table on purpose: a permission that
 * lives in the code can be read in a diff and reviewed.
 *
 * These govern the *application* — what a screen offers, what an action
 * attempts. They are not the security boundary: RLS is, and current_org_role()
 * reads the same member.role these are keyed by. When the two disagree, the
 * database wins and the user sees an empty result or a refused write, so keep
 * them in step and let scripts/rls-check.ts prove it.
 */
export const statement = {
  ...defaultStatements,
  note: ["read", "create", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

/** Answers for the organization. One per organization (member_one_owner_idx). */
export const owner = ac.newRole({
  ...ownerAc.statements,
  note: ["read", "create", "update", "delete"],
});

/** Runs it day to day: manages people and everyone's records. */
export const admin = ac.newRole({
  ...adminAc.statements,
  note: ["read", "create", "update", "delete"],
});

/** Works in it: their own records, everyone's to read. */
export const member = ac.newRole({
  ...memberAc.statements,
  note: ["read", "create", "update", "delete"],
});

export const roles = { owner, admin, member };

export type OrgRole = keyof typeof roles;
export const ORG_ROLES = Object.keys(roles) as OrgRole[];

/** Whether a member role is one this app defines — what member_role_check allows. */
export function isOrgRole(role: string): role is OrgRole {
  return Object.hasOwn(roles, role);
}

/** The roles RLS's is_org_admin() treats as running the organization. */
export function isAdminRole(role: OrgRole): boolean {
  return role === "owner" || role === "admin";
}

export type Permission = { [K in keyof typeof statement]?: (typeof statement)[K][number][] };

/**
 * Ask what a role may do — `roleCan(role, { note: ["delete"] })` — never compare
 * role strings in a screen. A comparison in a component is a rule nobody can
 * find again.
 */
export function roleCan(role: OrgRole, request: Permission): boolean {
  return roles[role].authorize(request).success;
}

// ---------------------------------------------------------------------------
// The platform: the admin plugin's global role, above every organization.
// ---------------------------------------------------------------------------

export const platformAc = createAccessControl(platformDefaultStatements);

export const platformRoles = {
  admin: platformAc.newRole(platformAdminAc.statements),
  user: platformAc.newRole(platformUserAc.statements),
};
