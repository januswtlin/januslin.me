import { getCollection, type CollectionEntry } from "astro:content";

import type { Locale } from "../i18n";
import { getPublished } from "../lib/content/collections";
import { slugOf } from "../lib/content/entries";
import { postUrl } from "../lib/content/urls";

// The posts collection (T10, #59). T09's pages read it through these helpers until T11 builds the
// full routing.
export type Post = CollectionEntry<"posts">;

export interface TagCount {
  /** The tag id, used in URLs. */
  slug: string;
  /** The tag's label in the page's locale (content/taxonomy/tags.yaml). */
  name: string;
  count: number;
}

/** The folder name of a post. */
export const postSlug = (post: Post) => slugOf(post.id);

/** A post's topic id: its `topic` refers to the hub's zh-TW entry, `<topic>/zh-tw`. */
export const postTopic = (post: Post) => slugOf(post.data.topic.id);

/** A post's URL in the given locale (src/lib/content/urls.ts). */
export const postHref = (lang: Locale, post: Post) =>
  postUrl(lang, postTopic(post), postSlug(post));

/** Published posts in a locale, newest first (drafts only with INCLUDE_DRAFTS=true). */
export const getPublishedPosts = (lang: Locale): Promise<Post[]> => getPublished("posts", lang);

/** Tag labels by id, in the given locale. */
export async function tagLabels(lang: Locale): Promise<Map<string, string>> {
  const tags = await getCollection("tags");
  return new Map(tags.map((t) => [t.id, t.data[lang]]));
}

export async function collectTags(posts: Post[], lang: Locale): Promise<TagCount[]> {
  const labels = await tagLabels(lang);
  const byslug = new Map<string, TagCount>();

  for (const post of posts) {
    for (const { id } of post.data.tags) {
      const existing = byslug.get(id);
      if (existing) {
        existing.count += 1;
      } else {
        byslug.set(id, { slug: id, name: labels.get(id) ?? id, count: 1 });
      }
    }
  }

  return [...byslug.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name),
  );
}

export function postsByTag(posts: Post[], slug: string): Post[] {
  return posts.filter((post) => post.data.tags.some((t) => t.id === slug));
}

/**
 * Neighbouring posts in publication order. `previous` is the older post, which
 * is what a reader working backwards through an archive expects.
 */
export function getAdjacentPosts(
  posts: Post[],
  id: string,
): { previous?: Post; next?: Post } {
  const index = posts.findIndex((post) => post.id === id);
  if (index === -1) return {};

  return {
    previous: posts[index + 1],
    next: posts[index - 1],
  };
}
