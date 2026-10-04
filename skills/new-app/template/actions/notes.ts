"use server";

import { z } from "zod";

import type { ActionResult } from "@/lib/action-result";
import { orgScope } from "@/lib/org-scope";
import { noteBody } from "@/lib/schemas/notes";

/**
 * The example actions. Every action has the same shape:
 *
 *  1. parse the input with zod — it arrived over the network, so it is unknown;
 *  2. resolve the organization it names with orgScope, which also says what
 *     the person may do there;
 *  3. write through scope.supabase, as the person, so RLS has the last word;
 *  4. return an ActionResult: expected failures are values, not throws.
 */

const addSchema = noteBody.extend({ orgId: z.uuid() });

export async function addNote(input: unknown): Promise<ActionResult> {
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Datos inválidos.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const scope = await orgScope(parsed.data.orgId);
  if (!scope) return { ok: false, message: "Tu sesión expiró o ya no tienes acceso." };
  if (!scope.can({ note: ["create"] })) {
    return { ok: false, message: "No puedes escribir notas aquí." };
  }

  const { error } = await scope.supabase
    .from("note")
    .insert({ org_id: scope.org.id, body: parsed.data.body });
  if (error) return { ok: false, message: "No se pudo guardar la nota. Inténtalo otra vez." };

  return { ok: true };
}

const deleteSchema = z.object({ orgId: z.uuid(), noteId: z.uuid() });

export async function deleteNote(input: unknown): Promise<ActionResult> {
  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Datos inválidos." };

  const scope = await orgScope(parsed.data.orgId);
  if (!scope) return { ok: false, message: "Tu sesión expiró o ya no tienes acceso." };

  // Whose notes this person may delete is RLS's answer (their own, or any if
  // they run the organization). A refused delete matches no rows rather than
  // erroring, so ask for the row back and read its absence as the refusal.
  const { data, error } = await scope.supabase
    .from("note")
    .delete()
    .eq("id", parsed.data.noteId)
    .select("id");
  if (error) return { ok: false, message: "No se pudo borrar la nota. Inténtalo otra vez." };
  if (data.length === 0) return { ok: false, message: "Sólo puedes borrar tus propias notas." };

  return { ok: true };
}
