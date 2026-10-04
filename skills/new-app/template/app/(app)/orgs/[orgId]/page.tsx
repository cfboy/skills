import type { Metadata } from "next";

import { NotesView } from "@/components/notes/notes-view";
import { requireOrg } from "@/lib/org-scope";

export async function generateMetadata({ params }: PageProps<"/orgs/[orgId]">): Promise<Metadata> {
  const { orgId } = await params;
  const scope = await requireOrg(orgId);
  return { title: `${scope.org.name} · __APP_NAME__` };
}

/** An organization's home. Every page inside one lives under /orgs/[orgId]. */
export default async function OrgPage({ params }: PageProps<"/orgs/[orgId]">) {
  const { orgId } = await params;
  return <NotesView scope={await requireOrg(orgId)} />;
}
