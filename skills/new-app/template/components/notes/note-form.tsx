"use client";

import { useForm } from "@tanstack/react-form";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addNote } from "@/actions/notes";
import { noteBody } from "@/lib/schemas/notes";
import { useServerAction } from "@/lib/use-server-action";

/**
 * The write path every form takes: TanStack Form validates with the same zod
 * schema the action re-checks on the server, and useServerAction runs the
 * action as a mutation, toasts the outcome and refreshes the server components.
 */
export function NoteForm({ orgId }: { orgId: string }) {
  const save = useServerAction(addNote, { success: "Nota guardada." });

  const form = useForm({
    defaultValues: { body: "" },
    validators: { onSubmit: noteBody },
    onSubmit: async ({ value, formApi }) => {
      await save.mutateAsync({ orgId, body: value.body });
      formApi.reset();
    },
  });

  return (
    <form
      noValidate
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field name="body">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Nota nueva</Label>
            <Textarea
              id={field.name}
              rows={3}
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
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Guardando…" : "Guardar"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
