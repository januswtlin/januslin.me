// axe-core finds no serious or critical accessibility violation on / and the fixture post,
// in the light and the dark theme (T09, #58). The fixture has every callout type, so their
// title colors are checked for contrast in both themes.
import AxeBuilder from "@axe-core/playwright";
import { FIXTURE_POST } from "../dist/site.js";
import { expect, settle, test } from "./fixtures.js";

for (const scheme of ["light", "dark"]) {
  for (const route of ["/", FIXTURE_POST]) {
    test(`${route} has no serious or critical axe violations, ${scheme}`, async ({ page }) => {
      await page.addInitScript((s) => localStorage.setItem("theme", s), scheme);
      await page.goto(route);
      await settle(page);
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
}
