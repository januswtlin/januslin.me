// Entry ids, inheritance, draft filtering, and where content is read from (T10, #59). Pure
// functions, shared by the collections (src/content.config.ts), `pnpm validate`, and the tests.
import { posix } from "node:path";

import {
  ENTRY_COLLECTIONS,
  INHERITED_FIELDS,
  SOURCE_LOCALE,
  isFileLocale,
  type EntryCollection,
  type FileLocale,
} from "./constants.ts";

/** Entry id: `<slug>/<locale>`, e.g. `v60-recipe/zh-tw`. */
export const entryId = (slug: string, locale: string) => `${slug}/${locale}`;

/** The slug (folder name) part of an entry id. */
export function slugOf(id: string): string {
  const at = id.lastIndexOf("/");
  if (at <= 0) throw new Error(`not an entry id: "${id}"`);
  return id.slice(0, at);
}

/** The locale part of an entry id. */
export function localeOf(id: string): FileLocale {
  const locale = id.slice(id.lastIndexOf("/") + 1);
  if (!isFileLocale(locale)) throw new Error(`entry id "${id}" has an unknown locale`);
  return locale;
}

export interface EntryPath {
  collection: EntryCollection;
  slug: string;
  /** As written in the file name; not necessarily a known locale. */
  locale: string;
}

const ENTRY_FILE = /(?:^|\/)([^/]+)\/([^/]+)\/index\.([^./]+)\.md$/;

/**
 * Collection, slug, and locale of an entry file from its path (any prefix, `/` separators):
 * `content/posts/v60-recipe/index.en.md` → posts, v60-recipe, en. Undefined for any other file.
 */
export function parseEntryPath(path: string): EntryPath | undefined {
  const m = ENTRY_FILE.exec(path.replaceAll("\\", "/"));
  if (!m) return undefined;
  const [, collection, slug, locale] = m;
  if (!(ENTRY_COLLECTIONS as readonly string[]).includes(collection)) return undefined;
  return { collection: collection as EntryCollection, slug, locale };
}

/** Fields of each collection an English entry may inherit (INHERITED_FIELDS ∩ the schema). */
const INHERITABLE: Record<EntryCollection, readonly string[]> = {
  posts: INHERITED_FIELDS,
  pages: ["license"],
  topics: [],
};

/**
 * The frontmatter an English entry is validated with: its own fields, plus each inherited field
 * that the zh-TW source sets and it does not. Other locales are returned unchanged.
 */
export function inheritFrontmatter(
  collection: EntryCollection,
  locale: string,
  own: Record<string, unknown>,
  source: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (locale === SOURCE_LOCALE || !source) return own;
  const merged = { ...own };
  for (const field of INHERITABLE[collection]) {
    if (merged[field] === undefined && source[field] !== undefined) merged[field] = source[field];
  }
  return merged;
}

/** True when drafts are included: `INCLUDE_DRAFTS=true` (`pnpm dev`, `pnpm build:preview`). */
export const includeDrafts = (env: Record<string, string | undefined>) =>
  env.INCLUDE_DRAFTS === "true";

/** Whether an entry is listed and built, given whether drafts are included. */
export const isVisible = (data: { draft?: boolean }, withDrafts: boolean) =>
  withDrafts || data.draft !== true;

export interface ContentSources {
  /** The content directory, relative to the project root, `/` separators, no trailing slash. */
  contentDir: string;
  /** The local drafts directory, or undefined when local drafts are off. */
  draftsDir?: string;
}

/** A directory inside the project, relative to it, or an error. */
function insideRoot(name: string, value: string): string {
  const rel = posix.normalize(value.replaceAll("\\", "/")).replace(/\/+$/, "");
  if (rel === "" || rel === "." || rel.startsWith("../") || rel === ".." || posix.isAbsolute(rel)) {
    throw new Error(`${name} must be a directory inside the project, relative to it: "${value}"`);
  }
  return rel;
}

/**
 * Where the collections read from. `CONTENT_DIR` (default `content`) is the content; the local
 * drafts folder (`DRAFTS_DIR`, default `drafts`) is read only when `LOCAL_DRAFTS=true`, which
 * only `pnpm dev:drafts` sets; astro.config.ts refuses it for any command but `astro dev`.
 */
export function contentSources(env: Record<string, string | undefined>): ContentSources {
  const contentDir = insideRoot("CONTENT_DIR", env.CONTENT_DIR || "content");
  if (env.LOCAL_DRAFTS !== "true") return { contentDir };
  return { contentDir, draftsDir: insideRoot("DRAFTS_DIR", env.DRAFTS_DIR || "drafts") };
}
