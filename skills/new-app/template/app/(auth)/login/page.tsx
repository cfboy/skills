import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar · __APP_NAME__" };

export default async function LoginPage() {
  if (await getSession()) redirect("/");

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="page-title">__APP_NAME__</h1>
        <p className="text-muted-foreground text-sm">Entra con tu correo y contraseña.</p>
      </div>
      <LoginForm />
    </div>
  );
}
