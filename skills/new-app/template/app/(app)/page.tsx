import Link from "next/link";
import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/session";
import { membershipsOf } from "@/lib/org-scope";

/**
 * Home is a fork, not a page: with one organization there is nothing to
 * choose, so it goes straight there. The organization is always in the URL
 * from then on.
 */
export default async function HomePage() {
  const session = await requireSession();
  const orgs = await membershipsOf(session.userId);

  if (orgs.length === 1) redirect(`/orgs/${orgs[0].id}`);

  if (orgs.length === 0) {
    return (
      <div className="space-y-2">
        <h1 className="page-title">Todavía no tienes acceso</h1>
        <p className="text-muted-foreground">
          Tu cuenta existe, pero nadie te ha añadido a una organización. Pídeselo a quien te invitó.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="page-title">¿Dónde vas a trabajar?</h1>
      <ul className="divide-y rounded-lg border">
        {orgs.map((org) => (
          <li key={org.id}>
            <Link href={`/orgs/${org.id}`} className="hover:bg-muted block px-4 py-3">
              {org.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
