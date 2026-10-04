import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";
import { requireSession } from "@/lib/auth/session";

/** Everything behind sign-in. The guard lives here, once, for every page under it. */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await requireSession();

  return (
    <>
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="font-medium">
            __APP_NAME__
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground hidden text-sm sm:inline">{session.name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}
