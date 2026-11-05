// `pnpm validate` (T10, #59): every negative fixture in tests/fixtures/content-broken/<case>/
// fails with exactly the expected error, naming the file and the field or value; the fixture
// set, the empty content/ skeleton, and the templates pass.
import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  truncateSync,
  writeFileSync,
} from "node:fs";
import { join, relative, resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { RESERVED_SEGMENTS } from "../../src/lib/content/constants.ts";
import {
  checkReferences,
  reservedSegments,
  validateContent,
} from "../../src/lib/content/validate.ts";

const root = resolve(import.meta.dirname, "../..");
const BROKEN = "tests/fixtures/content-broken";

/**
 * Each negative case: the file the error names (relative to the case folder) and text the message
 * must contain, such as the field and the offending value.
 * @type {Record<string, { file: string, field?: string, says: string[] }>}
 */
const CASES = {
  "missing-title": { file: "posts/a/index.zh-tw.md", field: "title", says: ["expected string"] },
  "unknown-field": {
    file: "posts/a/index.zh-tw.md",
    field: "tag",
    says: ['Unrecognized key: "tag"'],
  },
  "unknown-topic": {
    file: "posts/a/index.zh-tw.md",
    field: "topic",
    says: ['unknown topic "no-such-topic"'],
  },
  "unknown-tag": {
    file: "posts/a/index.zh-tw.md",
    field: "tags.1",
    says: ['unknown tag "no-such-tag"'],
  },
  "unknown-related": {
    file: "posts/a/index.zh-tw.md",
    field: "related.0",
    says: ['unknown post "no-such-post"'],
  },
  "unknown-start-here": {
    file: "topics/tech/index.zh-tw.md",
    field: "startHere.0",
    says: ['unknown post "no-such-post"'],
  },
  "unknown-license": {
    file: "posts/a/index.zh-tw.md",
    field: "license",
    says: ['unknown license "WTFPL"'],
  },
  "cover-without-alt": {
    file: "posts/a/index.zh-tw.md",
    field: "coverAlt",
    says: ["required when cover is set"],
  },
  "missing-cover": {
    file: "posts/a/index.zh-tw.md",
    field: "cover",
    says: ['"./missing.png" does not exist'],
  },
  "bad-date": { file: "posts/a/index.zh-tw.md", field: "pubDate", says: ["expected a date"] },
  "short-description": {
    file: "posts/a/index.zh-tw.md",
    field: "description",
    says: [">=40 characters"],
  },
  "page-topic-collision": { file: "pages/tech", says: ['page slug "tech" is also a topic id'] },
  "reserved-topic": { file: "topics/archive", says: ['topic id "archive" is reserved'] },
  "reserved-page": { file: "pages/search", says: ['page slug "search" is reserved'] },
  "bad-slug": {
    file: "posts/Bad_Slug",
    says: ['slug "Bad_Slug" must be lowercase ASCII kebab-case'],
  },
  "missing-zh": { file: "posts/a", says: ["has no index.zh-tw.md"] },
  "unknown-locale": { file: "posts/a/index.fr.md", says: ['unknown locale "fr"'] },
  "empty-hub": { file: "topics/tech/index.zh-tw.md", says: ["hub introduction", "is empty"] },
  "heic-image": { file: "posts/a/photo.heic", says: ["HEIC is not accepted"] },
  "disallowed-file": { file: "posts/a/diagram.svg", says: ['file type ".svg" is not allowed'] },
  "stray-markdown": { file: "posts/a.md", says: ["not in an entry folder"] },
  "duplicate-tag": {
    file: "taxonomy/tags.yaml",
    field: "1.id",
    says: ['duplicate tag id "fixture"'],
  },
  "bad-yaml": { file: "posts/a/index.zh-tw.md", says: ["frontmatter is not valid YAML"] },
  "reserved-blog-topic": { file: "topics/blog", says: ['topic id "blog" is reserved'] },
  "reserved-blog-page": { file: "pages/blog", says: ['page slug "blog" is reserved'] },
  "related-to-draft": {
    file: "posts/a/index.zh-tw.md",
    field: "related.0",
    says: ['the draft post "hidden"'],
  },
  "start-here-draft": {
    file: "topics/tech/index.zh-tw.md",
    field: "startHere.1",
    says: ['the draft post "hidden"'],
  },
  "related-to-english-draft": {
    file: "posts/a/index.en.md",
    field: "related.0",
    says: ['the draft post "b"', "English version"],
  },
};

describe("negative fixtures", () => {
  it("every folder in tests/fixtures/content-broken/ has a case here, and back", () => {
    expect(readdirSync(join(root, BROKEN)).sort()).toEqual(Object.keys(CASES).sort());
  });

  it.each(Object.entries(CASES))("%s fails with the file and field named", (name, expected) => {
    const dir = `${BROKEN}/${name}`;
    const errors = validateContent(root, dir).filter((i) => i.level === "error");
    expect(errors, JSON.stringify(errors, null, 2)).toHaveLength(1);
    const [error] = errors;
    expect(error.file).toBe(`${dir}/${expected.file}`);
    if (expected.field) expect(error.field).toBe(expected.field);
    for (const text of expected.says) expect(error.message).toContain(text);
  });
});

describe("valid content", () => {
  it("the fixture set has no error or warning", () => {
    expect(validateContent(root, "tests/fixtures/content")).toEqual([]);
  });

  it("the empty content/ skeleton has no error or warning", () => {
    expect(validateContent(root, "content")).toEqual([]);
  });

  it("the templates in content/_templates/ validate as entries", () => {
    const dir = mkdtempSync(join(root, "node_modules", ".t10-templates-"));
    try {
      const at = (/** @type {string} */ p) => join(dir, p);
      for (const d of ["posts/example", "topics/life", "pages/example", "taxonomy"])
        mkdirSync(at(d), { recursive: true });
      cpSync(join(root, "content/_templates/post.md"), at("posts/example/index.zh-tw.md"));
      cpSync(join(root, "content/_templates/topic.md"), at("topics/life/index.zh-tw.md"));
      cpSync(join(root, "content/_templates/page.md"), at("pages/example/index.zh-tw.md"));
      writeFileSync(at("taxonomy/tags.yaml"), "");
      expect(validateContent(root, relative(root, dir))).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("image size policy", () => {
  const dir = mkdtempSync(join(root, "node_modules", ".t10-images-"));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("warns over 1.5 MB and fails over 5 MB", () => {
    cpSync(join(root, "tests/fixtures/content"), dir, { recursive: true });
    const post = join(dir, "posts/kyoto-walk");
    for (const [name, mb] of [
      ["ok.jpg", 1.4],
      ["large.jpg", 2],
      ["huge.png", 5.1],
    ]) {
      writeFileSync(join(post, String(name)), "");
      truncateSync(join(post, String(name)), Math.round(Number(mb) * 1024 * 1024)); // sparse
    }
    const rel = relative(root, dir);
    const issues = validateContent(root, rel).map((i) => `${i.level} ${i.file}: ${i.message}`);
    expect(issues).toEqual([
      `error ${rel}/posts/kyoto-walk/huge.png: image is 5.1 MB, over the 5 MB limit: resize it (long edge 2400 px)`,
      `warning ${rel}/posts/kyoto-walk/large.jpg: image is 2.0 MB, over 1.5 MB: consider resizing it (long edge 2400 px)`,
    ]);
  });
});

describe("reserved first segments", () => {
  const reserved = reservedSegments(root);

  it("include the documented list and blog, favicon.svg, og-default.png", () => {
    for (const s of [...RESERVED_SEGMENTS, "blog", "favicon.svg", "og-default.png"])
      expect(reserved, s).toContain(s);
  });

  it("include every top-level file and folder in public/", () => {
    for (const name of readdirSync(join(root, "public"))) expect(reserved, name).toContain(name);
  });

  it("include every static top-level route in src/pages/", () => {
    const routes = readdirSync(join(root, "src/pages"))
      .filter((n) => !n.startsWith("["))
      .map((n) => n.replace(/\.(?:astro|ts|js|md)$/, ""));
    expect(routes).toEqual(expect.arrayContaining(["blog", "tags", "og", "404", "rss.xml"]));
    for (const r of routes) expect(reserved, r).toContain(r);
  });
});

describe("references to drafts", () => {
  const known = {
    topics: new Set(["tech"]),
    tags: new Set(),
    posts: new Set(["a", "hidden", "half"]),
    // Effective draft per locale: hidden is a draft; half is published in zh-TW, its English
    // version is a draft.
    postDrafts: new Map([
      ["a", { "zh-tw": false }],
      ["hidden", { "zh-tw": true }],
      ["half", { "zh-tw": false, en: true }],
    ]),
    contentDir: "content",
  };
  /** @param {boolean} draft */
  const entry = (draft) => ({
    file: "f.md",
    collection: /** @type {const} */ ("posts"),
    topic: "tech",
    tags: [],
    related: ["a", "hidden"],
    startHere: [],
    draft,
  });

  it("a published entry may not link to a draft; the file, field, and value are named", () => {
    const issues = checkReferences([entry(false)], known);
    expect(issues.map((i) => `${i.file} ${i.field} ${i.message}`)).toEqual([
      expect.stringMatching(/^f\.md related\.1 points at the draft post "hidden"/),
    ]);
  });

  it("a draft may link to a draft, and without draftPosts nothing is checked", () => {
    expect(checkReferences([entry(true)], known)).toEqual([]);
    const withDrafts = { ...known, postDrafts: undefined };
    expect(checkReferences([entry(false)], withDrafts)).toEqual([]);
  });

  it("an English entry checks the English version's effective draft, a zh-TW one the zh-TW", () => {
    const ref = (/** @type {string} */ locale) => ({
      ...entry(false),
      related: ["half"],
      locale,
    });
    expect(checkReferences([ref("zh-tw")], known)).toEqual([]);
    expect(checkReferences([ref("en")], known).map((i) => i.field)).toEqual(["related.0"]);
  });
});

describe("checkReferences", () => {
  it("names the file, field, and value of each unknown reference", () => {
    const known = {
      topics: new Set(["coffee"]),
      tags: new Set(["japan"]),
      posts: new Set(["a"]),
      contentDir: "content",
    };
    const issues = checkReferences(
      [
        {
          file: "f.md",
          collection: "posts",
          topic: "tea",
          tags: ["japan", "x"],
          related: ["a", "b"],
          startHere: [],
        },
        { file: "t.md", collection: "topics", tags: [], related: [], startHere: ["c"] },
      ],
      known,
    );
    expect(issues.map((i) => `${i.file} ${i.field} ${i.message.split(":")[0]}`)).toEqual([
      'f.md topic unknown topic "tea"',
      'f.md tags.1 unknown tag "x"',
      'f.md related.1 unknown post "b"',
      't.md startHere.0 unknown post "c"',
    ]);
  });
});

describe("the pnpm validate command", () => {
  /** @param {string} dir */
  const run = (dir) =>
    spawnSync("node", ["scripts/validate-content.ts"], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, CONTENT_DIR: dir },
    });

  it("exits 0 on the fixture set", () => {
    const r = run("tests/fixtures/content");
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(r.stdout).toContain("0 error(s), 0 warning(s)");
  });

  it("exits 1 and prints file, field, and value on a broken set", () => {
    const r = run(`${BROKEN}/unknown-tag`);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain(
      `error: ${BROKEN}/unknown-tag/posts/a/index.zh-tw.md: tags.1: unknown tag "no-such-tag"`,
    );
  });
});
