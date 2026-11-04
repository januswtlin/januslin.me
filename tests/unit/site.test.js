// Site-level unit tests for T09 (#58): the installed Astro major version, and no comment
// system, analytics, or Partytown code left in src/ or package.json.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { listFiles } from "../dist/site.js";

const root = resolve(import.meta.dirname, "../..");

describe("Astro", () => {
  it("the installed astro is 7.x", () => {
    const { version } = JSON.parse(
      readFileSync(resolve(root, "node_modules/astro/package.json"), "utf8"),
    );
    expect(version).toMatch(/^7\.\d+\.\d+$/);
  });
});

// Substring matches, so camelCase names such as umamiAnalyticsID count. Only "gtag" needs
// word boundaries: as a substring it matches identifiers such as langTags.
const BANNED = /twikoo|waline|giscus|partytown|umami|\bgtag\b/i;
const TEXT = /\.(?:astro|ts|mts|js|mjs|cjs|json|css|md|mdx|html|svg|txt|ya?ml)$/i;

describe("no comment system, analytics, or Partytown", () => {
  it("the pattern catches camelCase names and gtag calls, not langTags", () => {
    for (const hit of [
      "umamiAnalyticsID: ''",
      "const walineConfig = {}",
      "giscusContainer",
      "TwikooInit()",
      "@astrojs/partytown",
      "window.gtag('js', new Date())",
      "googletagmanager.com/gtag/js",
    ]) {
      expect(BANNED.test(hit), hit).toBe(true);
    }
    expect(BANNED.test("const langTags = await getAllTags(lang)")).toBe(false);
  });

  it("src/ and package.json do not mention twikoo, waline, giscus, partytown, gtag, umami", () => {
    /** @type {string[]} */
    const hits = [];
    const files = [
      "package.json",
      ...listFiles(resolve(root, "src"))
        .filter((f) => TEXT.test(f))
        .map((f) => `src/${f}`),
    ];
    for (const file of files) {
      readFileSync(resolve(root, file), "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (BANNED.test(line)) hits.push(`${file}:${i + 1}: ${line.trim().slice(0, 120)}`);
        });
    }
    expect(hits).toEqual([]);
  });
});
