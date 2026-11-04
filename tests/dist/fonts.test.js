// Noto Serif TC in the built site (T09, #58): subset at build time to the glyphs the site uses,
// variable, without Fontsource's Latin subsets, and with `——` and `……` routed to it on zh pages.
// The browser-side check (which face actually draws the text) is tests/e2e/typography.spec.js.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as hb from "harfbuzzjs";
import { parse } from "node-html-parser";
import subsetFont from "subset-font";
import { beforeAll, describe, expect, test } from "vitest";
import {
  FAMILY,
  PUNCT_FAMILY,
  ROUTED_PUNCTUATION,
  STYLESHEET_PLACEHOLDER,
  isCjkCodepoint,
  pageCodepoints,
  parseUnicodeRange,
} from "../../src/lib/fonts/cjk-font.ts";
import { listFiles } from "./site.js";

const DIST = resolve(process.env.DIST_DIR ?? "dist");

/** @type {string[]} */
let files = [];
/** @type {string[]} */
let pages = [];

beforeAll(() => {
  if (!existsSync(resolve(DIST, "index.html"))) {
    throw new Error(`${DIST} has no index.html; run \`pnpm build\` first`);
  }
  files = listFiles(DIST);
  pages = files.filter((f) => f.endsWith(".html"));
});

/** @param {string} file */
const read = (file) => readFileSync(resolve(DIST, file), "utf8");

/** The font stylesheet each page links, as a dist-relative path. @param {string} page */
function stylesheetOf(page) {
  const links = parse(read(page))
    .querySelectorAll('link[rel="stylesheet"]')
    .map((l) => l.getAttribute("href") ?? "")
    .filter((h) => h.includes("noto-serif-tc"));
  return links;
}

/**
 * @font-face rules of a stylesheet.
 * @param {string} css
 * @returns {{ family: string, url: string, ranges: [number, number][] }[]}
 */
function fontFaces(css) {
  return [...css.matchAll(/@font-face\s*{([^}]*)}/g)].map(([, body]) => ({
    family: /font-family:\s*"([^"]+)"/.exec(body)?.[1] ?? "",
    url: /url\("([^"]+)"\)/.exec(body)?.[1] ?? "",
    ranges: parseUnicodeRange(/unicode-range:\s*([^;}]+)/.exec(body)?.[1] ?? ""),
  }));
}

/**
 * Codepoints a woff2 file has glyphs for, among `wanted`: subset-font decompresses it and keeps
 * only the glyphs that exist, and harfbuzz lists the cmap of the result.
 * @param {Buffer} woff2
 * @param {number[]} wanted
 */
async function glyphsIn(woff2, wanted) {
  const sfnt = await subsetFont(woff2, String.fromCodePoint(...wanted), { targetFormat: "sfnt" });
  return new Set(new hb.Face(new hb.Blob(sfnt)).collectUnicodes());
}

/** @param {[number, number][]} ranges */
const expand = (ranges) =>
  ranges.flatMap(([lo, hi]) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i));

describe("Noto Serif TC subset", () => {
  test("every page links one hashed font stylesheet, and no placeholder is left", () => {
    const wrong = pages
      .map((p) => [p, stylesheetOf(p)])
      .filter(([, links]) => links.length !== 1 || links[0] === STYLESHEET_PLACEHOLDER);
    expect(wrong).toEqual([]);
    expect(new Set(pages.map((p) => stylesheetOf(p)[0])).size).toBe(1);
  });

  test("ships none of Fontsource's files as they are, and no Latin, Cyrillic, or Vietnamese subset", () => {
    const fontFiles = files.filter((f) => /\.(?:woff2?|ttf|otf)$/.test(f));
    expect(
      fontFiles.filter((f) => /noto-serif-tc-(?:latin|latin-ext|cyrillic|vietnamese)\b/.test(f)),
    ).toEqual([]);
    expect(fontFiles.filter((f) => /noto-serif-tc-\d+-wght-normal\.woff2$/.test(f))).toEqual([]);
  });

  test("ships the OFL next to the subset", () => {
    expect(read("fonts/noto-serif-tc/OFL.txt")).toMatch(/SIL Open Font License, Version 1\.1/);
  });

  test("every CJK character on every page has a glyph in the subset", async () => {
    const css = read(stylesheetOf("index.html")[0].slice(1));
    const faces = fontFaces(css).filter((f) => f.family === FAMILY);
    expect(faces.length).toBeGreaterThan(0);

    const used = new Set();
    for (const page of pages)
      for (const cp of pageCodepoints(read(page))) if (isCjkCodepoint(cp)) used.add(cp);
    expect(used.size).toBeGreaterThan(100);

    const covered = new Set();
    for (const face of faces) {
      const declared = expand(face.ranges);
      const present = await glyphsIn(readFileSync(resolve(DIST, face.url.slice(1))), declared);
      for (const cp of declared) {
        expect(present.has(cp), `${face.url} declares U+${cp.toString(16)} but has no glyph`).toBe(
          true,
        );
        covered.add(cp);
      }
    }
    const missing = [...used]
      .filter((cp) => !covered.has(cp))
      .map((cp) => String.fromCodePoint(cp));
    expect(missing).toEqual([]);
  });

  test("is variable: every subset file is woff2 and keeps the wght axis (200–900)", async () => {
    const css = read(stylesheetOf("index.html")[0].slice(1));
    const faces = fontFaces(css).filter((f) => f.family === FAMILY);
    for (const face of faces) {
      const data = readFileSync(resolve(DIST, face.url.slice(1)));
      expect(data.subarray(0, 4).toString("latin1"), face.url).toBe("wOF2");
      const sfnt = await subsetFont(data, String.fromCodePoint(face.ranges[0][0]), {
        targetFormat: "sfnt",
      });
      const wght = new hb.Face(new hb.Blob(sfnt)).getAxisInfos().wght;
      expect(wght, `${face.url} has no wght axis`).toBeDefined();
      expect([wght?.min, wght?.max], face.url).toEqual([200, 900]);
    }
  });
});

describe("glyph routing for —— and …… (dist)", () => {
  test(`"${PUNCT_FAMILY}" covers exactly U+2014 and U+2026, from files that have the glyphs`, async () => {
    const css = read(stylesheetOf("index.html")[0].slice(1));
    const punct = fontFaces(css).filter((f) => f.family === PUNCT_FAMILY);
    const declared = punct.flatMap((f) => expand(f.ranges)).sort((a, b) => a - b);
    expect(declared).toEqual([...ROUTED_PUNCTUATION].sort((a, b) => a - b));
    for (const face of punct) {
      const cps = expand(face.ranges);
      const present = await glyphsIn(readFileSync(resolve(DIST, face.url.slice(1))), cps);
      expect(cps.filter((cp) => !present.has(cp))).toEqual([]);
    }
  });

  test("zh pages put the punctuation face before Source Serif 4 in the serif stack", () => {
    const css = files
      .filter((f) => f.startsWith("_astro/") && f.endsWith(".css"))
      .map(read)
      .join("\n");
    const rule = /:root:lang\(zh\)\s*{[^}]*--font-serif:\s*([^;}]+)/.exec(css);
    expect(rule, ":root:lang(zh) { --font-serif } in the built CSS").not.toBeNull();
    const stack = (rule?.[1] ?? "").split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
    expect(stack[0]).toBe(PUNCT_FAMILY);
    expect(stack.indexOf("Source Serif 4")).toBeGreaterThan(0);
    expect(stack.indexOf(FAMILY)).toBeGreaterThan(stack.indexOf("Source Serif 4"));
  });
});
