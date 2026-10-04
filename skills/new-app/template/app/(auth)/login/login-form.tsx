"use client";

import { useForm } from "@tanstack/react-form";
import { KeyRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";

const schema = z.object({
  email: z.email("Escribe un correo válido."),
  password: z.string().min(1, "Escribe tu contraseña."),
});

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const enter = () => {
    router.push("/");
    router.refresh();
  };

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      setError(null);
      const { error } = await authClient.signIn.email(value);
      // One message for every failure: whether an address has an account is
      // not something the login page should reveal.
      if (error) return setError("Correo o contraseña incorrectos.");
      enter();
    },
  });

  async function signInWithPasskey() {
    setError(null);
    const result = await authClient.signIn.passkey();
    if (result?.error) return setError("No se pudo entrar con la llave de acceso.");
    enter();
  }

  return (
    <div className="space-y-4">
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
                autoComplete="username webauthn"
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

        <form.Field name="password">
          {(field) => (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <Label htmlFor={field.name}>Contraseña</Label>
                <Link
                  href="/forgot-password"
                  className="tap-target text-muted-foreground text-sm underline-offset-4 hover:underline"
                >
                  ¿La olvidaste?
                </Link>
              </div>
              <Input
                size="lg"
                id={field.name}
                type="password"
                autoComplete="current-password webauthn"
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

        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}

        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Entrando…" : "Entrar"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <Button variant="outline" size="lg" className="w-full" onClick={signInWithPasskey}>
        <KeyRound aria-hidden />
        Entrar con llave de acceso
      </Button>
    </div>
  );
}
