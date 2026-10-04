# The architecture interview

Ask before scaffolding. The answers choose the scaffold flags, the changes
applied right after it, and the first version of `docs/architecture.md` and
`docs/roadmap.md`. Use the AskUserQuestion tool when it is available (up to
four questions per call, two to four options each, recommended option first);
otherwise ask in one numbered message per round. Skip anything the user
already said. Never ask what you can decide from a sensible default — state
the default instead.

## Round 1 — the shape

**1. Tenancy.** *¿Quién comparte la app?*

| Option | Means | Do |
|---|---|---|
| Multi-tenant (recommended for a product sold to several clients) | Several organizations, each sees only its own data; a person can belong to more than one | `--tenancy multi` |
| One organization | One company or team; the organization never shows in the UI | `--tenancy single` |
| Provider → clients | One organization serves others under contract (an agency serving its clients, a franchisor its franchises): its people work inside the clients' data | `--tenancy multi`, then a roadmap item "contracts": a `contract` table (provider, client, dates) and an `assignment` table (which provider member works for which client); `current_org_id()` lets a provider's member act in a client only while a contract is live and they are assigned. Design it in M1, not now. |

**2. Accounts.** *¿Cómo llega alguien a tener cuenta?*

| Option | Do |
|---|---|
| By invitation only (recommended for internal tools and anything with sensitive data) | Default. |
| Public sign-up, each person creates their own organization | options.md → "Public sign-up" |
| Public sign-up into an existing organization by invitation link | options.md → "Join by link" |

**3. Sign-in** (multi-select). Email + password and passkeys are in by
default. Others: magic link, Google. → options.md for each one chosen; "no
passkeys" → options.md → "Without passkeys".

**4. Primary device.** Phone (on their feet) / desktop (at a desk) / both.
Phone: 44px controls everywhere (`size="lg"`), bottom navigation in M2, the
verification drives at phone size first. Write it in PRODUCT.md.

## Round 2 — the data

**5. Sensitivity.** *¿Qué tan sensible es la información?*

| Option | Do |
|---|---|
| Personal or protected (health, finances, children, identity documents) | options.md → "Sensitive data": audit log, no names in logs or transcripts, `.verify/` stays local, seed data never committed. |
| Ordinary business data | Defaults. |
| Public data | Defaults; consider which pages need no sign-in. |

**6. Roles.** *Además de dueño, administrador y miembro, ¿qué papeles hay?*
(free text). Each becomes a role in `lib/auth/permissions.ts`, the
`member_role_check` constraint and the SQL helpers — in M1, with its RLS
assertions.

**7. Language.** Spanish (default) / English / both. → options.md →
"Language".

**8. Extras** (multi-select): file uploads, email beyond sign-in,
scheduled jobs, payments, realtime updates. Each goes into the roadmap at the
milestone that first needs it, with options.md's recipe — not into the
scaffold.

## Round 3 — the path

**9. The core flow.** *¿Qué es lo primero que la persona principal tiene que
poder hacer, de principio a fin?* (free text). It becomes M2 and the
verification skill's first feature.

**10. The entities.** *¿Con qué cosas trabaja?* (free text: "clientes,
citas, facturas"). They become docs/architecture.md → "The domain" and M1.

**11. When.** *¿Cuándo necesita usarla alguien real?* This week / this month /
no date. "This week" moves M4 (production) before M3, with invitations done by
script.

## After the interview

1. Read the answers back in five lines and ask for a yes before scaffolding.
2. Scaffold with the flags, apply the options.md recipes chosen, re-run
   `pnpm verify`.
3. Fill `docs/architecture.md` (one line of *why* per decision, today's date)
   and `docs/roadmap.md` (M1 entities, M2 the core flow, extras placed in the
   milestone that needs them), and PRODUCT.md's users, device and words.
