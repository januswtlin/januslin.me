// Content safety in the Markdown pipeline (T10, #59): raw HTML is shown as text, HTML comments
// are dropped, and links keep only safe URLs. The pipeline is the one astro.config.ts configures
// (src/lib/markdown/pipeline.ts, in its order), without Mermaid, which needs a browser and is
// checked in tests/e2e/.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import rehypeKatex from "rehype-katex";
import { beforeAll, describe, expect, it } from "vitest";
import { remarkDirectives } from "../../src/lib/markdown/directives.ts";
import { rehypePluginsBeforeMermaid, remarkPlugins } from "../../src/lib/markdown/pipeline.ts";
import { isSafeUrl, rehypeSafeUrls, remarkNoRawHtml } from "../../src/lib/markdown/safety.ts";

/** @type {(md: string) => Promise<string>} */
let render;

beforeAll(async () => {
  const processor = await createMarkdownProcessor({
    remarkPlugins,
    rehypePlugins: rehypePluginsBeforeMermaid,
    syntaxHighlight: false,
  });
  render = async (md) => (await processor.render(md)).code;
});

describe("the plugin order", () => {
  it("remarkNoRawHtml runs before every other remark plugin; rehypeSafeUrls before KaTeX", () => {
    expect(remarkPlugins[0]).toBe(remarkNoRawHtml);
    expect(remarkPlugins).toContain(remarkDirectives);
    expect(rehypePluginsBeforeMermaid).toEqual([rehypeSafeUrls, rehypeKatex]);
  });

  it("astro.config.ts uses this pipeline", () => {
    const config = readFileSync(resolve(import.meta.dirname, "../../astro.config.ts"), "utf8");
    expect(config).toMatch(/remarkPlugins,\n/);
    expect(config).toMatch(/rehypePlugins: \[\n\s*\.\.\.rehypePluginsBeforeMermaid,/);
  });
});

describe("raw HTML is disabled", () => {
  it.each([
    ["<script>", '<script>alert("x")</script>', /<script/],
    ["an event handler", '<img src="x.png" onerror="alert(1)">', /<img/],
    ["<iframe>", '<iframe src="https://example.com/"></iframe>', /<iframe/],
    ["<object>", '<object data="x.swf"></object>', /<object/],
    ["<embed>", '<embed src="x.swf">', /<embed/],
    ["inline HTML", 'Text <span onclick="alert(1)">x</span> more.', /<span/],
  ])("%s is shown as text, not an element", async (_, md, element) => {
    const html = await render(md);
    expect(html).not.toMatch(element);
    expect(html).toContain("&#x3C;");
  });

  it("drops HTML comments", async () => {
    const html = await render("Before\n\n<!-- a private note -->\n\nAfter");
    expect(html).not.toContain("private note");
    expect(html).toContain("<p>Before</p>");
  });

  it("keeps the callout titles that the directives plugin adds as HTML", async () => {
    const html = await render(":::tip[Brewing]\nGrind coarse.\n:::");
    expect(html).toContain('<blockquote class="admonition-tip">');
    expect(html).toContain('<span class="admonition-title">Brewing</span>');
  });

  it("keeps KaTeX output", async () => {
    expect(await render("$E = mc^2$")).toContain('class="katex"');
  });
});

describe("unsafe URLs are dropped", () => {
  it.each([
    ["[x](javascript:alert(1))"],
    ["[x](JaVaScRiPt:alert(1))"],
    ["<javascript:alert(1)>"],
    ["[x](vbscript:msgbox(1))"],
    ["[x](data:text/html,<script>alert(1)</script>)"],
    ["![x](javascript:alert(1))"],
    ["[x][r]\n\n[r]: javascript:alert(1)"],
  ])("%s has no href or src", async (md) => {
    expect(await render(md)).not.toMatch(/(?:href|src)=/);
  });

  it("keeps https, mailto, tel, relative, and fragment links", async () => {
    const html = await render(
      "[a](https://example.com/) [b](mailto:x@example.com) [c](tel:+886) [d](../other/) [e](#top) ![f](./pic.png)",
    );
    for (const url of [
      "https://example.com/",
      "mailto:x@example.com",
      "tel:+886",
      "../other/",
      "#top",
    ])
      expect(html).toContain(`href="${url}"`);
  });

  it("isSafeUrl ignores case, whitespace, and control characters in the scheme", () => {
    for (const bad of [
      "javascript:x",
      " JAVASCRIPT:x",
      "java\tscript:x",
      "java\nscript:x",
      "data:x",
      "file:///etc/passwd",
    ])
      expect(isSafeUrl(bad), JSON.stringify(bad)).toBe(false);
    for (const ok of [
      "https://x",
      "http://x",
      "mailto:a@b",
      "tel:1",
      "/a",
      "./a",
      "a/b",
      "#x",
      "?q=1",
    ])
      expect(isSafeUrl(ok), ok).toBe(true);
  });
});
