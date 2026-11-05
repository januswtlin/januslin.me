// Content collections (T10, #59): posts, topics, and pages from content/ (or CONTENT_DIR), and
// the tag registry. The schemas live in src/lib/content/schema.ts, shared with `pnpm validate`;
// docs/content-model.md documents them and must match.
import { defineCollection, reference } from "astro:content";
import { file } from "astro/loaders";
import { z } from "astro/zod";

import { SOURCE_LOCALE, TAGS_FILE } from "./lib/content/constants.ts";
import { contentSources, entryId } from "./lib/content/entries.ts";
import { entryLoader } from "./lib/content/loader.ts";
import { parseTagsYaml } from "./lib/content/scan.ts";
import { pageSchema, postSchema, tagSchema, topicSchema } from "./lib/content/schema.ts";

const sources = contentSources(process.env);

/**
 * `topic: coffee` refers to the hub entry `coffee/zh-tw` (entry ids are `<slug>/<locale>`); a
 * tag id is the tag's entry id.
 */
const referenceTo = (collection: "topics" | "tags") =>
  collection === "topics"
    ? z
        .string()
        .transform((id) => entryId(id, SOURCE_LOCALE))
        .pipe(reference("topics"))
    : reference("tags");

const posts = defineCollection({
  loader: entryLoader("posts", sources),
  schema: ({ image }) => postSchema({ image, reference: referenceTo }),
});

const topics = defineCollection({
  loader: entryLoader("topics", sources),
  schema: topicSchema,
});

const pages = defineCollection({
  loader: entryLoader("pages", sources),
  schema: pageSchema,
});

const tags = defineCollection({
  loader: file(`${sources.contentDir}/${TAGS_FILE}`, { parser: parseTagsYaml as (text: string) => Record<string, unknown>[] }),
  schema: tagSchema,
});

export const collections = { posts, topics, pages, tags };
