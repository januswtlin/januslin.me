// Visual snapshots of /, /en/, and the fixture post at 375 px and 1280 px, light and dark
// (T09, #58). Baselines live in tests/e2e/__screenshots__/ and are recorded on Linux in the
// sandbox. The footer's copyright line is masked: it shows the current year, which would
// change the snapshot every January without any change to the site.
import { FIXTURE_POST } from "../dist/site.js";
import { expect, settle, test } from "./fixtures.js";

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
        // Retypeset fades content in with staggered delays from opacity 0; wait for the
        // animations to end rather than letting Playwright cancel the ones not yet started.
        await settle(page);
        // Grow the viewport to the page height and capture it, instead of a full-page
        // capture: Chromium's full-page capture leaves parts of this layout (fixed sidebar,
        // view-transition names) unpainted.
        const height = await page.evaluate(() => document.documentElement.scrollHeight);
        await page.setViewportSize({ width, height });
        await settle(page);
        await expect(page).toHaveScreenshot(`${name}-${width}-${scheme}.png`, {
          mask: [page.locator("footer p:nth-of-type(2)")],
        });
      });
    }
  }
}
