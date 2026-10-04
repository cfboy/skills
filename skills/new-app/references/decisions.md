# Why the stack is shaped this way

Each choice below answers a problem that multi-tenant apps on this stack run
into, usually after launch. The template makes them from the first commit.

## Identity and data access

**BetterAuth owns identity; Supabase owns data.** BetterAuth gives email and
password, passkeys, organizations with roles, an admin plugin and
database-backed rate limits, all in the app's own tables. Supabase gives
Postgres, PostgREST, Storage and a local stack. Supabase Auth (GoTrue) is not
used; its sign-up is closed in `config.toml` so nothing can create an identity
behind BetterAuth's back.

**The bridge is a token the app mints.** For each request the server signs a
5-minute ES256 JWT (`sub` = the BetterAuth user id, `role` = authenticated,
`org_id` = the organization the request names) with a private key only the
server holds. PostgREST verifies it against the public half (Supabase's
asymmetric JWT signing keys), so `auth.uid()` and every RLS policy work as if
Supabase Auth had issued it.

**All app reads and writes go through supabase-js with that token.** RLS is
the security boundary, not the app code. The Drizzle pool connects as the
database owner, which RLS does not apply to, so it is reserved for BetterAuth,
for membership lookups RLS depends on, and for scripts.

**Policies are hand-written SQL, proved by a script.** drizzle-kit drops the
`USING`/`WITH CHECK` of `FOR ALL` policies on introspection, which can silently
turn "only your organization" into "any signed-in account". RLS failures never
raise errors, so `scripts/rls-check.ts` asserts each policy with real tokens,
in CI, against a database migrated from scratch.

**The tenant is named by the request, not remembered.** A tenant kept in the
session lets two browser tabs on two organizations write into each other.
Multi-tenant apps put it in the URL (`/orgs/[orgId]`); single-organization
apps resolve the one membership. Either way `current_org_id()` accepts the
token's claim only if the caller is a member there, with no fallback.

## Hardening that is easy to forget

- **RLS on every table from the first migration**, BetterAuth's included:
  sessions, accounts, verification tokens, passkeys and rate-limit counters
  are revoked from the Data API; `user` is exposed by column grant only.
- **A validated environment.** `serverEnv()` parses it with zod at boot
  (`instrumentation.ts`) instead of `process.env.X!` scattered through the
  code; lazily, so `next build` needs no secrets.
- **Zero-copy local setup.** `pnpm env:local` writes `.env.local` from
  `supabase status`; `pnpm keys:ensure` makes the local signing key and
  `--generate` prints a fresh one for production.
- **Rate limits in the database**, not in memory, so serverless instances
  share one count.
- **Invite-only by default.** BetterAuth leaves sign-up open unless told
  otherwise.
- **Migrations before code.** CI applies migrations, then builds and deploys
  to Vercel itself, so new code never reaches production before the columns it
  reads. The Supabase CLI version is pinned.
- **Guard rails in lint.** ESLint refuses the service-role client in app code,
  and TanStack Form selectors that return arrays or objects (they render
  nothing in production builds).
- **One primitive library** (Radix via shadcn `radix-nova`) and shadcn's own
  `cn()`; no unused dependencies.
- **Two kinds of tests.** Vitest for pure logic, `rls-check` for the database,
  and the verification skill for what a person actually does.
- **Shifted local ports** so several projects' Supabase stacks run side by
  side, and a `supabase.sh` wrapper that finds Podman's socket.
