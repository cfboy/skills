import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated, not hand-edited.
    "lib/database.types.ts",
    // The git worktrees agents work in, each a full copy of the repo.
    ".claude/worktrees/**",
  ]),
  {
    // TanStack Store compares selector snapshots with ===, so a selector that
    // builds a fresh array or object every call never compares equal. React's
    // useSyncExternalStoreWithSelector then spins and throws, and a production
    // build renders that subtree as nothing rather than showing an error: a
    // form whose submit button simply does not exist, undetected by lint, tsc
    // and the dev server alike. Select one primitive per Subscribe.
    files: ["components/**/*.tsx", "app/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='selector'] ArrowFunctionExpression > ArrayExpression",
          message:
            "A Subscribe selector must return a primitive — an array is a new reference every call and makes the subtree throw in production. Use one form.Subscribe per value.",
        },
        {
          selector: "JSXAttribute[name.name='selector'] ArrowFunctionExpression > ObjectExpression",
          message:
            "A Subscribe selector must return a primitive — an object is a new reference every call and makes the subtree throw in production. Use one form.Subscribe per value.",
        },
      ],
    },
  },
  {
    // The service-role client bypasses RLS. It exists for scripts (seeding,
    // fixtures, maintenance) and nothing else. An app file that reaches for it
    // silently disables every policy protecting the data.
    files: ["app/**/*.{ts,tsx}", "actions/**/*.ts", "components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/lib/supabase/admin", "@/lib/supabase/admin"],
              message:
                "The service-role client bypasses RLS and must never be reachable from the app. Use @/lib/supabase/server, which runs as the signed-in user.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
