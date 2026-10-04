import { sql } from "drizzle-orm";
import { check, index, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { organization, timestamps, user } from "./auth";

/**
 * The example domain table: a note inside an organization. It exists to show
 * the shape every tenant-owned table takes, and is meant to be replaced.
 *
 *  - `org_id` on every row, so each policy is one indexed comparison against
 *    current_org_id() rather than a join. `restrict`: deleting an organization
 *    must never quietly take its records with it.
 *  - `created_by` defaults to auth.uid(), the signed-in person the request's
 *    token names, and the insert policy checks it is them.
 *  - The policies themselves are hand-written SQL in the behaviour migration,
 *    never generated (see AGENTS.md), and scripts/rls-check.ts asserts them.
 */
export const note = pgTable(
  "note",
  {
    id: uuid().primaryKey().defaultRandom(),
    orgId: uuid()
      .notNull()
      .references(() => organization.id, { onDelete: "restrict" }),
    body: text().notNull(),
    createdBy: uuid()
      .notNull()
      .default(sql`auth.uid()`)
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => [
    index("note_org_id_idx").on(t.orgId),
    check("note_body_check", sql`btrim(body) <> '' and length(body) <= 2000`),
  ],
);
