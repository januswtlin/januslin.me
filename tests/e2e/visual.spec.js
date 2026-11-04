// Visual snapshots of /, /en/, and the fixture post at 375 px and 1280 px, light and dark
// (T09, #58). Baselines live in tests/e2e/__screenshots__/ and are recorded on Linux in the
// sandbox. The footer's copyright line is masked: it shows the current year, which would
// change the snapshot every January without any change to the site.
import { FIXTURE_POST } from "../dist/site.js";
import { expect, test } from "./fixtures.js";

const PAGES = [
  { name: "home", route: "/" },
  { name: "home-en", route: "/en/" },
  { name: "fixture", route: FIXTURE_POST },
];
const WIDTHS = [375, 1280];
const SCHEMES = /** @type {const} */ (["light", "dark"]);

for (const { name, route } of PAGES) {
  for (const width of WIDTHS) {
    for (const scheme of SCHEMES) {
      test(`${name} at ${width}px, ${scheme}`, async ({ page }) => {
        await page.addInitScript((s) => localStorage.setItem("theme", s), scheme);
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route);
        await page.waitForLoadState("networkidle");
        await page.evaluate(() => document.fonts.ready);
        await expect(page).toHaveScreenshot(`${name}-${width}-${scheme}.png`, {
          fullPage: true,
          mask: [page.locator("footer p:nth-of-type(2)")],
        });
      });
    }
  }
}
