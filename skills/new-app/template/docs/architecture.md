# Architecture decisions

<!-- Written by the new-app skill from the architecture interview, then kept
     current: when a decision changes, change it here in the same PR, with the
     date and why. One line of "why" per decision is the point of this file. -->

| Decision | Choice | Why | Date |
|---|---|---|---|
| Tenancy | {{#multi}}Multi-tenant: organizations, each in `/orgs/[orgId]`{{/multi}}{{#single}}Single organization, never in the URL{{/single}} | | |
| Accounts | Invite-only (`disableSignUp: true`) | | |
| Sign-in | Email + password, passkeys | | |
| Roles | owner · admin · member | | |
| Primary device | | | |
| Data sensitivity | | | |
| Language | Spanish | | |
| Email | SMTP (Mailpit locally) | | |
| Files | — | | |
| Background work | — | | |
| Hosting | Vercel + Supabase, deployed by CI after migrations | | |

## The domain

The entities, in the users' words, and which organization owns each. Every
one becomes a table with `org_id` and RLS (AGENTS.md, "Adding a table").

## Open questions

What is not decided yet, and what would decide it.
