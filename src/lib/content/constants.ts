// Facts about content/ that the collections, `pnpm validate`, and the URL helpers share (T10, #59).
// docs/content-model.md is the human-readable version of this file and must match it.

/** Locales as they appear in file names (`index.<locale>.md`) and URLs (ADR-0005). */
export const FILE_LOCALES = ["zh-tw", "en"] as const;
export type FileLocale = (typeof FILE_LOCALES)[number];

/** The source locale: every entry folder needs an `index.zh-tw.md`. */
export const SOURCE_LOCALE: FileLocale = "zh-tw";

export const isFileLocale = (value: string): value is FileLocale =>
  (FILE_LOCALES as readonly string[]).includes(value);

/** Entry collections: one folder per entry under `content/<collection>/`. */
export const ENTRY_COLLECTIONS = ["posts", "topics", "pages"] as const;
export type EntryCollection = (typeof ENTRY_COLLECTIONS)[number];

/** The tag registry, relative to the content directory. */
export const TAGS_FILE = "taxonomy/tags.yaml";

/** Starter files for authors; never a collection. */
export const TEMPLATES_DIR = "_templates";

/** Slugs, topic ids, and tag ids: lowercase ASCII kebab-case. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SLUG_MAX_LENGTH = 60;

/**
 * First URL segments a topic id or page slug may not take (docs/content-model.md, "URLs"). This
 * is the documented list; `pnpm validate` adds every top-level file and folder in public/ and
 * every static top-level route in src/pages/ (reservedSegments in ./validate.ts).
 */
export const RESERVED_SEGMENTS = [
  "en",
  "blog",
  "tags",
  "archive",
  "search",
  "admin",
  "rss.xml",
  "llms.txt",
  "robots.txt",
  "sitemap-index.xml",
  "_astro",
  "fonts",
  "og",
  "pagefind",
  "404",
  "favicon.svg",
  "og-default.png",
] as const;

/**
 * Fields an English entry takes from its zh-TW source when it does not set them itself.
 * A field applies only to the collections whose schema has it (posts: all; pages: license).
 */
export const INHERITED_FIELDS = [
  "topic",
  "pubDate",
  "tags",
  "related",
  "cover",
  "coverAlt",
  "location",
  "tripStart",
  "tripEnd",
  "license",
] as const;

/** Raster image types accepted in content/ (no SVG, docs/content-model.md, "Images"). */
export const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"] as const;

/** Every file extension allowed anywhere in content/. */
export const ALLOWED_EXTENSIONS = [".md", ".yaml", ...IMAGE_EXTENSIONS] as const;

/** HEIC and HEIF: rejected with a hint to convert, rather than as an unknown type. */
export const HEIC_EXTENSIONS = [".heic", ".heif"] as const;

/** Files and folders the content checks skip: editor and OS metadata, and empty-folder markers. */
export const IGNORED_NAMES = [".gitkeep", ".DS_Store", ".obsidian"] as const;

/** Image source size policy (docs/content-model.md, "Images"). */
export const IMAGE_WARN_BYTES = 1.5 * 1024 * 1024;
export const IMAGE_FAIL_BYTES = 5 * 1024 * 1024;

/** The default byline. */
export const DEFAULT_AUTHOR = "Janus Lin";
