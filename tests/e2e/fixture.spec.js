// The fixture post (tests/fixtures/site/posts/fixture-post.md) renders its rich content at
// build time: KaTeX math, Mermaid as inline SVG with readable labels and no Mermaid script, every
// callout type, a footnote, a code block, an image with alt text, and `1:15` intact (T09, #58).
import { FIXTURE_POST, FIXTURE_POST_EN } from "../dist/site.js";
import { expect, test } from "./fixtures.js";

const CALLOUTS = ["note", "tip", "important", "warning", "caution"];

for (const route of [FIXTURE_POST, FIXTURE_POST_EN]) {
  test.describe(`fixture ${route}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(route);
    });

    test("renders inline and display math with KaTeX", async ({ page }) => {
      const content = page.locator(".post__body");
      await expect(content.locator(".katex-display .katex-html").first()).toBeVisible();
      const inline = content.locator("p .katex:not(.katex-display .katex)");
      await expect(inline.first()).toBeVisible();
    });

    test("renders Mermaid as inline SVG with no Mermaid script", async ({ page, pageLog }) => {
      await expect(page.locator('.post__body svg[id^="mermaid"]').first()).toBeVisible();
      await expect(page.locator(".post__body pre.mermaid")).toHaveCount(0);
      const scripts = await page
        .locator("script")
        .evaluateAll((els) => els.map((s) => `${s.getAttribute("src") ?? ""} ${s.textContent}`));
      expect(scripts.filter((s) => /mermaid/i.test(s))).toEqual([]);
      await page.waitForLoadState("networkidle");
      expect(pageLog.requests.filter((u) => /mermaid/i.test(u))).toEqual([]);
    });

    test("Mermaid labels are readable: not Sumi's uppercase monospace .label", async ({ page }) => {
      const svg = page.locator('.post__body svg[id^="mermaid"]').first();
      await expect(svg).toContainText("Pull request");
      const labels = svg.locator(".label");
      expect(await labels.count()).toBeGreaterThan(0);
      const styles = await labels.evaluateAll((els) =>
        els.map((el) => {
          const cs = getComputedStyle(el);
          return { transform: cs.textTransform, family: cs.fontFamily };
        }),
      );
      for (const s of styles) {
        expect(s.transform).toBe("none");
        expect(s.family).not.toMatch(/JetBrains Mono/);
      }
      // The label text fits its box (Sumi's letter-spacing clipped it to "PULL REQUE").
      const clipped = await svg.locator("foreignObject").evaluateAll(
        (els) =>
          els.filter((fo) => {
            const inner = fo.firstElementChild;
            return inner && inner.scrollWidth > Number(fo.getAttribute("width")) + 1;
          }).length,
      );
      expect(clipped).toBe(0);
    });

    test("renders every callout type", async ({ page }) => {
      for (const type of CALLOUTS) {
        const callout = page.locator(`.post__body blockquote.admonition-${type}`);
        await expect(callout).toBeVisible();
        await expect(callout.locator(".admonition-title")).toHaveText(type.toUpperCase());
      }
    });

    test("renders the footnote", async ({ page }) => {
      const ref = page.locator(".post__body sup a[data-footnote-ref]").first();
      await expect(ref).toBeVisible();
      const target = await ref.getAttribute("href");
      expect(target).toMatch(/^#/);
      await expect(page.locator(`.post__body section[data-footnotes] ${target}`)).toHaveCount(1);
    });

    test("renders the code block with syntax highlighting", async ({ page }) => {
      const pre = page.locator(".post__body pre").filter({ hasText: "coffeeGrams" });
      await expect(pre).toBeVisible();
      expect(await pre.locator("span[style*='--shiki-light']").count()).toBeGreaterThan(5);
    });

    test("renders the image with its alt text", async ({ page }) => {
      const img = page.locator('.post__body img[alt="抽象的示意圖：深色杯子與淺色桌面"]');
      await expect(img).toBeVisible();
      expect(
        await img.evaluate((el) => /** @type {HTMLImageElement} */ (el).naturalWidth),
      ).toBeGreaterThan(0);
    });

    test("keeps 1:15 and 10:30 in one paragraph", async ({ page }) => {
      const p = page.locator(".post__body p").filter({ hasText: "粉水比" });
      await expect(p).toHaveCount(1);
      await expect(p).toContainText("粉水比 1:15，總共注水 240 ml，早上 10:30 前喝完。");
      // An unhandled directive used to become an empty <div> that split the paragraph.
      await expect(page.locator(".post__body > div:empty")).toHaveCount(0);
    });
  });
}
