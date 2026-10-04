/**
 * Runs once when the server boots. Validating the environment here means a
 * missing variable stops the server with a list of what is missing, instead of
 * surfacing later as a confusing failure inside whichever request needed it.
 *
 * Not at import time: `next build` imports route modules to collect page data,
 * and a build machine has no business holding the database password.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { serverEnv } = await import("@/lib/env");
    serverEnv();
  }
}
