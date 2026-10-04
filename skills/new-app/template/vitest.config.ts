import path from "node:path";

import { defineConfig } from "vitest/config";

/**
 * Unit tests for pure logic: time arithmetic, parsing, permission tables.
 * Anything that needs the database is a script under scripts/ (rls-check),
 * because it needs the local Supabase stack and real tokens.
 */
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  test: {
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
  },
});
