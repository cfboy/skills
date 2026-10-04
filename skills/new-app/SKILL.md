---
name: new-app
description: Start a new full-stack web app on a proven stack — Next.js 16, BetterAuth (passwords, passkeys, organizations), Supabase Postgres with Row Level Security driven by app-minted ES256 tokens, Drizzle migrations, shadcn/ui + Tailwind v4, TanStack Form/Query, zod, Biome + ESLint, Vitest, browser verification with pstack's create-verification-skill, and CI that migrates then deploys to Vercel. Interviews the user about the architecture (multi-tenant or not, accounts, sign-in, device, data sensitivity, roles, core flow) before building, and leaves an architecture record and a roadmap. Use when the user wants to create, scaffold, bootstrap or start a new app, SaaS, internal tool, dashboard or multi-tenant product ("empezar un proyecto nuevo", "crea una app nueva", "new Next.js + Supabase app"). Not for marketing/landing websites without sign-in.
---

# New app

Creates a working, verified app in one sitting — sign-in, organizations, one
example table protected by RLS with assertions that prove it, CI — shaped by
an interview about what the app is, and leaves the record of those decisions
and the path to build the rest.

The architecture and the reasons for each choice are in
[references/decisions.md](references/decisions.md).

## 1. Interview

Before touching the disk, run the interview in
[references/interview.md](references/interview.md): three short rounds —
**the shape** (tenancy, accounts, sign-in, device), **the data**
(sensitivity, roles, language, extras), **the path** (the core flow, the
entities, when someone real needs it). Use AskUserQuestion when available.
Ask only what the user has not already said; state defaults instead of asking
about them.

Also settle the basics: the **name** people see, a **slug**
(`agenda-clinica`), **one sentence** on who uses it and for what, and
**where** to create it (default `./<slug>`).

Read the answers back in a few lines and get a yes before scaffolding.

## 2. Check the tools

```bash
node -v      # 22+ (CI uses 24)
pnpm -v      # 10+
docker info  # or podman: the Supabase CLI needs a container runtime
supabase -v  # https://supabase.com/docs/guides/local-development/cli/getting-started
```

And the companion skills from [pstack](https://github.com/cursor/plugins/tree/main/pstack)
(MIT), which this one hands browser verification to:

- **`create-verification-skill`** — inspects the app and writes its
  project-local verification skill (`.claude/skills/verify-<slug>/`).
- **`maintain-verification-skill`** — keeps that skill's feature map in step
  with the app. Manual only: the user runs `/maintain-verification-skill`.

```bash
npx skills add cursor/plugins --skill create-verification-skill \
  --skill maintain-verification-skill -a claude-code
```

A missing tool stops the run: say which and how to install it. A missing
companion skill does not: build and verify everything else, skip step 6, and
tell the user what was skipped and why.

## 3. Scaffold

```bash
node <this-skill>/scripts/scaffold.mjs \
  --name "Agenda Clínica" --slug agenda-clinica --dir ./agenda-clinica \
  --description "Agenda compartida para los equipos de varias clínicas." \
  --tenancy multi        # or single
```

`--port-offset 300` moves the local Supabase ports away from other stacks;
omitted, it is derived from the slug. The script refuses a non-empty
directory.

## 4. Install, start, verify

```bash
cd agenda-clinica
git init -b main
pnpm install
pnpm dev:setup   # signing key → supabase start → .env.local → db reset → types → dev logins
pnpm verify      # lint, types, unit tests, 19 RLS assertions
```

All of it must pass. `All RLS checks passed.` is the proof tenancy works.

## 5. Apply the interview

1. The recipes in [references/options.md](references/options.md) the answers
   chose for **now** (sign-in methods, public sign-up, language, sensitive
   data). Extras that belong to a later milestone go into the roadmap
   instead. `pnpm verify` again.
2. **docs/architecture.md** — every decision with one line of *why* and
   today's date; the domain's entities; open questions.
3. **docs/roadmap.md** — M1 the entities, M2 the core flow, the extras in the
   milestone that first needs them. Each milestone ends with something a
   person can do, verified in the browser.
4. **PRODUCT.md** — the users, their device, the core flow, the domain's
   words.

Then commit: `Start <name> from the new-app template`, with the decisions in
the body.

## 6. Verification in the browser

Run **`create-verification-skill`** on the new project. It reads the app and the
dev logins (`owner@example.test`, `member@example.test`,
`platform@example.test`, password `desarrollo-local`; `pnpm dev:accounts`)
and creates `.claude/skills/verify-<slug>/` with the feature map and the
drivers. Its first features are the template's: sign-in (and a wrong
password), the organization's notes (an empty note refused, the member unable
to delete the owner's note — RLS's refusal surfacing as a toast),
another organization's address being a 404 (multi-tenant), someone in no
organization, sign-out, and a password reset through Mailpit
(its port is in the project's README). Drive them once and hand over the proof.

From then on, AGENTS.md tells every agent: a visible change is verified with
`verify-<slug>` before its PR. Tell the user that when features change they
run `/maintain-verification-skill` (it is manual-only, and can also run as a
scheduled cloud agent), so the map follows the app.

Tell the user `pnpm dev` serves http://localhost:3000 and which login to try.

## 7. Make it theirs

1. **DESIGN.md** — decide the visual world with the user (the `impeccable`
   skill if available), then make `app/globals.css` and the fonts in
   `app/layout.tsx` match. The template ships a neutral placeholder on
   purpose.
2. **M1, the domain** — "Adding a table" in the project's AGENTS.md, once per
   entity. Keep `note` until the first real table and its RLS assertions pass,
   then remove it (schema, policies, assertions, `actions/notes.ts`,
   `lib/schemas/notes.ts`, `components/notes/`) and ask the user to run
   `/maintain-verification-skill` so the verification map follows. Before
   the first production deploy it is fine to regenerate `supabase/migrations/`
   from scratch, carrying over the identity and BetterAuth sections of the
   behaviour migration; after it, only new migrations.
3. **More UI** — `pnpm dlx shadcn@latest add <component>` (style
   `radix-nova`); forms on a phone use `size="lg"` (44px).

Patterns past the example — a browser-side typeahead, SQL functions,
invitations, platform screens, storage — are in
[references/extending.md](references/extending.md).

## 8. Production

When the roadmap reaches it, walk the user through
[references/production.md](references/production.md). After that, merging to
`main` migrates and deploys by itself.

## When something fails

| Symptom | Cause |
|---|---|
| Every query returns nothing, no error | The token is not verified: `supabase/signing_keys.json` was missing when the stack started (`pnpm keys:ensure`, then `pnpm db:stop && pnpm db:start`), or `SUPABASE_JWT_SIGNING_KEY` in `.env.local` is another key (`pnpm env:local --force`). |
| `The environment is incomplete` at boot | `.env.local` missing or stale: `pnpm env:local --force`. |
| Dev logins stopped working | `pnpm db:reset` wipes them: `pnpm dev:accounts`. |
| Sign-in returns 429 | BetterAuth's rate limit (3 per 10 s), on in production builds. Wait. |
| `port is already allocated` | Another Supabase stack: re-scaffold with another `--port-offset`, or stop it. |
| Image pulls fail behind a proxy | `SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io pnpm db:start`. |
| Podman instead of Docker | `scripts/supabase.sh` finds Podman's socket by itself. |
