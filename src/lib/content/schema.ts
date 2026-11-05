// Frontmatter schemas for posts, topics, pages, and tags (T10, #59). docs/content-model.md
// documents every field here and must match.
//
// The schemas are factories so the same definitions serve two callers: src/content.config.ts
// passes Astro's `image()` and `reference()`, and `pnpm validate` (scripts/validate-content.ts)
// passes stand-ins that check the same things without Astro. Unknown fields are errors, so a
// typo such as `tag:` fails instead of being ignored.
import { z } from "astro/zod";

import { DEFAULT_AUTHOR, SLUG_MAX_LENGTH, SLUG_PATTERN } from "./constants.ts";
import { LICENSE_IDS, isLicenseId, type LicenseId } from "./licenses.ts";

export interface SchemaHelpers<Img extends z.ZodType, Ref extends z.ZodType> {
  /** Astro's `image()`: a path relative to the entry file. */
  image: () => Img;
  /** Astro's `reference(collection)`. */
  reference: (collection: "topics" | "tags") => Ref;
}

export const slug = z
  .string()
  .max(SLUG_MAX_LENGTH, `at most ${SLUG_MAX_LENGTH} characters`)
  .regex(SLUG_PATTERN, "lowercase ASCII kebab-case, e.g. v60-recipe");

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2}))?$/;

/** `YYYY-MM-DD` or an ISO datetime with offset. YAML may already have parsed it to a Date. */
export const date = z.union(
  [
    z.date(),
    z
      .string()
      .regex(ISO_DATE)
      .transform((s) => new Date(s))
      .pipe(z.date()),
  ],
  { error: "expected a date: YYYY-MM-DD, or an ISO datetime with offset" },
);

export const license = z
  .string()
  .superRefine((value, ctx) => {
    if (!isLicenseId(value)) {
      ctx.addIssue({
        code: "custom",
        message: `unknown license "${value}"; allowed: ${LICENSE_IDS.join(", ")} (src/lib/content/licenses.ts)`,
      });
    }
  })
  .transform((value) => value as LicenseId);

export const place = z.strictObject({
  name: z.string().min(1),
  /** ISO 3166-1 alpha-2. */
  country: z.string().regex(/^[A-Z]{2}$/, "an ISO 3166-1 alpha-2 code, e.g. JP"),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

export function postSchema<Img extends z.ZodType, Ref extends z.ZodType>(
  h: SchemaHelpers<Img, Ref>,
) {
  return z
    .strictObject({
      title: z.string().min(1),
      author: z.string().min(1).default(DEFAULT_AUTHOR),
      description: z.string().min(40).max(160),
      topic: h.reference("topics"),
      pubDate: date,
      updatedDate: date.optional(),
      tags: z.array(h.reference("tags")).default([]),
      related: z.array(slug).default([]),
      draft: z.boolean().default(false),
      featured: z.boolean().default(false),
      cover: h.image().optional(),
      coverAlt: z.string().min(1).optional(),
      location: z.union([place, z.array(place).min(1)]).optional(),
      tripStart: date.optional(),
      tripEnd: date.optional(),
      license: license.optional(),
    })
    .superRefine((data, ctx) => {
      if (data.cover !== undefined && data.coverAlt === undefined) {
        ctx.addIssue({ code: "custom", path: ["coverAlt"], message: "required when cover is set" });
      }
      if (data.tripStart && data.tripEnd && data.tripEnd < data.tripStart) {
        ctx.addIssue({ code: "custom", path: ["tripEnd"], message: "before tripStart" });
      }
    });
}

export const topicSchema = z.strictObject({
  title: z.string().min(1),
  description: z.string().min(1),
  order: z.number().optional(),
  startHere: z.array(slug).default([]),
});

export const pageSchema = z.strictObject({
  title: z.string().min(1),
  description: z.string().min(1),
  layout: z.enum(["default"]).default("default"),
  updatedDate: date.optional(),
  draft: z.boolean().default(false),
  license: license.optional(),
});

export const tagSchema = z.strictObject({
  id: slug,
  "zh-tw": z.string().min(1),
  en: z.string().min(1),
  description: z
    .strictObject({ "zh-tw": z.string().min(1).optional(), en: z.string().min(1).optional() })
    .optional(),
});
