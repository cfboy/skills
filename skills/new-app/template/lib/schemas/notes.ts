import { z } from "zod";

/**
 * Shared by the form and the action, so the browser and the server check the
 * same rule. Not in actions/notes.ts: a "use server" file may export only
 * async functions.
 */
export const noteBody = z.object({
  body: z.string().trim().min(1, "Escribe la nota.").max(2000, "Máximo 2000 caracteres."),
});
