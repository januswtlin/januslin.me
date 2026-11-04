// Playwright tests over the built site (T09, #58). `pnpm build` first; each worker serves
// dist/ itself on a free port (tests/e2e/fixtures.js). Visual baselines are recorded on Linux
// in the sandbox, the same platform as CI (docs/agents/sandbox.md).
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  outputDir: "test-results",
  snapshotPathTemplate: "{testDir}/__screenshots__/{testFilePath}/{arg}-{platform}{ext}",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"]],
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0, threshold: 0.2, animations: "disabled" },
  },
  use: {
    ...devices["Desktop Chrome"],
    trace: "retain-on-failure",
  },
});
