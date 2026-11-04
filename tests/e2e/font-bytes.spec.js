// Font bytes transferred on the first load of the fixture post (T09, #58). The original fonts
// are kept (ADR-0001), so this is a budget: it fails above FONT_BUDGET_BYTES. A higher budget
// needs the author's acceptance of the measured value, recorded in the PR that raises it.
import { FIXTURE_POST } from "../dist/site.js";
import { expect, test } from "./fixtures.js";

// 400 KB as the task states it (#58), in decimal bytes.
const FONT_BUDGET_BYTES = 400_000;

test("font bytes on first load of the fixture post stay within the budget", async ({
  page,
}, testInfo) => {
  /** @type {Promise<{ url: string, bytes: number }>[]} */
  const pending = [];
  page.on("requestfinished", (request) => {
    if (request.resourceType() !== "font") return;
    pending.push(
      request.sizes().then((s) => ({
        url: new URL(request.url()).pathname,
        bytes: s.responseBodySize + s.responseHeadersSize,
      })),
    );
  });
  await page.goto(FIXTURE_POST);
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");
  const fonts = await Promise.all(pending);
  const total = fonts.reduce((sum, f) => sum + f.bytes, 0);
  const report = [
    `font bytes on first load of ${FIXTURE_POST}: ${total} (${(total / 1000).toFixed(1)} KB), budget ${FONT_BUDGET_BYTES}`,
    ...fonts.map((f) => `  ${f.bytes}\t${f.url}`),
  ].join("\n");
  console.log(report);
  testInfo.annotations.push({ type: "font-bytes", description: String(total) });
  await testInfo.attach("font-bytes.txt", { body: report, contentType: "text/plain" });
  expect(fonts.length).toBeGreaterThan(0);
  expect(total).toBeLessThanOrEqual(FONT_BUDGET_BYTES);
});
