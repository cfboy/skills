/**
 * Asserts that row level security does what the behaviour migrations claim.
 *
 * RLS failures are SILENT. A missing policy does not raise an error — it quietly
 * returns rows to someone who should not see them, and a wrong JWT claim
 * returns nothing at all instead of an error. "We wrote the policies" is not
 * evidence. This script is.
 *
 * Every identity talks to Supabase with a token from mintSupabaseToken — the
 * same function the app signs with — so this checks the path production takes,
 * not a copy of it. CI runs it against a database migrated from scratch.
 *
 * Every new tenant table adds its assertions here, in the same pull request as
 * its policies.
 *
 *   pnpm db:rls-check
 */
import "./load-env";

import { type SupabaseClient, createClient } from "@supabase/supabase-js";
import { inArray } from "drizzle-orm";

import { db } from "@/db";
import { note, organization, user } from "@/db/schema";
import type { OrgRole } from "@/lib/auth/permissions";
import type { Database } from "@/lib/database.types";
import { mintSupabaseToken } from "@/lib/supabase/sign-token";

import { resolveTarget } from "./env";
import { ensureMember, ensureOrg, ensureUser } from "./lib/people";

const target = resolveTarget({ requireDbUrl: true });
if (!target.isLocal) {
  console.error("rls-check creates and deletes test data: local stack only.");
  process.exit(1);
}

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  if (ok) {
    console.log(`  ok    ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

type Client = SupabaseClient<Database>;

/** A client acting as `userId` in `orgId` — exactly what the app builds. */
async function as(
  person: { id: string; email: string },
  orgId: string | null,
  role: OrgRole | null,
): Promise<Client> {
  const token = await mintSupabaseToken({ userId: person.id, email: person.email, orgId, role });
  return createClient<Database>(target.apiUrl, target.publishableKey, {
    accessToken: async () => token,
  });
}

const anon = createClient<Database>(target.apiUrl, target.publishableKey);

const EMAILS = {
  alice: "rls-alice@example.test",
  bob: "rls-bob@example.test",
  carol: "rls-carol@example.test",
};
const SLUGS = ["rls-org-a", "rls-org-b"];

async function teardown() {
  // The service connection bypasses RLS; fixtures are not under test.
  const orgs = await db
    .select({ id: organization.id })
    .from(organization)
    .where(inArray(organization.slug, SLUGS));
  if (orgs.length > 0) {
    const ids = orgs.map((o) => o.id);
    await db.delete(note).where(inArray(note.orgId, ids));
    await db.delete(organization).where(inArray(organization.id, ids));
  }
  await db.delete(user).where(inArray(user.email, Object.values(EMAILS)));
}

async function main() {
  await teardown();

  // Two organizations. Alice owns A, Bob is a member of A, Carol owns B.
  const alice = {
    id: await ensureUser({ email: EMAILS.alice, name: "Alice" }),
    email: EMAILS.alice,
  };
  const bob = { id: await ensureUser({ email: EMAILS.bob, name: "Bob" }), email: EMAILS.bob };
  const carol = {
    id: await ensureUser({ email: EMAILS.carol, name: "Carol" }),
    email: EMAILS.carol,
  };
  const orgA = await ensureOrg({ slug: SLUGS[0], name: "RLS A", ownerId: alice.id });
  const orgB = await ensureOrg({ slug: SLUGS[1], name: "RLS B", ownerId: carol.id });
  await ensureMember({ orgId: orgA, userId: bob.id, role: "member" });

  const aliceA = await as(alice, orgA, "owner");
  const bobA = await as(bob, orgA, "member");
  const carolB = await as(carol, orgB, "owner");

  console.log("\nnote: writing");
  {
    const { error } = await aliceA.from("note").insert({ org_id: orgA, body: "Alice in A" });
    check("an owner writes a note in their organization", !error, error?.message);
  }
  {
    const { error } = await bobA.from("note").insert({ org_id: orgA, body: "Bob in A" });
    check("a member writes a note in their organization", !error, error?.message);
  }
  {
    const { error } = await carolB.from("note").insert({ org_id: orgB, body: "Carol in B" });
    check("the other organization writes its own note", !error, error?.message);
  }
  {
    const { error } = await bobA.from("note").insert({ org_id: orgB, body: "Bob into B" });
    check("nobody writes into an organization they are not in", error !== null);
  }
  {
    const { error } = await bobA
      .from("note")
      .insert({ org_id: orgA, body: "Bob as Alice", created_by: alice.id });
    check("nobody writes a note in someone else's name", error !== null);
  }

  console.log("\nnote: reading");
  {
    const { data } = await bobA.from("note").select("body, org_id");
    check(
      "a member reads every note of their organization, and only those",
      data?.length === 2 && data.every((n) => n.org_id === orgA),
      JSON.stringify(data),
    );
  }
  {
    // The claim names an organization Carol is not in: current_org_id() must
    // refuse it rather than believe it.
    const carolClaimsA = await as(carol, orgA, "owner");
    const { data } = await carolClaimsA.from("note").select("id");
    check("a token claiming someone else's organization reads nothing", data?.length === 0);
  }
  {
    const noOrg = await as(bob, null, null);
    const { data } = await noOrg.from("note").select("id");
    check("a token naming no organization reads no notes", data?.length === 0);
  }
  {
    const { data } = await anon.from("note").select("id");
    check("anon reads nothing", (data ?? []).length === 0);
  }

  console.log("\nnote: changing and deleting");
  {
    const { data } = await bobA
      .from("note")
      .update({ body: "Bob edits Alice" })
      .eq("body", "Alice in A")
      .select("id");
    check("a member cannot edit someone else's note", data?.length === 0);
  }
  {
    const { data } = await bobA
      .from("note")
      .update({ org_id: orgB })
      .eq("body", "Bob in A")
      .select("id");
    check("nobody moves a note into another organization", (data ?? []).length === 0);
  }
  {
    const { data } = await aliceA.from("note").delete().eq("body", "Bob in A").select("id");
    check("an owner deletes anyone's note in their organization", data?.length === 1);
  }

  console.log("\nBetterAuth's tables");
  {
    const { data } = await bobA.from("user").select("id, name");
    const ids = new Set((data ?? []).map((u) => u.id));
    check(
      "people see themselves and who shares an organization with them, nobody else",
      ids.has(alice.id) && ids.has(bob.id) && !ids.has(carol.id),
      JSON.stringify(data),
    );
  }
  for (const table of ["session", "account", "verification", "rate_limit", "passkey"] as const) {
    const { data } = await bobA.from(table).select("*").limit(1);
    check(`${table} is unreadable through the API`, (data ?? []).length === 0);
  }
  {
    const { data } = await bobA.from("member").select("organization_id");
    check(
      "memberships are visible only within the request's organization",
      (data ?? []).length > 0 && data!.every((m) => m.organization_id === orgA),
      JSON.stringify(data),
    );
  }

  await teardown();
  console.log(
    failures === 0 ? "\nAll RLS checks passed.\n" : `\n${failures} RLS check(s) FAILED.\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
