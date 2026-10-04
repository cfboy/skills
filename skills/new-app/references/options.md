# Options applied after scaffolding

Each recipe keeps the template's invariants: identity in BetterAuth, data
through supabase-js with the person's token, RLS proved by
`scripts/rls-check.ts`. Re-run `pnpm verify` after each.

## Public sign-up

1. `lib/auth/auth.ts`: `disableSignUp: false`; decide `autoSignIn`.
2. A `/sign-up` page in `app/(auth)/` calling `authClient.signUp.email`.
3. A `databaseHooks.user.create.after` hook that creates the person's own
   organization (`auth.api.createOrganization` with `userId`) so they land
   somewhere; with `--tenancy single`, add them as `member` of the one
   organization instead.
4. `allowUserToCreateOrganization` → `true` if people may open more.
5. Keep the rate limit in the database (it already is); consider email
   verification (`requireEmailVerification: true` + `sendVerificationEmail`).

## Join by link

Use the organization plugin's invitations: an admin creates one
(`auth.api.createInvitation`), the email links to `/invite/[id]`, which signs
up or signs in and calls `authClient.organization.acceptInvitation`. The
`invitation` table is already in the schema; it stays revoked from the Data
API.

## Without passkeys

Remove `passkey(...)` from `lib/auth/auth.ts`, `passkeyClient()` from
`lib/auth/client.ts`, the button in `app/(auth)/login/login-form.tsx`, the
`passkey` table from `db/schema/auth.ts` (new migration), and it from
`scripts/rls-check.ts`.

## Magic link

`magicLink({ sendMagicLink })` from `better-auth/plugins`, sending through
`lib/mailer.ts` like `sendResetPassword`; `magicLinkClient()` in the client; a
"Recibir un enlace" button on the login page. Its tokens live in
`verification`, already in the schema.

## Google

`socialProviders.google` in `lib/auth/auth.ts` with `GOOGLE_CLIENT_ID` and
`GOOGLE_CLIENT_SECRET` (add both to `lib/env.ts` and `.env.example`), and
`authClient.signIn.social({ provider: "google" })` on the login page. With
invite-only accounts, set `disableImplicitSignUp: true` so Google cannot
create an account nobody invited.

## Language

English: translate the strings in `app/`, `components/notes/`,
`lib/auth/emails.ts`, `lib/schemas/`, `actions/`, set `lang="en"` and the
`Intl` locales. Both: add `next-intl` with `es` and `en` message files before
M2, while there are few strings — retrofitting later is the expensive way.

## Sensitive data

- An `audit_log` table written by a trigger on every domain table (who, when,
  table, row id, old and new values), readable only by the organization's
  admins, never deletable through the API: one generic `record_audit()`
  trigger function that reads `TG_TABLE_NAME` and `to_jsonb(old/new)`.
- Logs, error messages and agent transcripts carry ids and counts, never
  names. The verification skill already keeps proof under gitignored
  `.verify/`.
- Real records never enter the repository: gitignore `data/` and any
  generated `supabase/seed.sql`.
- Backups and point-in-time recovery on the Supabase plan.

## File uploads

A private bucket created in a migration, `storage.objects` policies comparing
the first path segment to `current_org_id()::text`, uploads through a Route
Handler that checks `orgScope`, served with signed URLs.

## Scheduled jobs

A Vercel Cron hitting a Route Handler protected by a `CRON_SECRET` header, or
`pg_cron` in a migration when the job is pure SQL. A job acts for no person:
it uses the Drizzle connection, so it must scope every query by
`org_id` itself — say so in its comment, and give it an assertion.

## Payments

Stripe Checkout + a webhook Route Handler that verifies the signature and
writes the subscription to a table keyed by organization (written by the
server, read by members through RLS). Never trust the client's word on what
was paid.

## Realtime

Supabase Realtime with the browser client (`lib/supabase/client.ts`), which
carries the person's token, so Realtime's RLS applies. Turn `[realtime]` on in
`supabase/config.toml`.
