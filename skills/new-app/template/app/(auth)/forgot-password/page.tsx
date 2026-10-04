import type { Metadata } from "next";

import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Recuperar contraseña · __APP_NAME__" };

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="page-title">Recuperar contraseña</h1>
        <p className="text-muted-foreground text-sm">
          Te enviaremos un enlace para elegir una contraseña nueva.
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
