import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // tests/dist/ checks the built site: `pnpm build` runs before `pnpm test` in `pnpm verify`.
    include: ["tests/unit/**/*.test.js", "tests/dist/**/*.test.js"],
  },
});
