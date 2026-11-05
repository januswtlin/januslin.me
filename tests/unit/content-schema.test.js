// Frontmatter schemas (T10, #59): src/lib/content/schema.ts and the license allow-list in
// src/lib/content/licenses.ts. The negative fixtures (tests/content/validate.test.js) check the
// same rules end to end; these pin the details.
import { z } from "astro/zod";
import { describe, expect, it } from "vitest";
import { LICENSES, LICENSE_IDS } from "../../src/lib/content/licenses.ts";
import { pageSchema, postSchema, tagSchema, topicSchema } from "../../src/lib/content/schema.ts";

const post = postSchema({ image: () => z.string(), reference: () => z.string() });
const base = {
  title: "標題",
  description: "A description that is long enough to pass the forty character minimum.",
  topic: "coffee",
  pubDate: "2026-01-15",
};
/** @param {Record<string, unknown>} extra */
const parsePost = (extra) => post.safeParse({ ...base, ...extra });
/** @param {{ success: boolean, error?: { issues: { path: PropertyKey[] }[] } }} r */
const fields = (r) => (r.error?.issues ?? []).map((i) => i.path.join("."));

describe("posts", () => {
  it("fills the defaults", () => {
    const r = parsePost({});
    expect(r.success).toBe(true);
    expect(r.data).toMatchObject({
      author: "Janus Lin",
      tags: [],
      related: [],
      draft: false,
      featured: false,
    });
    expect(r.data?.pubDate).toEqual(new Date("2026-01-15"));
  });

  it("requires title, description, topic, and pubDate", () => {
    const r = post.safeParse({});
    expect(fields(r).sort()).toEqual(["description", "pubDate", "title", "topic"]);
  });

  it("keeps description between 40 and 160 characters", () => {
    expect(fields(parsePost({ description: "x".repeat(39) }))).toEqual(["description"]);
    expect(fields(parsePost({ description: "x".repeat(161) }))).toEqual(["description"]);
    expect(parsePost({ description: "說".repeat(40) }).success).toBe(true);
  });

  it("rejects unknown fields", () => {
    const r = parsePost({ tag: ["x"] });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toMatch(/Unrecognized key: "tag"/);
  });

  it("accepts YYYY-MM-DD, an ISO datetime with offset, or a YAML date; nothing else", () => {
    for (const ok of ["2026-01-15", "2026-01-15T10:30:00+08:00", "2026-01-15T02:30Z", new Date()])
      expect(parsePost({ pubDate: ok }).success, String(ok)).toBe(true);
    for (const bad of ["2026-1-5", "next tuesday", "2026-13-45", 20260115])
      expect(fields(parsePost({ pubDate: bad })), String(bad)).toEqual(["pubDate"]);
  });

  it("requires coverAlt with cover", () => {
    expect(fields(parsePost({ cover: "./cover.jpg" }))).toEqual(["coverAlt"]);
    expect(parsePost({ cover: "./cover.jpg", coverAlt: "說明" }).success).toBe(true);
  });

  it("takes location as an object or a list, with ISO country codes", () => {
    expect(parsePost({ location: { name: "京都", country: "JP" } }).success).toBe(true);
    expect(
      parsePost({
        location: [
          { name: "京都", country: "JP", lat: 35, lng: 135.7 },
          { name: "台北", country: "TW" },
        ],
      }).success,
    ).toBe(true);
    expect(parsePost({ location: { name: "京都", country: "jp" } }).success).toBe(false);
    expect(parsePost({ location: { name: "x", country: "JP", lat: 91 } }).success).toBe(false);
    expect(parsePost({ location: [] }).success).toBe(false);
  });

  it("takes trip dates, with tripEnd not before tripStart", () => {
    expect(parsePost({ tripStart: "2025-12-28", tripEnd: "2025-12-30" }).success).toBe(true);
    expect(fields(parsePost({ tripStart: "2025-12-30", tripEnd: "2025-12-28" }))).toEqual([
      "tripEnd",
    ]);
  });

  it("checks related slugs' format", () => {
    expect(fields(parsePost({ related: ["Not A Slug"] }))).toEqual(["related.0"]);
  });
});

describe("licenses", () => {
  it("the allow-list has the five SPDX ids, each with a name and a URL", () => {
    expect(LICENSE_IDS).toEqual(["CC-BY-4.0", "CC-BY-SA-4.0", "CC-BY-NC-4.0", "CC0-1.0", "MIT"]);
    for (const id of LICENSE_IDS) {
      expect(LICENSES[id].name, id).toMatch(/\S/);
      expect(LICENSES[id].url, id).toMatch(/^https:\/\//);
    }
  });

  it("license: CC-BY-4.0 validates on posts and pages", () => {
    expect(parsePost({ license: "CC-BY-4.0" }).data?.license).toBe("CC-BY-4.0");
    expect(
      pageSchema.safeParse({ title: "t", description: "d", license: "CC-BY-4.0" }).success,
    ).toBe(true);
  });

  it("an unknown SPDX id fails and names the value", () => {
    const r = parsePost({ license: "GPL-3.0-only" });
    expect(fields(r)).toEqual(["license"]);
    expect(r.error?.issues[0].message).toContain('unknown license "GPL-3.0-only"');
  });
});

describe("topics, pages, tags", () => {
  it("topics: title, description, optional order and startHere", () => {
    expect(
      topicSchema.safeParse({ title: "咖啡", description: "d", order: 1, startHere: ["a-b"] })
        .success,
    ).toBe(true);
    expect(topicSchema.parse({ title: "t", description: "d" }).startHere).toEqual([]);
    expect(topicSchema.safeParse({ title: "t", description: "d", draft: true }).success).toBe(
      false,
    );
  });

  it("pages: layout is default only", () => {
    expect(pageSchema.parse({ title: "t", description: "d" }).layout).toBe("default");
    expect(pageSchema.safeParse({ title: "t", description: "d", layout: "now" }).success).toBe(
      false,
    );
  });

  it("tags: id, zh-tw and en labels, optional description per locale", () => {
    expect(
      tagSchema.safeParse({
        id: "japan",
        "zh-tw": "日本",
        en: "Japan",
        description: { "zh-tw": "說明", en: "About" },
      }).success,
    ).toBe(true);
    expect(tagSchema.safeParse({ id: "Japan", "zh-tw": "日本", en: "Japan" }).success).toBe(false);
    expect(tagSchema.safeParse({ id: "japan", en: "Japan" }).success).toBe(false);
  });
});
