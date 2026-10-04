import type { Metadata } from "next";
import Link from "next/link";

import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Elegir contraseña · __APP_NAME__" };

/**
 * Where both an invitation and a password reset land: BetterAuth's reset link
 * carries the token, and setting a password is the same act either way.
 */
export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { token, error } = await searchParams;

  if (typeof token !== "string" || error) {
    return (
      <div className="space-y-4">
        <h1 className="page-title">El enlace ya no sirve</h1>
        <p className="text-muted-foreground text-sm">
          Los enlaces sirven una sola vez y caducan en tres días. Pide uno nuevo.
        </p>
        <Link href="/forgot-password" className="tap-target text-sm underline underline-offset-4">
          Pedir otro enlace
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="page-title">Elige tu contraseña</h1>
        <p className="text-muted-foreground text-sm">Al menos 10 caracteres.</p>
      </div>
      <ResetPasswordForm token={token} />
    </div>
  );
}
