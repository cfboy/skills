# __APP_NAME__

__APP_DESCRIPTION__

## Running it locally

Requires Node 22+, pnpm and Docker or Podman. The Supabase CLI is a dev
dependency (pinned in `package.json`); Mailpit comes with its local stack.

```bash
pnpm install
pnpm dev:setup     # signing key, Supabase stack, .env.local, types, dev logins
pnpm dev           # http://localhost:3000
```

`dev:setup` prints the development logins (`owner@example.test`,
`member@example.test`, `platform@example.test`, password `desarrollo-local`).
Email sent locally lands in Mailpit at http://127.0.0.1:__MAIL_PORT__; Supabase
Studio is at http://127.0.0.1:__STUDIO_PORT__.

The local Supabase ports are shifted from the CLI defaults (API __API_PORT__,
database __DB_PORT__) so this stack runs beside other projects'.

## Verifying it

```bash
pnpm verify        # lint, types, unit tests, and every RLS assertion
```

## Architecture

- [AGENTS.md](AGENTS.md): how a request is decided, the rules that are not
  negotiable, how to add a table, how a change is verified and shipped.
- [docs/architecture.md](docs/architecture.md): the decisions and why.
- [docs/roadmap.md](docs/roadmap.md): the path from here.

Browser verification lives in the `verify-__APP_SLUG__` skill (made with
the `create-verification-skill` skill); its proof goes to gitignored `.verify/`.

## Production

`main` deploys itself: CI applies `supabase/migrations` to the production
database, then builds and ships to Vercel. Setting that up once is described
in the skill that created this project (`references/production.md`), and
summarized here:

- **Supabase**: a project; under Project Settings → JWT Keys, import a new
  ES256 private key (`pnpm keys:ensure --generate` prints one; never the local
  file) and make it the current key. The same value goes in Vercel as
  `SUPABASE_JWT_SIGNING_KEY`.
- **Vercel**: a project linked to this repository, with the environment from
  `.env.example` filled in for production.
- **GitHub**: an environment named `production` with secrets
  `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `VERCEL_TOKEN` and variables
  `SUPABASE_PROJECT_REF`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
