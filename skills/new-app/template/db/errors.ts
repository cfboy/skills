import { DatabaseError } from "pg";

/**
 * The constraint a failed statement violated, or null when it failed for any
 * other reason.
 *
 * Postgres names the constraint on the error itself, so a caller can say "that
 * identifier is taken" because the database said exactly that — not because
 * something went wrong and a taken identifier was the likeliest guess. Drizzle
 * wraps the driver's error, so both it and its cause are checked.
 */
export function violatedConstraint(error: unknown): string | null {
  for (let e: unknown = error; e instanceof Error; e = e.cause) {
    if (e instanceof DatabaseError && e.constraint) return e.constraint;
  }
  return null;
}
