import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blog = defineCollection({
  // Until T10 builds the content layer, posts come from the test fixtures, never
  // from content/ (T09, #58). Files starting with an underscore are ignored.
  loader: glob({ base: "./tests/fixtures/site/posts", pattern: "**/[^_]*.md" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      /** Used for the post list, meta description and the OG image. */
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      /** Hidden from production builds, still visible in `astro dev`. */
      draft: z.boolean().default(false),
      heroImage: image().optional(),
      heroImageAlt: z.string().optional(),
    }),
});

export const collections = { blog };
