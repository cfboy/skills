import { z } from "zod";

/**
 * The server's environment, validated once and then trusted.
 *
 * Read through serverEnv() rather than process.env.X! so a missing or malformed
 * variable fails with its name, instead of as `undefined` somewhere downstream:
 * a Pool with no connection string, a token signed with nothing, an email that
 * never leaves. instrumentation.ts calls it at boot so the server refuses to
 * start rather than failing on the first request that needs the value.
 */
const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  DATABASE_URL: z.url(),
  SUPABASE_JWT_SIGNING_KEY: z.string().min(1),
  BETTER_AUTH_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32, "must be at least 32 characters"),
  SMTP_URL: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let parsed: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (parsed) return parsed;

  const result = serverSchema.safeParse(process.env);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `The environment is incomplete:\n${problems}\n\n` +
        "Locally, `pnpm env:local` writes .env.local from the running Supabase stack. " +
        "See .env.example for what each variable is.",
    );
  }

  parsed = result.data;
  return parsed;
}

/**
 * What the browser may know. Next inlines NEXT_PUBLIC_* only where they are
 * spelled out literally, so each one is read by name here, not by iterating.
 */
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
};
