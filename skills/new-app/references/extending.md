# Extending the template

Patterns most apps need after the first table. Each keeps the rule
that the person's token, and so RLS, decides.

## A client-side read (typeahead, picker)

Pages read on the server. For a read that must happen as the person types,
use the browser client, scoped to the page's organization:

```ts
"use client";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient(orgId); // token from /api/supabase-token?org=…
const { data } = await supabase.rpc("search_people", { p_query: query });
```

Wrap it in `useQuery` with the query in the key. Writes still go through
Server Actions.

## Logic that belongs in the database

Searches, "where is X now", anything that joins many tables: write a SQL
function in a custom migration (`language sql stable`, `security invoker` so
RLS still applies, `set search_path = ''`), call it with `scope.supabase.rpc`,
and run `pnpm db:types` so its arguments are typed.

## Invitations

`lib/auth/password-link.ts` emails a set-password link and throws if the
email did not leave (BetterAuth itself swallows that). Adding a person is:
create the user (`auth.api.createUser`), add the membership
(`auth.api.addMember`), then `sendPasswordLink`. Do it in a Server Action that
checks `scope.can({ member: ["create"] })`. These go through BetterAuth's
API, not supabase-js: membership is identity, which the API exposes read-only.

## Platform admin screens

The admin plugin's `user.role = "admin"` is above every organization. Guard a
`/platform` area with `session.platformRole === "admin"` and use
`auth.api.createOrganization` / `auth.api.listUsers`. Entering an
organization should mean becoming a member of it — visible to that
organization — not reading around RLS.

## Storage

Create a private bucket in a migration, with `storage.objects` policies that
compare the first path segment to `current_org_id()::text`. Upload through a
Route Handler that checks `orgScope`, and serve with signed URLs.

## A skill to drive the app

Once the app has real flows, give it a project skill under
`verify-<app>` (in `.agents/skills/` or your agent's skills directory) that starts it, signs in as each dev role and
walks the flows that matter with Playwright, saving screenshots as evidence.
