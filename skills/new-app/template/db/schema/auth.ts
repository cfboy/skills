import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * BetterAuth's own tables, for exactly the plugins in lib/auth/auth.ts
 * (email/password, organization, admin, passkey) and its database-backed rate
 * limiter.
 *
 * Two deliberate departures from BetterAuth's defaults:
 *
 *  - ids are `uuid`, not text. auth.uid() casts the JWT's `sub` to uuid, and
 *    every domain FK is a uuid. BetterAuth is configured with
 *    generateId: "uuid" to match.
 *  - membership cascades. BetterAuth leaves member/invitation onDelete unset;
 *    a membership outliving the person it describes is never what we want.
 *
 * Names follow BetterAuth's model names so drizzleAdapter finds them. `user` is
 * a reserved word in Postgres; Drizzle quotes identifiers, so it is `"user"`.
 *
 * Adding a BetterAuth plugin means adding its tables here by hand, from the
 * installed library's getAuthTables(), then `pnpm db:generate`.
 */

export const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** A person. A row with no credential `account` exists but cannot sign in yet. */
export const user = pgTable("user", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  // admin plugin: the platform-wide role ("admin" | "user"), distinct from the
  // per-organization member.role that the app and RLS actually use.
  role: text(),
  banned: boolean().default(false),
  banReason: text(),
  banExpires: timestamp({ withTimezone: true }),
  /**
   * Set on every sign-in by a session hook in lib/auth/auth.ts. Sessions are
   * deleted on sign-out and on password reset, so they cannot answer "when did
   * this person last come in".
   */
  lastSignInAt: timestamp({ withTimezone: true }),
  ...timestamps,
});

export const session = pgTable(
  "session",
  {
    id: uuid().primaryKey().defaultRandom(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    token: text().notNull().unique(),
    ipAddress: text(),
    userAgent: text(),
    userId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /**
     * The organization plugin's "active" organization. Only a hint for where
     * to land: which organization a request acts in is named by its route
     * (/orgs/[orgId]) or its action's input, never remembered here.
     */
    activeOrganizationId: uuid(),
    impersonatedBy: uuid(),
    ...timestamps,
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

/** The credential. Created when the person sets a password from their invitation. */
export const account = pgTable(
  "account",
  {
    id: uuid().primaryKey().defaultRandom(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ withTimezone: true }),
    refreshTokenExpiresAt: timestamp({ withTimezone: true }),
    scope: text(),
    password: text(),
    ...timestamps,
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: uuid().primaryKey().defaultRandom(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

/** The tenant. Every row of domain data belongs to exactly one. */
export const organization = pgTable("organization", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  logo: text(),
  metadata: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/** A person's role within one organization. What current_org_role() reads. */
export const member = pgTable(
  "member",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: uuid()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text().notNull().default("member"),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // One role per person per organization; RLS reads it with a single lookup.
    uniqueIndex("member_organization_user_idx").on(t.organizationId, t.userId),
    // One owner per organization: the person who answers for it. Changing who
    // that is is a transfer, never a second owner alongside the first.
    uniqueIndex("member_one_owner_idx").on(t.organizationId).where(sql`role = 'owner'`),
    index("member_user_id_idx").on(t.userId),
    check("member_role_check", sql`role in ('owner', 'admin', 'member')`),
  ],
);

/** A pending link between an email and an organization. */
export const invitation = pgTable(
  "invitation",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: uuid()
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text().notNull(),
    role: text(),
    status: text().notNull().default("pending"),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    inviterId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("invitation_email_idx").on(t.email)],
);

/**
 * A WebAuthn credential (@better-auth/passkey): signing in with the phone's
 * fingerprint, face or screen lock instead of a password.
 */
export const passkey = pgTable(
  "passkey",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text(),
    publicKey: text().notNull(),
    userId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    credentialID: text().notNull(),
    counter: integer().notNull(),
    deviceType: text().notNull(),
    backedUp: boolean().notNull(),
    transports: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow(),
    aaguid: text(),
  },
  (t) => [
    index("passkey_user_id_idx").on(t.userId),
    // Sign-in looks the credential up by this id; a credential belongs to one person.
    uniqueIndex("passkey_credential_id_idx").on(t.credentialID),
  ],
);

/**
 * Rate-limit counters. BetterAuth keeps them in memory by default, which on
 * Vercel means per function instance — an attacker spread across instances is
 * barely limited. In the database every instance shares one count.
 */
export const rateLimit = pgTable("rate_limit", {
  id: uuid().primaryKey().defaultRandom(),
  key: text().notNull().unique(),
  count: integer().notNull(),
  lastRequest: bigint({ mode: "number" }).notNull(),
});
