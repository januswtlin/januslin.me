// Markdown directives (T09, #58): callouts render, and directives nothing handles stay text, so
// `1:15` and `10:30` survive (src/lib/markdown/directives.ts). Rendered through Astro's own
// unified Markdown processor with the plugins in astro.config.ts's order.
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import remarkDirective from "remark-directive";
import { beforeAll, describe, expect, it } from "vitest";
import { CALLOUTS, remarkDirectives } from "../../src/lib/markdown/directives.ts";

/** @type {(md: string) => Promise<string>} */
let render;

beforeAll(async () => {
  const processor = await createMarkdownProcessor({
    remarkPlugins: [remarkDirective, remarkDirectives],
    syntaxHighlight: false,
  });
  render = async (md) => (await processor.render(md)).code;
});

describe("text that looks like a directive", () => {
  it("keeps 1:15 and 10:30 in one paragraph (the colon case)", async () => {
    const html = await render("粉水比 1:15，早上 10:30 前喝完。");
    expect(html).toBe("<p>粉水比 1:15，早上 10:30 前喝完。</p>");
  });

  it("puts back a text directive with a label and attributes as written", async () => {
    const html = await render('A :abbr[HTML]{title="HyperText"} tag and a ratio of 1:2.');
    expect(html).toBe('<p>A :abbr[HTML]{title="HyperText"} tag and a ratio of 1:2.</p>');
  });

  it("puts back a leaf directive as a paragraph", async () => {
    const html = await render("::youtube[Video]{#abc}");
    expect(html).toBe("<p>::youtube[Video]{#abc}</p>");
  });

  it("never emits an empty <div> for a directive", async () => {
    const html = await render("時間 3:45 與比例 1:15:2。\n\n::x\n\n:y");
    expect(html).not.toMatch(/<div/);
    expect(html).toContain("3:45");
    expect(html).toContain("1:15:2");
  });
});

describe("callouts", () => {
  it.each(Object.entries(CALLOUTS))(":::%s renders a titled blockquote", async (type, title) => {
    const html = (await render(`:::${type}\n內容 text\n:::`)).replace(/>\s+</g, "><");
    expect(html).toBe(
      `<blockquote class="admonition-${type}"><span class="admonition-title">${title}</span><p>內容 text</p></blockquote>`,
    );
  });

  it("takes a custom title from the label, escaped", async () => {
    const html = await render(":::tip[小技巧 <b>]\n內容\n:::");
    expect(html).toMatch(
      /<span class="admonition-title">小技巧 (?:&lt;|&#x3C;)b(?:>|&gt;)<\/span>/,
    );
    expect(html).not.toContain("<b>");
  });

  it("leaves an unknown container directive to the default handler", async () => {
    const html = await render(":::unknown\n內容\n:::");
    expect(html).not.toContain("admonition");
    expect(html).toContain("<p>內容</p>");
  });
});
