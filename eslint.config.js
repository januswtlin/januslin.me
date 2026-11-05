// ESLint flat config. T07 (#57) covered the JavaScript in scripts/ and tests/ and the root
// config files; T09 (#58) extends it to src/ and the TypeScript config files with the
// recommended JavaScript, TypeScript, and Astro rules. The vendored Sumi code passes them as
// written; its formatting stays its own (.prettierignore).
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
  // The site: src/ and the Astro config.
  ...[js.configs.recommended, ...tseslint.configs.recommended].map((config) => ({
    ...config,
    files: ["src/**/*.{js,mjs,ts}", "*.config.ts", "scripts/**/*.ts", "tests/**/*.ts"],
  })),
  ...astro.configs["flat/recommended"],
  {
    files: ["src/**/*.{js,mjs,ts,astro}", "*.config.ts", "scripts/**/*.ts", "tests/**/*.ts"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  // Rules off for single vendored files only, where the upstream code follows its own
  // convention and a fix would only rewrite working code:
  {
    // the theme-pin script's deliberate `catch {}` (private mode: no stored theme)
    files: ["src/components/BaseHead.astro", "src/components/BaseHead.astro/**"],
    rules: { "no-empty": "off" },
  },
  // Playwright tests run code in the page through page.evaluate.
  {
    files: ["tests/e2e/**/*.js"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
];
