// The one place that builds the site's content URLs, for both locales (T10, #59). The URL table
// in docs/content-model.md is the specification: zh-tw at the root, en under /en/ (ADR-0005),
// posts under their topic (ADR-0007). Routes (T11) and every link use these helpers.
import type { FileLocale } from "./constants.ts";

/** The locale prefix: "" for zh-tw, "/en" for en. */
const prefix = (locale: FileLocale) => (locale === "zh-tw" ? "" : `/${locale}`);

/** Home: `/`, `/en/`. */
export const homeUrl = (locale: FileLocale) => `${prefix(locale)}/`;

/** Topic hub: `/<topic>/`. */
export const hubUrl = (locale: FileLocale, topic: string) => `${prefix(locale)}/${topic}/`;

/** Post: `/<topic>/<slug>/`. */
export const postUrl = (locale: FileLocale, topic: string, slug: string) =>
  `${prefix(locale)}/${topic}/${slug}/`;

/** The Markdown version of a post: `/<topic>/<slug>/index.md`. */
export const postMarkdownUrl = (locale: FileLocale, topic: string, slug: string) =>
  `${postUrl(locale, topic, slug)}index.md`;

/** Tag index: `/tags/`. */
export const tagsUrl = (locale: FileLocale) => `${prefix(locale)}/tags/`;

/** One tag: `/tags/<tag>/`. */
export const tagUrl = (locale: FileLocale, tag: string) => `${prefix(locale)}/tags/${tag}/`;

/** Archive of all posts by date: `/archive/`. */
export const archiveUrl = (locale: FileLocale) => `${prefix(locale)}/archive/`;

/** Standalone page: `/<page-slug>/`. */
export const pageUrl = (locale: FileLocale, slug: string) => `${prefix(locale)}/${slug}/`;

/** Search: `/search/`. */
export const searchUrl = (locale: FileLocale) => `${prefix(locale)}/search/`;
