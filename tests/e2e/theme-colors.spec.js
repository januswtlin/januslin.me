// Colors that depend on the light or dark theme (T09, #58, PR #124 review round 1):
// - each callout type takes its own color (border and title): fg-muted for note and tip, fg for
//   important, the accent for warning and caution;
// - Mermaid's edges and arrowheads reach 3:1 against the page (WCAG 1.4.11, non-text contrast).
import { FIXTURE_POST, THEME_KEY } from "../dist/site.js";
import { expect, settle, test } from "./fixtures.js";

const EXPECTED_TOKEN = {
  note: "--color-fg-muted",
  tip: "--color-fg-muted",
  important: "--color-fg",
  warning: "--color-accent",
  caution: "--color-accent",
};

/**
 * WCAG contrast of a CSS color (rgb/rgba, composited on the background) on an opaque background.
 * @param {import("@playwright/test").Page} page
 * @param {string} fg
 * @param {string} bg
 */
const contrast = (page, fg, bg) =>
  page.evaluate(
    ([f, b]) => {
      /** @param {string} c */
      const parse = (c) => {
        const m = c.match(/[\d.]+/g)?.map(Number) ?? [];
        return { rgb: m.slice(0, 3), a: m.length > 3 ? m[3] : 1 };
      };
      const back = parse(b).rgb;
      const front = parse(f);
      const mixed = front.rgb.map((v, i) => v * front.a + back[i] * (1 - front.a));
      /** @param {number[]} rgb */
      const lum = (rgb) => {
        const [r, g, bl] = rgb.map((v) => {
          const s = v / 255;
          return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
      };
      const [hi, lo] = [lum(mixed), lum(back)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    },
    [fg, bg],
  );

for (const scheme of ["light", "dark"]) {
  test.describe(`${scheme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(([key, s]) => localStorage.setItem(key, s), [THEME_KEY, scheme]);
      await page.goto(FIXTURE_POST);
      await settle(page);
    });

    test("each callout type has its own color, on the rule and the title", async ({ page }) => {
      for (const [type, token] of Object.entries(EXPECTED_TOKEN)) {
        const callout = page.locator(`.post__body blockquote.admonition-${type}`);
        const { border, title, expected } = await callout.evaluate((el, t) => {
          const probe = document.createElement("span");
          probe.style.color = `var(${t})`;
          el.append(probe);
          const result = {
            border: getComputedStyle(el).borderLeftColor,
            title: getComputedStyle(/** @type {Element} */ (el.querySelector(".admonition-title")))
              .color,
            expected: getComputedStyle(probe).color,
          };
          probe.remove();
          return result;
        }, token);
        expect([type, border], `${type} rule`).toEqual([type, expected]);
        expect([type, title], `${type} title`).toEqual([type, expected]);
      }
      const colors = await page
        .locator(".post__body blockquote[class*='admonition-']")
        .evaluateAll((els) => els.map((el) => getComputedStyle(el).borderLeftColor));
      expect(new Set(colors).size).toBe(3);
    });

    test("Mermaid edges and arrowheads have at least 3:1 contrast with the page", async ({
      page,
    }) => {
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      const svg = page.locator('.post__body svg[id^="mermaid"]').first();
      const strokes = await svg
        .locator(".flowchart-link")
        .evaluateAll((els) => els.map((el) => getComputedStyle(el).stroke));
      const heads = await svg
        .locator("marker path")
        .evaluateAll((els) => els.map((el) => getComputedStyle(el).fill));
      expect(strokes.length).toBeGreaterThan(0);
      expect(heads.length).toBeGreaterThan(0);
      for (const color of [...new Set([...strokes, ...heads])]) {
        expect(await contrast(page, color, bg), `${color} on ${bg}`).toBeGreaterThanOrEqual(3);
      }
    });
  });
}
