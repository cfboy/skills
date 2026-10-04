import { NotesView } from "@/components/notes/notes-view";
import { requireSession } from "@/lib/auth/session";
import { membershipsOf, requireOrg } from "@/lib/org-scope";

/**
 * Single-organization app: the organization is the deployment, so it is never
 * in the URL. The data model and RLS are the same as a multi-tenant app — the
 * token still names the organization, and current_org_id() still checks the
 * membership — so turning this into several organizations later is a routing
 * change, not a security one.
 */
export default async function HomePage() {
  const session = await requireSession();
  const [org] = await membershipsOf(session.userId);

  if (!org) {
    return (
      <div className="space-y-2">
        <h1 className="page-title">Todavía no tienes acceso</h1>
        <p className="text-muted-foreground">
          Tu cuenta existe, pero nadie te ha dado acceso todavía. Pídeselo a quien te invitó.
        </p>
      </div>
    );
  }

  return <NotesView scope={await requireOrg(org.id)} />;
}
