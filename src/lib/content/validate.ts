// The rules behind `pnpm validate` (T10, #59): everything that can be wrong in content/, checked
// from the files alone, before the build. Every issue names the file, and the field where there
// is one. docs/content-model.md and docs/authoring-guide.md describe the rules for authors.
import { existsSync, readdirSync } from "node:fs";
import { extname, join, posix } from "node:path";

import { z } from "astro/zod";

import {
  ALLOWED_EXTENSIONS,
  ENTRY_COLLECTIONS,
  HEIC_EXTENSIONS,
  IMAGE_EXTENSIONS,
  IMAGE_FAIL_BYTES,
  IMAGE_WARN_BYTES,
  RESERVED_SEGMENTS,
  SLUG_MAX_LENGTH,
  SLUG_PATTERN,
  SOURCE_LOCALE,
  TAGS_FILE,
  TEMPLATES_DIR,
  isFileLocale,
  type EntryCollection,
} from "./constants.ts";
import { inheritFrontmatter } from "./entries.ts";
import { scanContent, type ContentScan, type ScannedEntry } from "./scan.ts";
import { pageSchema, postSchema, tagSchema, topicSchema } from "./schema.ts";

export interface Issue {
  level: "error" | "warning";
  /** Relative to the project root. */
  file: string;
  field?: string;
  message: string;
}

export const formatIssue = (i: Issue) =>
  `${i.level}: ${i.file}: ${i.field ? `${i.field}: ` : ""}${i.message}`;

const MB = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/** References between entries, as plain ids, for checkReferences(). */
export interface EntryRefs {
  file: string;
  collection: EntryCollection;
  topic?: string;
  tags: string[];
  related: string[];
  startHere: string[];
  /** A draft may link to drafts; a published entry may not. */
  draft?: boolean;
  /** The entry's locale (default zh-tw): an English entry links to English versions. */
  locale?: string;
}

export interface KnownIds {
  topics: Set<string>;
  tags: Set<string>;
  posts: Set<string>;
  /**
   * Each post's effective draft per locale. When set (production: `pnpm validate`, and builds
   * without INCLUDE_DRAFTS), a published entry's `related` and `startHere` may not point at a
   * draft: an English entry at the post's English version when there is one, otherwise at the
   * zh-TW one.
   */
  postDrafts?: PostDrafts;
  /** Shown in the message, e.g. "content". */
  contentDir: string;
}

/** Unknown topics, tags, `related`, and `startHere` slugs, each naming the file and the value. */
export function checkReferences(entries: EntryRefs[], known: KnownIds): Issue[] {
  const issues: Issue[] = [];
  const err = (file: string, field: string, message: string) =>
    issues.push({ level: "error", file, field, message });
  for (const e of entries) {
    if (e.topic !== undefined && !known.topics.has(e.topic)) {
      err(
        e.file,
        "topic",
        `unknown topic "${e.topic}": no ${known.contentDir}/topics/${e.topic}/index.zh-tw.md`,
      );
    }
    e.tags.forEach((tag, i) => {
      if (!known.tags.has(tag))
        err(e.file, `tags.${i}`, `unknown tag "${tag}": not in ${known.contentDir}/${TAGS_FILE}`);
    });
    for (const [field, slugs] of [
      ["related", e.related],
      ["startHere", e.startHere],
    ] as const) {
      slugs.forEach((s, i) => {
        if (!known.posts.has(s))
          err(
            e.file,
            `${field}.${i}`,
            `unknown post "${s}": no ${known.contentDir}/posts/${s}/index.zh-tw.md`,
          );
        else if (!e.draft && known.postDrafts) {
          const drafts = known.postDrafts.get(s) ?? {};
          const locale = e.locale ?? SOURCE_LOCALE;
          const target = drafts[locale] !== undefined ? locale : SOURCE_LOCALE;
          if (drafts[target] === true)
            err(
              e.file,
              `${field}.${i}`,
              `points at the draft post "${s}"${target === SOURCE_LOCALE ? "" : " (its English version is a draft)"}: a published entry cannot link to a draft; publish ${s} first, or remove it here`,
            );
        }
      });
    }
  }
  return issues;
}

/**
 * First URL segments that content may not take: the documented list, every top-level file and
 * folder in public/, and every static top-level route in src/pages/ (`blog`, `rss.xml`, ...).
 */
export function reservedSegments(root: string): string[] {
  const list = (dir: string) => (existsSync(join(root, dir)) ? readdirSync(join(root, dir)) : []);
  const routes = list("src/pages")
    .filter((name) => !name.startsWith("[") && !name.startsWith("_"))
    .map((name) => name.replace(/\.(?:astro|ts|js|md)$/, ""));
  return [...new Set([...RESERVED_SEGMENTS, ...list("public"), ...routes])].sort();
}

/** Effective draft of each post, per locale: slug → { "zh-tw": boolean, en?: boolean }. */
export type PostDrafts = Map<string, Partial<Record<string, boolean>>>;

/**
 * The effective draft of every post in a scan (inheritFrontmatter applies the rule). With
 * `allDrafts`, every post is a draft (the local drafts folder).
 */
export function postDrafts(scan: ContentScan, allDrafts = false): PostDrafts {
  const map: PostDrafts = new Map();
  const sources = new Map(
    scan.entries
      .filter((e) => e.collection === "posts" && e.locale === SOURCE_LOCALE)
      .map((e) => [e.slug, e.data]),
  );
  for (const e of scan.entries) {
    if (e.collection !== "posts" || !isFileLocale(e.locale) || !e.data) continue;
    const data = inheritFrontmatter("posts", e.locale, e.data, sources.get(e.slug));
    map.set(e.slug, { ...map.get(e.slug), [e.locale]: allDrafts || data.draft === true });
  }
  return map;
}

/** Schema stand-in for `image()`: a file next to the entry, of an accepted image type. */
function imageAt(root: string, entryFile: string) {
  return () =>
    z.string().superRefine((value, ctx) => {
      const dir = posix.dirname(entryFile);
      const target = posix.normalize(posix.join(dir, value));
      if (
        /^[a-z][a-z0-9+.-]*:/i.test(value) ||
        value.startsWith("/") ||
        !target.startsWith(`${dir}/`)
      ) {
        ctx.addIssue({
          code: "custom",
          message: `"${value}" must be a file in the entry's folder, e.g. ./cover.jpg`,
        });
        return;
      }
      if (!(IMAGE_EXTENSIONS as readonly string[]).includes(extname(value).toLowerCase())) {
        ctx.addIssue({
          code: "custom",
          message: `"${value}" is not one of ${IMAGE_EXTENSIONS.join(", ")}`,
        });
        return;
      }
      if (!existsSync(join(root, target))) {
        ctx.addIssue({ code: "custom", message: `"${value}" does not exist (${target})` });
      }
    });
}

const plainRef = () => z.string();

function schemaFor(collection: EntryCollection, root: string, file: string) {
  if (collection === "posts")
    return postSchema({ image: imageAt(root, file), reference: plainRef });
  if (collection === "topics") return topicSchema;
  return pageSchema;
}

/** Zod issues as content issues: the path is the field. */
function schemaIssues(file: string, error: z.ZodError): Issue[] {
  return error.issues.map((i) => {
    const field = i.path.map(String).join(".");
    const keys = "keys" in i && Array.isArray(i.keys) ? i.keys : undefined;
    // Unknown fields have no path of their own; name them as the field.
    if (keys && !field) return { level: "error", file, field: keys.join(", "), message: i.message };
    return { level: "error", file, field: field || undefined, message: i.message };
  });
}

/** File types, image sizes, and files outside the expected layout. */
function checkFiles(scan: ContentScan): Issue[] {
  const issues: Issue[] = [];
  for (const f of scan.files) {
    const ext = extname(f.path).toLowerCase();
    const parts = f.inContent.split("/");
    if ((HEIC_EXTENSIONS as readonly string[]).includes(ext)) {
      issues.push({
        level: "error",
        file: f.path,
        message:
          "HEIC is not accepted: convert it to JPEG first (pnpm images:optimize or the iOS Shortcut)",
      });
      continue;
    }
    if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
      issues.push({
        level: "error",
        file: f.path,
        message: `file type "${ext || f.inContent}" is not allowed in content/; allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
      });
      continue;
    }
    if ((IMAGE_EXTENSIONS as readonly string[]).includes(ext)) {
      if (f.size > IMAGE_FAIL_BYTES)
        issues.push({
          level: "error",
          file: f.path,
          message: `image is ${MB(f.size)}, over the 5 MB limit: resize it (long edge 2400 px)`,
        });
      else if (f.size > IMAGE_WARN_BYTES)
        issues.push({
          level: "warning",
          file: f.path,
          message: `image is ${MB(f.size)}, over 1.5 MB: consider resizing it (long edge 2400 px)`,
        });
    }

    const [top] = parts;
    if ((ENTRY_COLLECTIONS as readonly string[]).includes(top)) {
      if (parts.length < 3) {
        issues.push({
          level: "error",
          file: f.path,
          message: `not in an entry folder: use ${top}/<slug>/index.zh-tw.md`,
        });
      } else if (ext === ".md" && !(parts.length === 3 && /^index\.[^./]+\.md$/.test(parts[2]))) {
        issues.push({
          level: "error",
          file: f.path,
          message: "not an entry file: an entry is index.zh-tw.md or index.en.md in its folder",
        });
      } else if (ext === ".yaml") {
        issues.push({
          level: "error",
          file: f.path,
          message: "YAML belongs in taxonomy/, not in an entry folder",
        });
      }
    } else if (top === "taxonomy") {
      if (f.inContent !== TAGS_FILE)
        issues.push({
          level: "warning",
          file: f.path,
          message: `not used: the tag registry is ${TAGS_FILE}`,
        });
    } else if (top !== TEMPLATES_DIR) {
      issues.push({
        level: "warning",
        file: f.path,
        message: "not used: content/ holds posts/, topics/, pages/, taxonomy/, and _templates/",
      });
    }
  }
  return issues;
}

/** The tag registry: a list of tags with unique ids. */
function checkTags(scan: ContentScan): Issue[] {
  const { file, exists, items, error } = scan.tags;
  if (!exists)
    return [
      {
        level: "error",
        file,
        message: "missing: the tag registry must exist (it may be an empty list, [])",
      },
    ];
  if (error) return [{ level: "error", file, message: error }];
  if (!Array.isArray(items))
    return [{ level: "error", file, message: "must be a YAML list of tags" }];
  const issues: Issue[] = [];
  const seen = new Set<string>();
  items.forEach((item, i) => {
    const result = tagSchema.safeParse(item);
    if (!result.success) {
      for (const issue of schemaIssues(file, result.error))
        issues.push({ ...issue, field: `${i}${issue.field ? `.${issue.field}` : ""}` });
      return;
    }
    if (seen.has(result.data.id))
      issues.push({
        level: "error",
        file,
        field: `${i}.id`,
        message: `duplicate tag id "${result.data.id}"`,
      });
    seen.add(result.data.id);
  });
  return issues;
}

/** Validates the content directory (relative to root). */
export function validateContent(root: string, contentDir: string): Issue[] {
  const scan = scanContent(root, contentDir);
  const issues: Issue[] = [...checkFiles(scan), ...checkTags(scan)];
  const err = (file: string, message: string, field?: string) =>
    issues.push({ level: "error", file, field, message });

  // Entry folders: slug format, a zh-TW source, known locales.
  const byFolder = new Map<string, ScannedEntry[]>();
  for (const e of scan.entries) {
    const key = `${e.collection}/${e.slug}`;
    byFolder.set(key, [...(byFolder.get(key) ?? []), e]);
  }
  const folders = new Set(
    scan.files
      .map((f) => f.inContent.split("/"))
      .filter((p) => p.length >= 3 && (ENTRY_COLLECTIONS as readonly string[]).includes(p[0]))
      .map((p) => `${p[0]}/${p[1]}`),
  );
  for (const folder of [...folders].sort()) {
    const [, slug] = folder.split("/");
    const dir = `${contentDir}/${folder}`;
    const kind = folder.startsWith("topics/") ? "topic id" : "slug";
    if (!SLUG_PATTERN.test(slug) || slug.length > SLUG_MAX_LENGTH)
      err(
        dir,
        `${kind} "${slug}" must be lowercase ASCII kebab-case (a-z, 0-9, single hyphens), at most ${SLUG_MAX_LENGTH} characters`,
      );
    const files = byFolder.get(folder) ?? [];
    if (!files.some((e) => e.locale === SOURCE_LOCALE))
      err(dir, "has no index.zh-tw.md: every entry needs its zh-TW source");
    for (const e of files)
      if (!isFileLocale(e.locale))
        err(
          e.file,
          `unknown locale "${e.locale}" in the file name: use index.zh-tw.md or index.en.md`,
        );
  }

  // Frontmatter: YAML, inheritance for English versions, then the schema.
  const sources = new Map(
    scan.entries
      .filter((e) => e.locale === SOURCE_LOCALE)
      .map((e) => [`${e.collection}/${e.slug}`, e]),
  );
  const refs: EntryRefs[] = [];
  const parsed = new Map<ScannedEntry, Record<string, unknown>>();
  for (const e of scan.entries) {
    if (!isFileLocale(e.locale)) continue;
    if (e.error || !e.data) {
      err(e.file, e.error ?? "no frontmatter");
      continue;
    }
    const source = sources.get(`${e.collection}/${e.slug}`)?.data;
    const data = inheritFrontmatter(e.collection, e.locale, e.data, source);
    const result = schemaFor(e.collection, root, e.file).safeParse(data);
    if (!result.success) {
      issues.push(...schemaIssues(e.file, result.error));
      continue;
    }
    const d = result.data as Record<string, unknown>;
    parsed.set(e, d);
    refs.push({
      file: e.file,
      collection: e.collection,
      topic: typeof d.topic === "string" ? d.topic : undefined,
      tags: (d.tags as string[] | undefined) ?? [],
      related: (d.related as string[] | undefined) ?? [],
      startHere: (d.startHere as string[] | undefined) ?? [],
      draft: d.draft === true,
      locale: e.locale,
    });
  }

  // Topic ids and page slugs share the first URL segment.
  const topicFolders = [...folders].filter((f) => f.startsWith("topics/")).map((f) => f.slice(7));
  const pageFolders = [...folders].filter((f) => f.startsWith("pages/")).map((f) => f.slice(6));
  const reserved = reservedSegments(root);
  for (const [kind, collection, slugs] of [
    ["topic id", "topics", topicFolders],
    ["page slug", "pages", pageFolders],
  ] as const) {
    for (const s of slugs)
      if (reserved.includes(s))
        err(
          `${contentDir}/${collection}/${s}`,
          `${kind} "${s}" is reserved for the site's own URLs (/${s}/); reserved: ${reserved.join(", ")}`,
        );
  }
  for (const s of pageFolders)
    if (topicFolders.includes(s))
      err(
        `${contentDir}/pages/${s}`,
        `page slug "${s}" is also a topic id (${contentDir}/topics/${s}): both would be /${s}/`,
      );

  // Post slugs are unique across topics (folders are; this also catches case-only differences).
  const postFolders = [...folders].filter((f) => f.startsWith("posts/")).map((f) => f.slice(6));
  const seen = new Map<string, string>();
  for (const s of postFolders) {
    const other = seen.get(s.toLowerCase());
    if (other) err(`${contentDir}/posts/${s}`, `post slug "${s}" is also used by posts/${other}`);
    seen.set(s.toLowerCase(), s);
  }

  // References.
  const known: KnownIds = {
    topics: new Set(topicFolders.filter((s) => sources.has(`topics/${s}`))),
    posts: new Set(postFolders.filter((s) => sources.has(`posts/${s}`))),
    tags: new Set(
      Array.isArray(scan.tags.items)
        ? scan.tags.items.flatMap((t) =>
            tagSchema.safeParse(t).success ? [(t as { id: string }).id] : [],
          )
        : [],
    ),
    postDrafts: postDrafts(scan),
    contentDir,
  };
  issues.push(...checkReferences(refs, known));

  // Topic hubs need an introduction once the topic has published posts.
  const publishedTopics = new Set<string>();
  for (const [e, d] of parsed)
    if (
      e.collection === "posts" &&
      e.locale === SOURCE_LOCALE &&
      d.draft !== true &&
      typeof d.topic === "string"
    )
      publishedTopics.add(d.topic);
  for (const e of scan.entries)
    if (
      e.collection === "topics" &&
      publishedTopics.has(e.slug) &&
      parsed.has(e) &&
      e.body.replace(/<!--[\s\S]*?-->/g, "").trim() === ""
    )
      err(
        e.file,
        `the hub introduction (the Markdown body) is empty, and topic "${e.slug}" has published posts`,
      );

  return issues.sort(
    (a, b) => a.file.localeCompare(b.file) || (a.field ?? "").localeCompare(b.field ?? ""),
  );
}
