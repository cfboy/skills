/**
 * What every Server Action returns.
 *
 * Actions report expected failures ("ese correo ya existe") as values rather
 * than throwing, so the message survives the network boundary intact and the
 * client decides how to show it. useServerAction turns a failure into a thrown
 * Error for TanStack Query.
 */
export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };
