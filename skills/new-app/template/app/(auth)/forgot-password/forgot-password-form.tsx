"use client";

import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";

const schema = z.object({ email: z.email("Escribe un correo válido.") });

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);

  const form = useForm({
    defaultValues: { email: "" },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      // The answer is the same whether or not the address has an account.
      await authClient.requestPasswordReset({ email: value.email, redirectTo: "/reset-password" });
      setSent(true);
    },
  });

  if (sent) {
    return (
      <div className="space-y-4">
        <p className="text-sm">
          Si ese correo tiene una cuenta, te llegará un enlace en unos minutos. Revisa también el
          correo no deseado.
        </p>
        <Link href="/login" className="tap-target text-sm underline underline-offset-4">
          Volver a entrar
        </Link>
      </div>
    );
  }

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field name="email">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Correo</Label>
            <Input
              size="lg"
              id={field.name}
              type="email"
              autoComplete="email"
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              aria-invalid={field.state.meta.errors.length > 0}
            />
            {field.state.meta.errors[0] && (
              <p className="text-destructive text-sm">{field.state.meta.errors[0].message}</p>
            )}
          </div>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Enviando…" : "Enviar enlace"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
