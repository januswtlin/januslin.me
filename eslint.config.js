// ESLint flat config (T07, #57). Covers the JavaScript in scripts/ and tests/ and the
// root config files; T09 extends it to src/ without rules the vendored theme fails wholesale.
import js from "@eslint/js";
import globals from "globals";

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
];
