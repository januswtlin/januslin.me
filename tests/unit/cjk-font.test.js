// Glyph routing for `——` and `……`, and the helpers of the Noto Serif TC subsetting (T09, #58;
// src/lib/fonts/cjk-font.ts). The checks over the built site are tests/dist/fonts.test.js, and the
// browser check is tests/e2e/typography.spec.js.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FAMILY,
  PUNCT_FAMILY,
  ROUTED_PUNCTUATION,
  facesFor,
  fontFaceCss,
  formatUnicodeRange,
  isCjkCodepoint,
  pageCodepoints,
  parseFontsourceSlices,
  parseUnicodeRange,
} from "../../src/lib/fonts/cjk-font.ts";

const root = resolve(import.meta.dirname, "../..");
const require = createRequire(resolve(root, "package.json"));

describe("glyph routing for —— and ……", () => {
  it("routes U+2014 and U+2026 to the CJK face", () => {
    expect([...ROUTED_PUNCTUATION].sort()).toEqual([0x2014, 0x2026]);
    expect(isCjkCodepoint(0x2014)).toBe(true);
    expect(isCjkCodepoint(0x2026)).toBe(true);
  });

  it("gives the punctuation family only those codepoints, from the files that hold them", () => {
    const faces = facesFor([
      { url: "/a.woff2", codepoints: [0x4e2d, 0x2014] },
      { url: "/b.woff2", codepoints: [0x2026, 0x3002] },
      { url: "/c.woff2", codepoints: [0x6587] },
    ]);
    expect(faces.filter((f) => f.family === PUNCT_FAMILY)).toEqual([
      { family: PUNCT_FAMILY, url: "/a.woff2", unicodeRange: "U+2014" },
      { family: PUNCT_FAMILY, url: "/b.woff2", unicodeRange: "U+2026" },
    ]);
    expect(faces.filter((f) => f.family === FAMILY).map((f) => f.unicodeRange)).toEqual([
      "U+2014,U+4e2d",
      "U+2026,U+3002",
      "U+6587",
    ]);
  });

  it("zh pages put the punctuation family first, before Source Serif 4 (src/styles/cjk.css)", () => {
    const css = readFileSync(resolve(root, "src/styles/cjk.css"), "utf8");
    const rule = /:root:lang\(zh\)\s*{[^}]*--font-serif:\s*([^;}]+)/.exec(css);
    expect(rule).not.toBeNull();
    const stack = (rule?.[1] ?? "").split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
    expect(stack[0]).toBe(PUNCT_FAMILY);
    expect(stack.indexOf("Source Serif 4")).toBeGreaterThan(0);
    expect(stack.indexOf(FAMILY)).toBeGreaterThan(stack.indexOf("Source Serif 4"));
  });

  it("Fontsource's CJK slices contain both characters, so they can be routed", () => {
    const css = readFileSync(
      require.resolve("@fontsource-variable/noto-serif-tc/wght.css"),
      "utf8",
    );
    const slices = parseFontsourceSlices(css);
    expect(slices.length).toBeGreaterThan(90);
    for (const cp of ROUTED_PUNCTUATION) {
      expect(slices.some((s) => s.ranges.some(([lo, hi]) => cp >= lo && cp <= hi))).toBe(true);
    }
    // Only the numbered (CJK) slices: no Latin, Cyrillic, or Vietnamese subset.
    expect(slices.every((s) => /^\d+$/.test(s.name))).toBe(true);
  });
});

describe("codepoints for Noto Serif TC", () => {
  it("takes CJK and full-width characters, not Latin, emoji, or other punctuation", () => {
    for (const ch of ["中", "臺", "，", "。", "「", "（", "ㄅ"])
      expect(isCjkCodepoint(ch.codePointAt(0) ?? 0), ch).toBe(true);
    for (const ch of ["A", "é", "–", "“", "·", "😀"])
      expect(isCjkCodepoint(ch.codePointAt(0) ?? 0), ch).toBe(false);
  });

  it("reads visible text and alt text, not scripts or styles", () => {
    const cps = pageCodepoints(
      '<html><head><title>標題</title><style>p{content:"樣"}</style></head>' +
        '<body><p>文字</p><script>const s="腳本"</script><img alt="圖說"><svg><text>圖表</text></svg></body></html>',
    );
    const text = String.fromCodePoint(...[...cps].filter(isCjkCodepoint).sort((a, b) => a - b));
    expect([...text].sort()).toEqual(
      [..."文字圖說圖表"].filter((c, i, a) => a.indexOf(c) === i).sort(),
    );
  });
});

describe("unicode-range helpers", () => {
  it("round-trip ranges and single codepoints", () => {
    const value = formatUnicodeRange([0x4e01, 0x4e00, 0x4e02, 0x4e2d, 0x2014]);
    expect(value).toBe("U+2014,U+4e00-4e02,U+4e2d");
    expect(parseUnicodeRange(value)).toEqual([
      [0x2014, 0x2014],
      [0x4e00, 0x4e02],
      [0x4e2d, 0x4e2d],
    ]);
    expect(parseUnicodeRange("U+4??")).toEqual([[0x400, 0x4ff]]);
  });

  it("writes variable-weight @font-face rules", () => {
    expect(fontFaceCss([{ family: FAMILY, url: "/x.woff2", unicodeRange: "U+4e2d" }])).toBe(
      '@font-face{font-family:"Noto Serif TC";font-style:normal;font-weight:200 900;' +
        'font-display:swap;src:url("/x.woff2") format("woff2");unicode-range:U+4e2d}',
    );
  });
});
