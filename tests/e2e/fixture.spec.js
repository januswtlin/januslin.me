// The fixture post (tests/fixtures/site/posts/fixture-post.md) renders its rich content at
// build time: KaTeX math, Mermaid as inline SVG with no Mermaid script, a callout, and a
// footnote (T09, #58).
import { FIXTURE_POST, FIXTURE_POST_EN } from "../dist/site.js";
import { expect, test } from "./fixtures.js";

for (const route of [FIXTURE_POST, FIXTURE_POST_EN]) {
  test.describe(`fixture ${route}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(route);
    });

    test("renders inline and display math with KaTeX", async ({ page }) => {
      const content = page.locator("#post-content");
      await expect(content.locator(".katex-display .katex-html").first()).toBeVisible();
      const inline = content.locator("p .katex:not(.katex-display .katex)");
      await expect(inline.first()).toBeVisible();
    });

    test("renders Mermaid as inline SVG with no Mermaid script", async ({ page, pageLog }) => {
      await expect(page.locator('#post-content svg[id^="mermaid"]').first()).toBeVisible();
      await expect(page.locator("#post-content pre.mermaid")).toHaveCount(0);
      const scripts = await page
        .locator("script")
        .evaluateAll((els) => els.map((s) => `${s.getAttribute("src") ?? ""} ${s.textContent}`));
      expect(scripts.filter((s) => /mermaid/i.test(s))).toEqual([]);
      await page.waitForLoadState("networkidle");
      expect(pageLog.requests.filter((u) => /mermaid/i.test(u))).toEqual([]);
    });

    test("renders the callout", async ({ page }) => {
      const callout = page.locator("#post-content blockquote.admonition-note");
      await expect(callout).toBeVisible();
      await expect(callout.locator(".admonition-title")).toHaveText("NOTE");
    });

    test("renders the footnote", async ({ page }) => {
      const ref = page.locator("#post-content sup a[data-footnote-ref]").first();
      await expect(ref).toBeVisible();
      const target = await ref.getAttribute("href");
      expect(target).toMatch(/^#/);
      await expect(page.locator(`#post-content section[data-footnotes] ${target}`)).toHaveCount(1);
    });
  });
}
