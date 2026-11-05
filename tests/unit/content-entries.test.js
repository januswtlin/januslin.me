// Entry ids, slug and locale derivation, inheritance, draft filtering, and content sources
// (T10, #59): src/lib/content/entries.ts.
import { describe, expect, it } from "vitest";
import {
  contentSources,
  entryId,
  includeDrafts,
  inheritFrontmatter,
  isVisible,
  localeOf,
  parseEntryPath,
  slugOf,
} from "../../src/lib/content/entries.ts";
import { INHERITED_FIELDS } from "../../src/lib/content/constants.ts";

describe("slug and locale derivation", () => {
  it("derives collection, slug (folder), and locale (suffix) from an entry path", () => {
    expect(parseEntryPath("content/posts/v60-recipe/index.zh-tw.md")).toEqual({
      collection: "posts",
      slug: "v60-recipe",
      locale: "zh-tw",
    });
    expect(parseEntryPath("tests/fixtures/content/topics/coffee/index.en.md")).toEqual({
      collection: "topics",
      slug: "coffee",
      locale: "en",
    });
    expect(parseEntryPath("pages/about/index.fr.md")?.locale).toBe("fr");
  });

  it("is undefined for files that are not entries", () => {
    for (const path of [
      "content/posts/v60-recipe/cover.jpg",
      "content/posts/v60-recipe/index.md",
      "content/posts/v60-recipe/notes.md",
      "content/_templates/post.md",
      "content/drafts/x/index.zh-tw.md",
      "content/posts/index.zh-tw.md",
    ]) {
      expect(parseEntryPath(path), path).toBeUndefined();
    }
  });

  it("builds ids <slug>/<locale> and reads them back", () => {
    const id = entryId("v60-recipe", "en");
    expect(id).toBe("v60-recipe/en");
    expect(slugOf(id)).toBe("v60-recipe");
    expect(localeOf(id)).toBe("en");
    expect(localeOf("x/zh-tw")).toBe("zh-tw");
    expect(() => localeOf("x/fr")).toThrow(/unknown locale/);
    expect(() => slugOf("no-locale")).toThrow(/not an entry id/);
  });
});

describe("English versions inherit from the zh-TW source", () => {
  const source = {
    title: "中文標題",
    description: "中文摘要",
    topic: "travel",
    pubDate: new Date("2026-01-10"),
    tags: ["japan"],
    related: ["other"],
    cover: "./cover.jpg",
    coverAlt: "封面",
    location: { name: "京都", country: "JP" },
    tripStart: new Date("2025-12-28"),
    tripEnd: new Date("2025-12-30"),
    license: "CC-BY-4.0",
    draft: true,
    featured: true,
    updatedDate: new Date("2026-02-01"),
  };

  it("takes every inherited field the English file does not set", () => {
    const merged = inheritFrontmatter(
      "posts",
      "en",
      { title: "Title", description: "Summary" },
      source,
    );
    for (const field of INHERITED_FIELDS) expect(merged[field], field).toEqual(source[field]);
    expect(merged.title).toBe("Title");
    expect(merged.description).toBe("Summary");
  });

  it("does not inherit other fields (title, description, featured, updatedDate)", () => {
    const merged = inheritFrontmatter("posts", "en", { title: "T" }, { ...source, draft: false });
    for (const field of ["description", "featured", "updatedDate"])
      expect(merged[field], field).toBeUndefined();
  });

  it("keeps a field the English file sets", () => {
    const merged = inheritFrontmatter("posts", "en", { tags: [], topic: "life" }, source);
    expect(merged.tags).toEqual([]);
    expect(merged.topic).toBe("life");
  });

  it("pages inherit only license; topics inherit nothing; zh-TW files are unchanged", () => {
    expect(inheritFrontmatter("pages", "en", {}, source)).toEqual({ license: "CC-BY-4.0" });
    expect(
      inheritFrontmatter("topics", "en", {}, { ...source, order: 1, startHere: ["a"] }),
    ).toEqual({});
    const own = { title: "x" };
    expect(inheritFrontmatter("posts", "zh-tw", own, source)).toBe(own);
    expect(inheritFrontmatter("posts", "en", own, undefined)).toBe(own);
  });
});

// The author's rule (2026-11-05): an English entry's effective draft is zh.draft || en.draft; the
// zh-TW entry is never affected by its English version.
describe("effective draft of an English version", () => {
  const zh = (/** @type {boolean | undefined} */ draft) => (draft === undefined ? {} : { draft });
  it.each([
    ["T:true; E:true → both draft", true, true, true],
    ["T:true; E:false → both draft", true, false, true],
    ["T:true; E unset → both draft", true, undefined, true],
    ["T:false; E:true → English draft", false, true, true],
    ["T:false; E:false → both public", false, false, false],
    ["T unset; E unset → both public", undefined, undefined, false],
  ])("%s", (_, zhDraft, enDraft, expected) => {
    for (const collection of /** @type {const} */ (["posts", "pages"])) {
      const merged = inheritFrontmatter(collection, "en", zh(enDraft), zh(zhDraft));
      expect(merged.draft === true, collection).toBe(expected);
      expect(isVisible(merged, false), collection).toBe(!expected);
      expect(isVisible(merged, true), `${collection} with drafts`).toBe(true);
    }
  });

  it("the zh-TW entry keeps its own draft value", () => {
    const own = { draft: false };
    expect(inheritFrontmatter("posts", "zh-tw", own, { draft: true })).toBe(own);
  });

  it("topics have no draft field and stay unchanged", () => {
    expect(inheritFrontmatter("topics", "en", {}, { draft: true })).toEqual({});
  });
});

describe("drafts", () => {
  it("are included only with INCLUDE_DRAFTS=true", () => {
    expect(includeDrafts({ INCLUDE_DRAFTS: "true" })).toBe(true);
    for (const value of [undefined, "", "1", "false", "TRUE"])
      expect(includeDrafts({ INCLUDE_DRAFTS: value }), String(value)).toBe(false);
  });

  it("filter entries with draft: true unless drafts are included", () => {
    expect(isVisible({ draft: true }, false)).toBe(false);
    expect(isVisible({ draft: true }, true)).toBe(true);
    expect(isVisible({ draft: false }, false)).toBe(true);
    expect(isVisible({}, false)).toBe(true);
  });
});

describe("content sources", () => {
  it("default to content/ with no drafts folder", () => {
    expect(contentSources({})).toEqual({ contentDir: "content" });
  });

  it("use CONTENT_DIR when set", () => {
    expect(contentSources({ CONTENT_DIR: "tests/fixtures/content/" })).toEqual({
      contentDir: "tests/fixtures/content",
    });
  });

  it("read the drafts folder only with LOCAL_DRAFTS=true (pnpm dev:drafts)", () => {
    expect(contentSources({ DRAFTS_DIR: "tests/fixtures/drafts" }).draftsDir).toBeUndefined();
    expect(contentSources({ LOCAL_DRAFTS: "1" }).draftsDir).toBeUndefined();
    expect(contentSources({ LOCAL_DRAFTS: "true" }).draftsDir).toBe("drafts");
    expect(
      contentSources({ LOCAL_DRAFTS: "true", DRAFTS_DIR: "tests/fixtures/drafts" }).draftsDir,
    ).toBe("tests/fixtures/drafts");
  });

  it("refuse directories outside the project", () => {
    for (const value of ["../content", "/etc", ".", "a/../../b"])
      expect(() => contentSources({ CONTENT_DIR: value }), value).toThrow(/inside the project/);
    expect(() => contentSources({ LOCAL_DRAFTS: "true", DRAFTS_DIR: "../drafts" })).toThrow(
      /DRAFTS_DIR/,
    );
  });
});
