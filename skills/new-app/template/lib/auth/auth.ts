/**
 * The BetterAuth instance — one configuration for the app and the scripts.
 *
 * App code imports it from lib/auth/server.ts, which adds the server-only guard.
 * Scripts (dev-accounts, rls-check) import this module directly so they create
 * accounts through exactly the same rules as the app.
 */
import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin, organization } from "better-auth/plugins";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { reportDelivery } from "@/lib/auth/delivery";
import { passwordLinkEmail } from "@/lib/auth/emails";
import { ac, platformAc, platformRoles, roles } from "@/lib/auth/permissions";
import { sendEmail } from "@/lib/mailer";

/**
 * The app's public URL. BetterAuth reads BETTER_AUTH_URL itself; the passkey
 * plugin needs it spelled out as a WebAuthn relying party.
 */
const appURL = new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000");

export const auth = betterAuth({
  appName: "__APP_NAME__",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      organization: schema.organization,
      member: schema.member,
      invitation: schema.invitation,
      passkey: schema.passkey,
      rateLimit: schema.rateLimit,
    },
  }),

  // BetterAuth's default rules are right; where the counts live is not. In
  // memory they are per serverless instance, so they are kept in the database
  // instead. Enabled in production only, as by default.
  rateLimit: { storage: "database" },

  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    // Accounts are created by the people who run an organization, never by
    // whoever finds the URL. BetterAuth leaves /api/auth/sign-up/email open by
    // default. Flip this only for a product with public sign-up, and decide
    // then which organization a stranger lands in.
    disableSignUp: true,
    minPasswordLength: 10,
    // Invitations are password resets for people who have no password yet:
    // resetPassword creates their credential account. BetterAuth swallows
    // errors thrown here; reportDelivery hands the outcome to whoever asked
    // (lib/auth/delivery.ts).
    sendResetPassword: async ({ user, url }) => {
      const [credential] = await db
        .select({ id: schema.account.id })
        .from(schema.account)
        .where(and(eq(schema.account.userId, user.id), eq(schema.account.providerId, "credential")))
        .limit(1);

      await reportDelivery(() =>
        sendEmail(
          passwordLinkEmail({ to: user.email, name: user.name, url, firstTime: !credential }),
        ),
      );
    },
    // Long enough to survive an invitation arriving on a Friday.
    resetPasswordTokenExpiresIn: 60 * 60 * 24 * 3,
    // Setting a password signs out every other session.
    revokeSessionsOnPasswordReset: true,
  },

  user: {
    additionalFields: {
      // input: false — set by the app, never by the person at sign-in.
      lastSignInAt: { type: "date", required: false, input: false },
    },
  },

  databaseHooks: {
    session: {
      create: {
        // Land in the person's first organization. Only a landing hint: which
        // organization a request acts in is always named by its route.
        before: async (session) => {
          const [first] = await db
            .select({ organizationId: schema.member.organizationId })
            .from(schema.member)
            .where(eq(schema.member.userId, session.userId))
            .orderBy(asc(schema.member.createdAt))
            .limit(1);
          return { data: { ...session, activeOrganizationId: first?.organizationId ?? null } };
        },
        // Sessions do not outlive sign-out, so "last seen" is kept on the person.
        after: async (session) => {
          await db
            .update(schema.user)
            .set({ lastSignInAt: session.createdAt })
            .where(eq(schema.user.id, session.userId));
        },
      },
    },
  },

  advanced: {
    database: {
      // Load-bearing. auth.uid() is (request.jwt.claims ->> 'sub')::uuid, so a
      // non-uuid id makes every RLS policy throw on the cast, and every FK in
      // the schema is a uuid. Must be set before the first user row exists.
      generateId: "uuid",
    },
  },

  plugins: [
    organization({
      ac,
      roles,
      // Organizations are opened by the platform, not by whoever signs in.
      allowUserToCreateOrganization: (user) => user.role === "admin",
    }),
    // WebAuthn's relying party is the app's own origin: a passkey made on the
    // production domain only works there, which is the point.
    passkey({
      rpName: "__APP_NAME__",
      rpID: appURL.hostname,
      origin: appURL.origin,
    }),
    adminPlugin({ ac: platformAc, roles: platformRoles }),
    // Lets Server Actions set and clear the session cookie. Must be last.
    nextCookies(),
  ],
});
