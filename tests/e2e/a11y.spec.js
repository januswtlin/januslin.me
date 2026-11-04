// axe-core finds no serious or critical accessibility violation on / and the fixture post
// (T09, #58).
import AxeBuilder from "@axe-core/playwright";
import { FIXTURE_POST } from "../dist/site.js";
import { expect, test } from "./fixtures.js";

for (const route of ["/", FIXTURE_POST]) {
  test(`${route} has no serious or critical axe violations`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    const { violations } = await new AxeBuilder({ page }).analyze();
    const severe = violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        targets: v.nodes.map((n) => n.target.join(" ")).slice(0, 5),
      }));
    expect(severe).toEqual([]);
  });
}
