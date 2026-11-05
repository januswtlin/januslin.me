// Reading the collections in pages (T10, #59). Every page lists entries through getPublished(),
// so drafts are left out the same way everywhere: they are included only with
// INCLUDE_DRAFTS=true (`pnpm dev`, `pnpm dev:drafts`, `pnpm build:preview`).
import { getCollection, type CollectionEntry } from "astro:content";

import type { FileLocale } from "./constants.ts";
import { includeDrafts, isVisible, localeOf } from "./entries.ts";

export type EntryCollectionName = "posts" | "topics" | "pages";

/**
 * The entries of a collection in one locale that the current build shows. Posts come newest
 * first; topics in `order`, then by id; pages by id.
 */
export async function getPublished<C extends EntryCollectionName>(
  collection: C,
  locale: FileLocale,
): Promise<CollectionEntry<C>[]> {
  const withDrafts = includeDrafts(process.env);
  const entries = (await getCollection(collection)) as CollectionEntry<C>[];
  const visible = entries.filter(
    (e) => localeOf(e.id) === locale && isVisible(e.data as { draft?: boolean }, withDrafts),
  );
  return visible.sort((a, b) => {
    const da = a.data as Record<string, unknown>;
    const db = b.data as Record<string, unknown>;
    if (da.pubDate instanceof Date && db.pubDate instanceof Date)
      return db.pubDate.valueOf() - da.pubDate.valueOf() || a.id.localeCompare(b.id);
    if (collection === "topics") {
      const oa = typeof da.order === "number" ? da.order : Infinity;
      const ob = typeof db.order === "number" ? db.order : Infinity;
      if (oa !== ob) return oa - ob;
    }
    return a.id.localeCompare(b.id);
  });
}
