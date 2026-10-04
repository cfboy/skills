# Taking it to production

Once, by the person who owns the accounts. After this, merging to `main`
migrates the production database and deploys.

## 1. Supabase

1. Create a project (region close to the users). Note its **project ref**
   (the subdomain of its URL) and the **database password**.
2. Project Settings → JWT Keys → import a new key. Generate it locally with
   `pnpm keys:ensure --generate` — a fresh key, never the local
   `supabase/signing_keys.json` — paste the JSON, and make it the **current**
   signing key. Keep the printed value for Vercel.
3. Project Settings → API Keys: copy the **publishable** key and the URL.
4. Connect → the **transaction pooler** connection string (port 6543) for
   `DATABASE_URL`. Serverless functions open many short connections; the
   direct connection runs out.

## 2. Vercel

1. Import the GitHub repository as a project (framework: Next.js).
2. Settings → Environment Variables, Production:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | from step 1.3 |
   | `DATABASE_URL` | the pooler string from step 1.4 |
   | `SUPABASE_JWT_SIGNING_KEY` | the JSON from step 1.2, one line |
   | `BETTER_AUTH_URL` | `https://<the production domain>` |
   | `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
   | `SMTP_URL` | the email provider's SMTP relay, e.g. `smtps://user:pass@smtp.resend.com:465` |
   | `EMAIL_FROM` | `"Name <no-reply@your-domain>"`, a verified sender |

   `SUPABASE_URL` and `SUPABASE_SECRET_KEY` are for scripts; production does
   not need them.
3. Add the domain. `BETTER_AUTH_URL` must match it exactly: passkeys are bound
   to it.
4. `vercel.json` turns off Vercel's own deploys from `main`; CI deploys after
   migrating. Preview deploys from pull requests still happen.

## 3. GitHub

Settings → Environments → new environment `production`:

- Secrets: `SUPABASE_ACCESS_TOKEN` (supabase.com → Account → Access Tokens),
  `SUPABASE_DB_PASSWORD`, `VERCEL_TOKEN` (vercel.com → Account → Tokens).
- Variables: `SUPABASE_PROJECT_REF`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
  (both in `.vercel/project.json` after `vercel link`, or the project's
  settings).
- Optional: a required reviewer, so a person approves each production
  migration.

Protect `main`: require the `check` and `security` jobs to pass before merge.

## 4. The first account

Production has no dev logins. Make the first platform admin and organization
with a one-off script against production, or temporarily point
`scripts/dev-accounts.ts`-style helpers at it — `scripts/env.ts` announces
the target and refuses a mixed one. Then invite everyone else from the app:
an invitation is a password-reset email (`lib/auth/password-link.ts`).
