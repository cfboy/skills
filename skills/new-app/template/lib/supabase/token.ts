import "server-only";

/** The app's entry to token signing. See lib/supabase/sign-token.ts. */
export { TOKEN_TTL_SECONDS, mintSupabaseToken } from "./sign-token";
