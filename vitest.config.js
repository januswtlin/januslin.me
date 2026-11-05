import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // tests/dist/ checks the built fixture site: `pnpm verify` runs
    // `CONTENT_DIR=tests/fixtures/content pnpm build` before `pnpm test`. tests/content/ runs
    // `pnpm validate`, `astro build`, and the dev servers on the fixture sets (T10, #59).
    include: ["tests/unit/**/*.test.js", "tests/content/**/*.test.js", "tests/dist/**/*.test.js"],
  },
});
