// Noto Serif TC, subset at build time to the glyphs the built site uses (T09, #58; ADR-0019).
//
// The source is the variable font (wght 200–900) from @fontsource-variable/noto-serif-tc, which
// ships it in about 100 unicode-range slices of a few hundred glyphs each. After `astro build`,
// this integration:
//   1. reads the text of every page in dist/ and keeps the codepoints Noto Serif TC is for:
//      CJK and full-width characters (U+2E80 and up) and the punctuation routed to the CJK face;
//   2. subsets each slice that contains any of them to just those glyphs, keeping the wght axis
//      (harfbuzz through subset-font), and writes them to dist/fonts/noto-serif-tc/;
//   3. writes one stylesheet of @font-face rules for them, each limited to its own codepoints by
//      unicode-range, so a page downloads only the files its text needs;
//   4. points every page's <link href="/fonts/noto-serif-tc.css"> (BaseHead.astro) at that
//      stylesheet's content-hashed name.
// Fontsource's latin, latin-ext, cyrillic, and vietnamese slices are never used: Latin text keeps
// Sumi's Source Serif 4 and JetBrains Mono.
//
// Two families come out of it. "Noto Serif TC" is the CJK fallback after the Latin faces in every
// stack. "Noto Serif TC Punct" covers only ROUTED_PUNCTUATION and goes first in the zh stacks
// (src/styles/cjk.css), so `——` and `……` take the CJK glyphs instead of Source Serif's.
//
// `astro dev` does no subsetting: it injects @font-face rules for the full slices instead.
import { createHash } from "node:crypto";
import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { AstroIntegration } from "astro";
import { parse } from "node-html-parser";
import subsetFont from "subset-font";
import { STYLESHEET_PLACEHOLDER } from "./constants.ts";

export const FAMILY = "Noto Serif TC";
export const PUNCT_FAMILY = "Noto Serif TC Punct";

/** EM DASH and HORIZONTAL ELLIPSIS, written doubled in Chinese: `——` and `……`. */
export const ROUTED_PUNCTUATION = [0x2014, 0x2026] as const;

/** Characters the CSS adds with `quotes` (src/styles/cjk.css), not present in the HTML. */
export const CSS_GENERATED_TEXT = "「」『』";

export { STYLESHEET_PLACEHOLDER };

/** Where the subset files and their stylesheet go, under dist/. */
export const OUTPUT_DIR = "fonts/noto-serif-tc";

const PACKAGE = "@fontsource-variable/noto-serif-tc";

/**
 * Blocks Noto Serif TC is the face for: CJK radicals, symbols and punctuation, kana, bopomofo,
 * and ideographs (U+2E80–U+9FFF), compatibility ideographs and forms, full-width forms, and the
 * supplementary ideograph planes. Emoji and other symbols are left to the system.
 */
const CJK_BLOCKS: [number, number][] = [
  [0x2e80, 0x9fff],
  [0xf900, 0xfaff],
  [0xfe10, 0xfe1f],
  [0xfe30, 0xfe4f],
  [0xff00, 0xffef],
  [0x20000, 0x3ffff],
];

/** Whether Noto Serif TC is the face for this codepoint. */
export const isCjkCodepoint = (cp: number) =>
  (ROUTED_PUNCTUATION as readonly number[]).includes(cp) ||
  CJK_BLOCKS.some(([lo, hi]) => cp >= lo && cp <= hi);

/** Parses a CSS unicode-range value into inclusive [low, high] pairs. */
export function parseUnicodeRange(value: string): [number, number][] {
  return value
    .split(",")
    .map((part) => part.trim().replace(/^U\+/i, ""))
    .filter(Boolean)
    .map((part) => {
      const [lo, hi] = part.split("-");
      if (lo.includes("?")) {
        return [parseInt(lo.replace(/\?/g, "0"), 16), parseInt(lo.replace(/\?/g, "f"), 16)];
      }
      const low = parseInt(lo, 16);
      return [low, hi ? parseInt(hi, 16) : low];
    });
}

/** Formats codepoints as a compact unicode-range value (`U+4e00-4e01,U+4e2d`). */
export function formatUnicodeRange(codepoints: Iterable<number>): string {
  const sorted = [...new Set(codepoints)].sort((a, b) => a - b);
  const parts: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const start = sorted[i];
    while (i + 1 < sorted.length && sorted[i + 1] === sorted[i] + 1) i++;
    const hex = (n: number) => n.toString(16);
    parts.push(start === sorted[i] ? `U+${hex(start)}` : `U+${hex(start)}-${hex(sorted[i])}`);
  }
  return parts.join(",");
}

export interface Slice {
  /** Fontsource's slice name, e.g. "123". */
  name: string;
  /** File name in the package's files/ directory. */
  file: string;
  ranges: [number, number][];
}

/**
 * The numbered (CJK) slices in Fontsource's wght.css. The latin, latin-ext, cyrillic, and
 * vietnamese slices are left out.
 */
export function parseFontsourceSlices(css: string): Slice[] {
  const slices: Slice[] = [];
  for (const block of css.matchAll(/@font-face\s*{([^}]*)}/g)) {
    const src = /url\(\s*['"]?\.\/files\/([^'")]+)['"]?\s*\)/.exec(block[1]);
    const range = /unicode-range:\s*([^;]+);/.exec(block[1]);
    const name = src && /^noto-serif-tc-(\d+)-wght-normal\.woff2$/.exec(src[1]);
    if (!src || !range || !name) continue;
    slices.push({ name: name[1], file: src[1], ranges: parseUnicodeRange(range[1]) });
  }
  return slices;
}

const inRanges = (cp: number, ranges: [number, number][]) =>
  ranges.some(([lo, hi]) => cp >= lo && cp <= hi);

/** Codepoints of the visible text of an HTML page: text nodes (SVG included) and alt text. */
export function pageCodepoints(html: string): Set<number> {
  const root = parse(html, { comment: false });
  for (const el of root.querySelectorAll("script, style, template, noscript")) el.remove();
  const body = root.querySelector("body") ?? root;
  const text = [
    body.textContent,
    ...body.querySelectorAll("[alt]").map((el) => el.getAttribute("alt") ?? ""),
  ];
  const out = new Set<number>();
  for (const s of text) for (const ch of s) out.add(ch.codePointAt(0) as number);
  return out;
}

export interface Face {
  family: string;
  url: string;
  unicodeRange: string;
}

/** @font-face rules for the faces, variable weight 200–900. */
export function fontFaceCss(faces: Face[]): string {
  return faces
    .map(
      (f) =>
        `@font-face{font-family:"${f.family}";font-style:normal;font-weight:200 900;` +
        `font-display:swap;src:url("${f.url}") format("woff2");unicode-range:${f.unicodeRange}}`,
    )
    .join("\n");
}

/**
 * Faces for a set of files, each with the codepoints it holds: the CJK family for all of them,
 * and the punctuation family for the routed punctuation they hold.
 */
export function facesFor(files: { url: string; codepoints: number[] }[]): Face[] {
  const faces: Face[] = [];
  for (const { url, codepoints } of files) {
    faces.push({ family: FAMILY, url, unicodeRange: formatUnicodeRange(codepoints) });
    const punct = codepoints.filter((cp) => (ROUTED_PUNCTUATION as readonly number[]).includes(cp));
    if (punct.length)
      faces.push({ family: PUNCT_FAMILY, url, unicodeRange: formatUnicodeRange(punct) });
  }
  return faces;
}

function listHtml(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listHtml(full));
    else if (name.endsWith(".html")) out.push(full);
  }
  return out;
}

const hash = (data: Uint8Array | string) =>
  createHash("sha256").update(data).digest("hex").slice(0, 10);

function packageDir(root: URL): string {
  const require = createRequire(new URL("package.json", root));
  return dirname(require.resolve(`${PACKAGE}/package.json`));
}

/** Writes the dev stylesheet (full slices) and returns its path. */
/** Faces for every full Fontsource slice, with `url` mapping a font file path to its URL. */
function fullSliceFaces(root: URL, url: (file: string) => string): Face[] {
  const pkg = packageDir(root);
  const slices = parseFontsourceSlices(readFileSync(join(pkg, "wght.css"), "utf8"));
  const faces: Face[] = [];
  for (const slice of slices) {
    const href = url(join(pkg, "files", slice.file));
    faces.push({
      family: FAMILY,
      url: href,
      unicodeRange: formatUnicodeRange(expand(slice.ranges)),
    });
    const punct = ROUTED_PUNCTUATION.filter((cp) => inRanges(cp, slice.ranges));
    if (punct.length) {
      faces.push({ family: PUNCT_FAMILY, url: href, unicodeRange: formatUnicodeRange(punct) });
    }
  }
  return faces;
}

const cacheDir = (root: URL) => {
  const dir = fileURLToPath(new URL("node_modules/.cache/cjk-font/", root));
  mkdirSync(dir, { recursive: true });
  return dir;
};

/** Writes the dev stylesheet (full slices, URLs relative to it for Vite) and returns its path. */
function writeDevStylesheet(root: URL): string {
  const dir = cacheDir(root);
  const faces = fullSliceFaces(root, (file) => relative(dir, file).split(sep).join("/"));
  const file = join(dir, "dev.css");
  writeFileSync(file, `${fontFaceCss(faces)}\n`);
  return file;
}

/**
 * The font stack Mermaid draws its labels with (astro.config.ts): the zh serif stack, with the
 * punctuation family first so `——` and `……` in Chinese labels take the CJK glyphs.
 */
export const MERMAID_FONT_FAMILY = `"${PUNCT_FAMILY}", "Source Serif 4", "${FAMILY}", serif`;

/**
 * Writes the stylesheet that rehype-mermaid loads into its headless Chromium at build time, and
 * returns its file URL. It declares the site's own faces (Sumi's Source Serif 4 from public/fonts
 * and the full Noto Serif TC slices) with file: URLs, so Mermaid measures its label boxes with the
 * fonts the reader's browser later draws them with. Without it, the labels are measured with
 * whatever the build machine has installed.
 */
export function writeMermaidStylesheet(root: URL): string {
  const dir = cacheDir(root);
  const fontsCss = readFileSync(fileURLToPath(new URL("src/styles/fonts.css", root)), "utf8");
  const latin = fontsCss.replace(
    /url\("\/fonts\/([^"]+)"\)/g,
    (_, name: string) => `url("${new URL(`public/fonts/${name}`, root).href}")`,
  );
  const cjk = fontFaceCss(fullSliceFaces(root, (file) => pathToFileURL(file).href));
  const file = join(dir, "mermaid.css");
  writeFileSync(file, `${latin}\n${cjk}\n`);
  return pathToFileURL(file).href;
}

function expand(ranges: [number, number][]): number[] {
  const out: number[] = [];
  for (const [lo, hi] of ranges) for (let cp = lo; cp <= hi; cp++) out.push(cp);
  return out;
}

export interface SubsetReport {
  stylesheet: string;
  files: { file: string; bytes: number; glyphs: number }[];
  codepoints: number;
  missing: number[];
  pages: number;
}

/** Subsets the font for the site built in `dist` and rewrites its pages (steps 1–4 above). */
export async function subsetForSite(dist: string, root: URL): Promise<SubsetReport> {
  const pkg = packageDir(root);
  const slices = parseFontsourceSlices(readFileSync(join(pkg, "wght.css"), "utf8"));
  const pages = listHtml(dist);

  const used = new Set<number>();
  for (const page of pages)
    for (const cp of pageCodepoints(readFileSync(page, "utf8"))) used.add(cp);
  for (const ch of CSS_GENERATED_TEXT) used.add(ch.codePointAt(0) as number);
  const wanted = [...used].filter(isCjkCodepoint).sort((a, b) => a - b);

  const outDir = join(dist, OUTPUT_DIR);
  mkdirSync(outDir, { recursive: true });
  // The OFL travels with the font (THIRD_PARTY_NOTICES.md).
  copyFileSync(join(pkg, "LICENSE"), join(outDir, "OFL.txt"));
  const files: { url: string; codepoints: number[] }[] = [];
  const report: SubsetReport["files"] = [];
  const covered = new Set<number>();
  for (const slice of slices) {
    const codepoints = wanted.filter((cp) => !covered.has(cp) && inRanges(cp, slice.ranges));
    if (!codepoints.length) continue;
    for (const cp of codepoints) covered.add(cp);
    const source = readFileSync(join(pkg, "files", slice.file));
    const subset = await subsetFont(source, String.fromCodePoint(...codepoints), {
      targetFormat: "woff2",
    });
    const name = `noto-serif-tc-${slice.name}.${hash(subset)}.woff2`;
    writeFileSync(join(outDir, name), subset);
    files.push({ url: `/${OUTPUT_DIR}/${name}`, codepoints });
    report.push({ file: name, bytes: subset.length, glyphs: codepoints.length });
  }

  const css = `${fontFaceCss(facesFor(files))}\n`;
  const stylesheet = `/${OUTPUT_DIR}/fonts.${hash(css)}.css`;
  writeFileSync(join(dist, stylesheet), css);

  const placeholder = `href="${STYLESHEET_PLACEHOLDER}"`;
  let linked = 0;
  for (const page of pages) {
    const html = readFileSync(page, "utf8");
    if (!html.includes(placeholder)) continue;
    writeFileSync(page, html.replaceAll(placeholder, `href="${stylesheet}"`));
    linked++;
  }

  return {
    stylesheet,
    files: report,
    codepoints: wanted.length,
    missing: wanted.filter((cp) => !covered.has(cp)),
    pages: linked,
  };
}

/** The Astro integration. */
export function cjkFont(): AstroIntegration {
  let root: URL;
  return {
    name: "cjk-font",
    hooks: {
      "astro:config:setup": ({ command, config, injectScript }) => {
        root = config.root;
        if (command === "dev") {
          injectScript("page-ssr", `import ${JSON.stringify(writeDevStylesheet(root))};`);
        }
      },
      "astro:build:done": async ({ dir, logger }) => {
        const report = await subsetForSite(fileURLToPath(dir), root);
        const bytes = report.files.reduce((sum, f) => sum + f.bytes, 0);
        logger.info(
          `${FAMILY}: ${report.codepoints} codepoints in ${report.files.length} files, ` +
            `${bytes} bytes; ${report.stylesheet} linked from ${report.pages} pages`,
        );
        if (report.missing.length) {
          logger.warn(
            `${FAMILY} has no glyph for ${report.missing.length} codepoints, which fall back to ` +
              `system fonts: ${String.fromCodePoint(...report.missing)}`,
          );
        }
      },
    },
  };
}
