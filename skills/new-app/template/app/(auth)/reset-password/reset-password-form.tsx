"use client";

import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";

const schema = z.object({
  password: z.string().min(10, "Al menos 10 caracteres."),
});

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { password: "" },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      setError(null);
      const result = await authClient.resetPassword({ newPassword: value.password, token });
      if (result.error) return setError("El enlace ya no sirve. Pide uno nuevo.");
      toast.success("Contraseña guardada. Ya puedes entrar.");
      router.push("/login");
    },
  });

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field name="password">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Contraseña nueva</Label>
            <Input
              size="lg"
              id={field.name}
              type="password"
              autoComplete="new-password"
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
            {isSubmitting ? "Guardando…" : "Guardar contraseña"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
