import type { APIRoute, GetStaticPaths } from "astro";

import { OG } from "../../config";
import { formatDateStamp } from "../../utils/date";
import { renderOgImage } from "../../utils/og-image";
import { DEFAULT_LOCALE } from "../../i18n";
import { getPublishedPosts, postSlug, tagLabels, type Post } from "../../utils/posts";

export const getStaticPaths = (async () => {
  if (!OG.enabled) return [];

  // One image per post, from its zh-TW source; the English page uses the same image until T13.
  const posts = await getPublishedPosts(DEFAULT_LOCALE);
  const labels = await tagLabels(DEFAULT_LOCALE);
  return posts.map((post) => ({
    params: { slug: postSlug(post) },
    props: { post, tags: post.data.tags.map(({ id }) => labels.get(id) ?? id) },
  }));
}) satisfies GetStaticPaths;

interface Props {
  post: Post;
  tags: string[];
}

export const GET: APIRoute<Props> = async ({ props }) => {
  const { post, tags } = props;

  const png = await renderOgImage({
    title: post.data.title,
    stamp: formatDateStamp(post.data.pubDate),
    tags,
  });

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
