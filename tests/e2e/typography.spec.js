// Chinese typesetting in the browser (T09, #58): which font Chromium actually draws the text with
// (CSS.getPlatformFontsForNode over the DevTools protocol), CJK punctuation routing, and no
// synthetic italics for Chinese.
import { FIXTURE_POST, FIXTURE_POST_EN } from "../dist/site.js";
import { expect, settle, test } from "./fixtures.js";

/**
 * The fonts Chromium used to draw the text of the first element matching the selector.
 * @param {import("@playwright/test").Page} page
 * @param {string} selector
 * @returns {Promise<{ familyName: string, isCustomFont: boolean, glyphCount: number }[]>}
 */
async function platformFonts(page, selector) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
  const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: root.nodeId, selector });
  if (!nodeId) throw new Error(`no element matches ${selector}`);
  const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
  await cdp.detach();
  return fonts;
}

/**
 * Adds a paragraph with the given text to the post body, so its font can be measured alone.
 * @param {import("@playwright/test").Page} page
 * @param {string} text
 */
async function probe(page, text) {
  await page.evaluate((t) => {
    const p = document.createElement("p");
    p.id = "font-probe";
    p.textContent = t;
    document.querySelector(".post__body")?.append(p);
  }, text);
  await page.evaluate(() => document.fonts.ready);
}

test.describe("Chinese text on zh-tw pages", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FIXTURE_POST);
    await settle(page);
  });

  test("the page is lang zh-TW", async ({ page }) => {
    expect(await page.locator("html").getAttribute("lang")).toBe("zh-TW");
  });

  // Chromium reports the family name in the font file. For the variable font that is its
  // default instance, "Noto Serif TC ExtraLight"; the weight drawn still follows the CSS.
  const NOTO = /^Noto Serif TC\b/;

  test("Chinese characters are drawn with Noto Serif TC only", async ({ page }) => {
    await probe(page, "教育部標準字形：說為這青清骨真別黃吳溫即既強者草決角述遠");
    const fonts = await platformFonts(page, "#font-probe");
    expect(fonts).toHaveLength(1);
    expect(fonts[0].familyName).toMatch(NOTO);
    expect(fonts[0].isCustomFont).toBe(true);
  });

  test("—— and …… are drawn with Noto Serif TC, not Source Serif 4", async ({ page }) => {
    await probe(page, "——……");
    const fonts = await platformFonts(page, "#font-probe");
    // One font only. Noto joins `——` into one glyph, so the count can be below four.
    expect(fonts).toHaveLength(1);
    expect(fonts[0].familyName).toMatch(NOTO);
    expect(fonts[0].isCustomFont).toBe(true);
  });

  test("Latin text in a Chinese paragraph keeps Source Serif 4", async ({ page }) => {
    await probe(page, "Astro TypeScript");
    const fonts = await platformFonts(page, "#font-probe");
    expect(fonts.map((f) => f.familyName)).toEqual(["Source Serif 4"]);
  });

  test("Mermaid labels draw Chinese with Noto Serif TC and Latin with Source Serif 4", async ({
    page,
  }) => {
    const label = page.locator('.post__body svg[id^="mermaid"] .nodeLabel', {
      hasText: "作者",
    });
    await expect(label).toHaveCount(1);
    await label.evaluate((el) => el.setAttribute("id", "mermaid-label-probe"));
    const fonts = await platformFonts(page, "#mermaid-label-probe");
    const families = fonts.map((f) => f.familyName).sort();
    expect(families).toHaveLength(2);
    expect(families[0]).toMatch(NOTO);
    expect(families[1]).toBe("Source Serif 4");
    expect(fonts.every((f) => f.isCustomFont)).toBe(true);
  });

  test("quotes and emphasis are not italic", async ({ page }) => {
    const quote = page.locator(".post__body > blockquote:not([class])").first();
    await expect(quote).toBeVisible();
    expect(await quote.evaluate((el) => getComputedStyle(el).fontStyle)).toBe("normal");
    const em = quote.locator("em");
    expect(await em.evaluate((el) => getComputedStyle(el).fontStyle)).toBe("normal");
  });

  test("paragraphs are justified", async ({ page }) => {
    const p = page.locator(".post__body p").filter({ hasText: "粉水比" });
    expect(await p.evaluate((el) => getComputedStyle(el).textAlign)).toBe("justify");
  });
});

test.describe("English pages keep Sumi's typesetting", () => {
  test("lang en, —— from Source Serif 4, quotes still italic", async ({ page }) => {
    await page.goto(FIXTURE_POST_EN);
    await settle(page);
    expect(await page.locator("html").getAttribute("lang")).toBe("en");
    await probe(page, "——");
    const fonts = await platformFonts(page, "#font-probe");
    expect(fonts.map((f) => f.familyName)).toEqual(["Source Serif 4"]);
    const quote = page.locator(".post__body > blockquote:not([class])").first();
    expect(await quote.evaluate((el) => getComputedStyle(el).fontStyle)).toBe("italic");
  });
});
