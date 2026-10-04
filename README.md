# cfboy/skills

Agent skills for starting and building full-stack web apps on a proven stack.

> **ES** — Skills para Claude Code (y otros agentes) que arrancan un proyecto
> nuevo, después de entrevistarte sobre su arquitectura, ya verificado: login,
> organizaciones, RLS probado, CI y deploy.

## Skills

| Skill | What it does |
|---|---|
| [`new-app`](skills/new-app/SKILL.md) | Interviews you about the architecture (multi-tenant or single organization, accounts, sign-in, device, data sensitivity, roles, the core flow), then scaffolds the app — Next.js 16, BetterAuth (passwords, passkeys, organizations), Supabase Postgres with Row Level Security driven by app-minted ES256 tokens, Drizzle migrations, shadcn/ui + Tailwind v4, TanStack Form/Query, zod, Biome + ESLint, Vitest — with an RLS test suite and CI that migrates then deploys to Vercel. |

## Install

**Claude Code plugin**

```
/plugin marketplace add cfboy/skills
/plugin install cfboy-skills@cfboy
```

**Any agent, with [skills](https://github.com/vercel-labs/skills)**

```bash
npx skills add cfboy/skills
```

**By hand**: copy `skills/new-app` into `~/.claude/skills/` (every project) or
`.claude/skills/` (one project).

Then ask: *"start a new app called Agenda Clínica"* — or *"empieza un proyecto
nuevo"*.

## What you need

Node 22+, pnpm 10+, Docker (or Podman) and the Supabase CLI. The skill checks
for them and says what is missing.

Browser verification is handed to two skills from Lauren Tan's
[pstack](https://github.com/cursor/plugins/tree/main/pstack) (MIT):
`create-verification-skill` writes the project's `verify-<app>` skill, and
`maintain-verification-skill` keeps its feature map in step with the app.

```bash
npx skills add cursor/plugins --skill create-verification-skill \
  --skill maintain-verification-skill -a claude-code
```

Without them `new-app` still builds and verifies everything else, and says
what it skipped.

## How it was tested

The template is scaffolded into a fresh directory and must pass, from zero:
`pnpm dev:setup` (local Supabase, migrations, types, dev logins), `pnpm verify`
(lint, types, unit tests and 19 RLS assertions), `pnpm format:check`,
`pnpm build`, and a browser run of sign-in, notes, a refused cross-tenant
delete, a 404 on someone else's organization, sign-out and a password reset
through the local mail inbox. Changes to the template should keep all of that
green.
