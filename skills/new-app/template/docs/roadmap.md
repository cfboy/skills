# Roadmap

<!-- Written by the new-app skill from the architecture interview. Each
     milestone ends with something a person can do, verified in the browser
     (the verification skill) — not with code that exists. -->

## M0 — Foundation ✓

Scaffolded from the new-app template: sign-in, organizations, the example
`note` table with RLS and its assertions, CI. `pnpm verify` green.

## M1 — The domain

The tables of docs/architecture.md, their policies and RLS assertions, the
types regenerated; `note` removed.

## M2 — The core flow

The one thing the primary user must be able to do (PRODUCT.md), end to end,
on their device. Verification skill created (`create-verification-skill`) with this
flow as its first feature.

## M3 — The people

Inviting people, their roles, removing them; the screens an organization's
admins use.

## M4 — Production

Supabase, Vercel and GitHub set up (the new-app skill's
references/production.md), the first real organization and its owner, a real
domain and email sender.
