// Reads a content directory from disk without Astro (T10, #59): every file, every entry with its
// frontmatter, and the tag registry. `pnpm validate`, `sync-worker-routes`, the collections'
// reference checks, and the route tests use it, so they all see the same files.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, posix, relative, sep } from "node:path";

import { parseFrontmatter } from "@astrojs/markdown-remark";
import { parse as parseYaml } from "yaml";

import { IGNORED_NAMES, SOURCE_LOCALE, TAGS_FILE, type EntryCollection } from "./constants.ts";
import { parseEntryPath, type EntryPath } from "./entries.ts";

export interface ScannedFile {
  /** Relative to the project root, `/` separators. */
  path: string;
  /** Relative to the content directory. */
  inContent: string;
  size: number;
}

export interface ScannedEntry extends EntryPath {
  /** Relative to the project root, `/` separators. */
  file: string;
  /** Frontmatter as YAML parsed it; undefined when it could not be parsed (see `error`). */
  data?: Record<string, unknown>;
  body: string;
  error?: string;
}

export interface ScannedTags {
  file: string;
  exists: boolean;
  /** The parsed YAML: an empty file is an empty list. */
  items: unknown;
  error?: string;
}

export interface ContentScan {
  root: string;
  /** Relative to the root. */
  contentDir: string;
  files: ScannedFile[];
  entries: ScannedEntry[];
  tags: ScannedTags;
}

const toPosix = (p: string) => p.split(sep).join("/");

/** Every file under dir, skipping IGNORED_NAMES, as absolute paths. */
function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    if ((IGNORED_NAMES as readonly string[]).includes(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

/** Frontmatter and body of a Markdown file; `error` when the YAML does not parse. */
export function readEntryFile(abs: string): Pick<ScannedEntry, "data" | "body" | "error"> {
  const text = readFileSync(abs, "utf8");
  try {
    const { frontmatter, content } = parseFrontmatter(text);
    const data = frontmatter && typeof frontmatter === "object" ? frontmatter : {};
    return { data: data as Record<string, unknown>, body: content };
  } catch (e) {
    return { body: "", error: `frontmatter is not valid YAML: ${(e as Error).message}` };
  }
}

/** Parses tags.yaml text. An empty file is an empty list. */
export function parseTagsYaml(text: string): unknown {
  return parseYaml(text) ?? [];
}

/** Reads `<contentDir>` (relative to root) from disk. */
export function scanContent(root: string, contentDir: string): ContentScan {
  const base = join(root, contentDir);
  const files = walk(base).map((abs) => ({
    path: toPosix(relative(root, abs)),
    inContent: toPosix(relative(base, abs)),
    size: statSync(abs).size,
  }));

  const entries: ScannedEntry[] = [];
  for (const f of files) {
    // Entry files sit exactly at <collection>/<slug>/index.<locale>.md inside the content dir.
    if (f.inContent.split("/").length !== 3) continue;
    const parsed = parseEntryPath(f.inContent);
    if (!parsed) continue;
    entries.push({ ...parsed, file: f.path, ...readEntryFile(join(root, f.path)) });
  }

  const tagsPath = join(base, TAGS_FILE);
  const tags: ScannedTags = {
    file: posix.join(contentDir, TAGS_FILE),
    exists: existsSync(tagsPath),
    items: [],
  };
  if (tags.exists) {
    try {
      tags.items = parseTagsYaml(readFileSync(tagsPath, "utf8"));
    } catch (e) {
      tags.error = `not valid YAML: ${(e as Error).message}`;
    }
  }

  return { root, contentDir, files, entries, tags };
}

/** Entry folders (slugs) of a collection that have a zh-TW source file. */
export function sourceSlugs(scan: ContentScan, collection: EntryCollection): Set<string> {
  return new Set(
    scan.entries
      .filter((e) => e.collection === collection && e.locale === SOURCE_LOCALE)
      .map((e) => e.slug),
  );
}

/** Tag ids in the registry, ignoring malformed items (validation reports those). */
export function tagIds(scan: ContentScan): Set<string> {
  const items = Array.isArray(scan.tags.items) ? scan.tags.items : [];
  return new Set(
    items
      .map((item) => (item && typeof item === "object" ? (item as { id?: unknown }).id : undefined))
      .filter((id): id is string => typeof id === "string"),
  );
}

/** Slugs of a collection's entry folders on disk, from the folder names. */
export function entryFolders(root: string, contentDir: string, collection: EntryCollection) {
  const dir = join(root, contentDir, collection);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => !name.startsWith(".") && statSync(join(dir, name)).isDirectory())
    .sort();
}
