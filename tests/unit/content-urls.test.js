// URL helpers (T10, #59): src/lib/content/urls.ts builds every content URL in the
// docs/content-model.md URL table, zh-tw at the root and en under /en/.
import { describe, expect, it } from "vitest";
import {
  archiveUrl,
  homeUrl,
  hubUrl,
  pageUrl,
  postMarkdownUrl,
  postUrl,
  searchUrl,
  tagUrl,
  tagsUrl,
} from "../../src/lib/content/urls.ts";
import { FIXTURE_POST, FIXTURE_POST_EN, SAFETY_POST } from "../dist/site.js";

describe("URL helpers", () => {
  it.each([
    ["home", homeUrl("zh-tw"), "/", homeUrl("en"), "/en/"],
    ["topic hub", hubUrl("zh-tw", "coffee"), "/coffee/", hubUrl("en", "coffee"), "/en/coffee/"],
    [
      "post",
      postUrl("zh-tw", "coffee", "v60-recipe"),
      "/coffee/v60-recipe/",
      postUrl("en", "coffee", "v60-recipe"),
      "/en/coffee/v60-recipe/",
    ],
    [
      "post as Markdown",
      postMarkdownUrl("zh-tw", "coffee", "v60-recipe"),
      "/coffee/v60-recipe/index.md",
      postMarkdownUrl("en", "coffee", "v60-recipe"),
      "/en/coffee/v60-recipe/index.md",
    ],
    ["tag index", tagsUrl("zh-tw"), "/tags/", tagsUrl("en"), "/en/tags/"],
    ["tag", tagUrl("zh-tw", "japan"), "/tags/japan/", tagUrl("en", "japan"), "/en/tags/japan/"],
    ["archive", archiveUrl("zh-tw"), "/archive/", archiveUrl("en"), "/en/archive/"],
    ["page", pageUrl("zh-tw", "about"), "/about/", pageUrl("en", "about"), "/en/about/"],
    ["search", searchUrl("zh-tw"), "/search/", searchUrl("en"), "/en/search/"],
  ])("%s: zh-tw and en", (_, zh, zhExpected, en, enExpected) => {
    expect(zh).toBe(zhExpected);
    expect(en).toBe(enExpected);
  });

  it("the test constants for the fixture posts are the helpers' URLs", () => {
    expect(FIXTURE_POST).toBe(postUrl("zh-tw", "coffee", "fixture-post"));
    expect(FIXTURE_POST_EN).toBe(postUrl("en", "coffee", "fixture-post"));
    expect(SAFETY_POST).toBe(postUrl("zh-tw", "tech", "safety"));
  });
});
