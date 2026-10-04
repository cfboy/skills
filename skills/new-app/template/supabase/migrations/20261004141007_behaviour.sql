-- ===========================================================================
-- Everything the schema migration cannot express.
--
-- The tables, columns, foreign keys, checks and indexes come from
-- db/schema/*.ts via drizzle-kit. What lives here is hand-written on purpose:
--
--   1. identity            — who is asking, and in which organization
--   2. updated_at          — kept by the database, not by every writer
--   3. Row Level Security  — the security boundary
--
-- Why policies are here and not in Drizzle: drizzle-kit drops the USING and
-- WITH CHECK expressions from `FOR ALL` policies on introspection, so a
-- generated policy can come back as "any signed-in account may write any
-- row". The security boundary is not generated code.
--
-- scripts/rls-check.ts is part of this migration, not optional tooling: RLS
-- failures are silent. Every policy added here gets an assertion there.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 1. Identity
--
-- auth.uid() is the `sub` of the token the app mints for a BetterAuth session
-- (lib/supabase/sign-token.ts): the uuid of the public."user" row.
--
-- These helpers are SECURITY DEFINER so a policy can ask "which organization
-- and which role" without that question itself being filtered by the RLS on
-- member — the recursion that would otherwise make every policy empty. Each
-- one only ever answers about the caller.
-- ---------------------------------------------------------------------------

-- The organization this request acts in: the token's org_id claim, but only if
-- the caller is a member there. A claim for someone else's organization scopes
-- the request to nothing rather than to their data. There is no fallback to
-- "the caller's only membership": a request that names no organization belongs
-- to none, so nothing tenant-owned is visible to it.
create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.organization_id
  from public.member m
  where m.user_id = (select auth.uid())
    and m.organization_id = nullif(
      nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'org_id',
      ''
    )::uuid;
$$;

-- The caller's role in that organization: owner, admin or member. Null for
-- anyone who is not a member of it. The same values lib/auth/permissions.ts
-- keys its roles by.
create or replace function public.current_org_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select m.role
  from public.member m
  where m.user_id = (select auth.uid())
    and m.organization_id = public.current_org_id();
$$;

-- Runs the organization: may change anyone's records in it.
create or replace function public.is_org_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_org_role() in ('owner', 'admin'), false);
$$;

-- Whether the caller shares any organization with this person. Guards the
-- columns of public."user" the Data API allows (a colleague's name).
create or replace function public.shares_org_with(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.member mine
    join public.member theirs on theirs.organization_id = mine.organization_id
    where mine.user_id = (select auth.uid())
      and theirs.user_id = p_user_id
  );
$$;

revoke execute on function
  public.current_org_id(),
  public.current_org_role(),
  public.is_org_admin(),
  public.shares_org_with(uuid)
from public, anon;


-- ---------------------------------------------------------------------------
-- 2. updated_at
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger note_set_updated_at
  before update on public.note
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- 3. Row Level Security
--
-- Every table in public is reachable through the Data API, so every table has
-- RLS on — BetterAuth's included. A table with RLS on and no policy is closed
-- to everyone but the database owner, which is what BetterAuth's private
-- tables want: the app reads them over the direct connection, never the API.
-- ---------------------------------------------------------------------------

alter table public."user" enable row level security;
alter table public.session enable row level security;
alter table public.account enable row level security;
alter table public.verification enable row level security;
alter table public.organization enable row level security;
alter table public.member enable row level security;
alter table public.invitation enable row level security;
alter table public.passkey enable row level security;
alter table public.rate_limit enable row level security;
alter table public.note enable row level security;

-- Credentials, sessions and tokens never leave through the API, whatever a
-- future policy says.
revoke all on public.session, public.account, public.verification, public.passkey,
  public.rate_limit, public.invitation
from anon, authenticated;

-- People: who someone is, never how they sign in or whether they are banned.
-- Column grants, so `select *` on user fails loudly instead of leaking.
revoke all on public."user" from anon, authenticated;
grant select (id, name, email, image) on public."user" to authenticated;

create policy user_select on public."user"
  for select to authenticated
  using (id = (select auth.uid()) or public.shares_org_with(id));

-- Organizations and memberships are written by BetterAuth over the direct
-- connection. Through the API they are read-only, and only the request's own.
revoke insert, update, delete on public.organization, public.member from anon, authenticated;

create policy organization_select on public.organization
  for select to authenticated
  using (id = public.current_org_id());

create policy member_select on public.member
  for select to authenticated
  using (organization_id = public.current_org_id());

-- note: the example tenant table. Everyone in the organization reads its
-- notes; you write in your own name; you change your own, and whoever runs the
-- organization changes any. org_id is checked on every write, so a row can
-- neither be created in nor moved to another organization.
create policy note_select on public.note
  for select to authenticated
  using (org_id = public.current_org_id());

create policy note_insert on public.note
  for insert to authenticated
  with check (org_id = public.current_org_id() and created_by = (select auth.uid()));

create policy note_update on public.note
  for update to authenticated
  using (
    org_id = public.current_org_id()
    and (created_by = (select auth.uid()) or public.is_org_admin())
  )
  with check (org_id = public.current_org_id());

create policy note_delete on public.note
  for delete to authenticated
  using (
    org_id = public.current_org_id()
    and (created_by = (select auth.uid()) or public.is_org_admin())
  );
