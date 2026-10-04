/**
 * Development logins: one organization with an owner and a member, and a
 * platform admin. Idempotent — run it again after `pnpm db:reset`, which wipes
 * them. Refuses to run against anything but the local stack.
 *
 *   pnpm dev:accounts
 */
import "./load-env";

import { auth } from "@/lib/auth/auth";

import { announce, resolveTarget } from "./env";
import { ensureMember, ensureOrg, ensureUser, giveAccount, setPlatformRole } from "./lib/people";

const PASSWORD = "desarrollo-local";

const target = resolveTarget({ requireDbUrl: true });
if (!target.isLocal) {
  console.error("dev:accounts makes accounts with a known password: local stack only.");
  process.exit(1);
}
announce(target);

async function main() {
  // Make sure BetterAuth's context is ready before the helpers ask for it.
  await auth.$context;

  const owner = await ensureUser({ email: "owner@example.test", name: "Olivia Owner" });
  const member = await ensureUser({ email: "member@example.test", name: "Mateo Member" });
  const platform = await ensureUser({ email: "platform@example.test", name: "Paula Platform" });

  for (const id of [owner, member, platform]) await giveAccount(id, PASSWORD);
  await setPlatformRole(platform, "admin");

  const org = await ensureOrg({ slug: "demo", name: "Organización demo", ownerId: owner });
  await ensureMember({ orgId: org, userId: member, role: "member" });

  console.log("Development logins (password for all: %s)\n", PASSWORD);
  console.log("  owner@example.test     owner of Organización demo");
  console.log("  member@example.test    member of Organización demo");
  console.log("  platform@example.test  platform admin, in no organization\n");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
