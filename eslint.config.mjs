import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // User content is rendered as text, never as HTML (spec §42).
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts}"],
    rules: { "react/no-danger": "error" },
  },
  {
    // Every query on user-owned data is scoped by userId. findUnique can only match on unique
    // keys, so a lookup by ID alone would skip the ownership check; use findFirst({ id, userId }).
    files: ["src/server/**/*.ts", "src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.property.name=/^findUnique(OrThrow)?$/]",
          message:
            "Use findFirst({ where: { id, userId } }) so the query is scoped to its owner. If the unique key already includes userId, disable this line with a reason.",
        },
      ],
    },
  },
  {
    // Playwright fixtures take a `use` callback that is not a React hook.
    files: ["tests/e2e/**"],
    rules: { "react-hooks/rules-of-hooks": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/generated/**",
    ".agents/**",
    ".claude/**",
    "docs/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
