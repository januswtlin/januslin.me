// ESLint flat config. T07 (#57) covered the JavaScript in scripts/ and tests/ and the root
// config files; T09 (#58) extends it to src/ and the TypeScript config files with the
// recommended JavaScript, TypeScript, and Astro rules, which the vendored Retypeset code
// passes as written (its own style was @antfu/eslint-config; formatting stays its own).
import js from "@eslint/js";
import astro from "eslint-plugin-astro";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "**/node_modules/",
      "drafts/",
      ".claude/",
      "dist/",
      ".astro/",
      ".wrangler/",
      "coverage/",
      ".pnpm-store/",
      "test-results/",
      "playwright-report/",
    ],
  },
  {
    files: ["scripts/**/*.js", "tests/**/*.js", "*.config.js"],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node },
    },
  },
  // The site: src/, the Astro and UnoCSS configs, and the theme's TypeScript scripts.
  ...[js.configs.recommended, ...tseslint.configs.recommended].map((config) => ({
    ...config,
    files: ["src/**/*.{js,mjs,ts}", "*.config.ts", "scripts/**/*.ts"],
  })),
  ...astro.configs["flat/recommended"],
  {
    files: ["src/**/*.{js,mjs,ts,astro}", "*.config.ts", "scripts/**/*.ts"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // Off for the vendored theme, which follows its own conventions; each would only
      // rewrite working upstream code:
      // `cond ? a++ : b++` counters in scripts/apply-lqip.ts
      "@typescript-eslint/no-unused-expressions": "off",
      // `\-` inside a character class (src/content.config.ts)
      "no-useless-escape": "off",
      // Astro's generated `/// <reference path="../.astro/types.d.ts" />` (src/env.d.ts)
      "@typescript-eslint/triple-slash-reference": "off",
      // empty interfaces that merge UnoCSS attributify types into Astro's JSX (src/types/)
      "@typescript-eslint/no-empty-object-type": "off",
      // the generic memoize helper (src/utils/cache.ts)
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Playwright tests run code in the page through page.evaluate.
  {
    files: ["tests/e2e/**/*.js"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
];
