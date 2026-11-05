// axe-core finds no serious or critical accessibility violation on /, /en/, and the fixture post,
// in the light and the dark theme (T09, #58). The fixture has every callout type and a code block,
// so callout titles and syntax-highlighting tokens are checked for contrast in both themes.
import AxeBuilder from "@axe-core/playwright";
import { FIXTURE_POST, THEME_KEY } from "../dist/site.js";
import { expect, settle, test } from "./fixtures.js";

for (const scheme of ["light", "dark"]) {
  for (const route of ["/", "/en/", FIXTURE_POST]) {
    test(`${route} has no serious or critical axe violations, ${scheme}`, async ({ page }) => {
      await page.addInitScript(([key, s]) => localStorage.setItem(key, s), [THEME_KEY, scheme]);
      await page.goto(route);
      await settle(page);
      expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(scheme);
      if (route === FIXTURE_POST)
        await expect(
          page.locator(".post__body pre.astro-shiki, .post__body pre.astro-code").first(),
        ).toBeVisible();
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
