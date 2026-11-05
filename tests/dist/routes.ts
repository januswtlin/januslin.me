// Content routes the fixture build must have, and must not have, derived from the fixture files
// through src/lib/content/urls.ts (T10, #59). T10 builds posts and tag pages from the new
// collections (T09's pages); T11 adds hubs, pages, and the archive, and extends this list.
import { SOURCE_LOCALE } from "../../src/lib/content/constants.ts";
import { inheritFrontmatter } from "../../src/lib/content/entries.ts";
import { scanContent } from "../../src/lib/content/scan.ts";
import { postUrl, tagUrl } from "../../src/lib/content/urls.ts";

/** The fixture content set that `pnpm verify` builds. */
export const FIXTURE_CONTENT = "tests/fixtures/content";

export interface ContentRoutes {
  /** Pages the build must have. */
  expected: string[];
  /** Pages the build must not have: drafts, English URLs of zh-only posts, unused tags. */
  absent: string[];
}

/** Routes of a content set (relative to root) for a build with or without drafts. */
export function contentRoutes(
  root: string,
  contentDir = FIXTURE_CONTENT,
  { includeDrafts = false } = {},
): ContentRoutes {
  const scan = scanContent(root, contentDir);
  const expected = new Set<string>();
  const absent = new Set<string>();
  const usedTags = new Set<string>();
  const posts = scan.entries.filter((e) => e.collection === "posts");

  for (const zh of posts.filter((e) => e.locale === SOURCE_LOCALE)) {
    const data = zh.data ?? {};
    const topic = String(data.topic);
    const shown = includeDrafts || data.draft !== true;
    (shown ? expected : absent).add(postUrl("zh-tw", topic, zh.slug));
    if (shown) for (const tag of (data.tags as string[] | undefined) ?? []) usedTags.add(tag);

    const en = posts.find((e) => e.slug === zh.slug && e.locale === "en");
    if (!en) {
      absent.add(postUrl("en", topic, zh.slug));
      continue;
    }
    const enData = inheritFrontmatter("posts", "en", en.data ?? {}, data);
    const enShown = includeDrafts || enData.draft !== true;
    (enShown ? expected : absent).add(postUrl("en", String(enData.topic), zh.slug));
  }

  const registry = Array.isArray(scan.tags.items) ? (scan.tags.items as { id: string }[]) : [];
  for (const { id } of registry) (usedTags.has(id) ? expected : absent).add(tagUrl("zh-tw", id));

  return { expected: [...expected].sort(), absent: [...absent].sort() };
}
