// `run_worker_first` from the topics and pages (T10, #59; ADR-0007, docs/deployment.md). Only HTML
// entry paths invoke the Worker script: every topic's hub and posts in both locales, and each
// published page in the locales it exists in. scripts/sync-worker-routes.ts writes and checks it.
import { SOURCE_LOCALE } from "./constants.ts";
import { inheritFrontmatter } from "./entries.ts";
import type { ContentScan } from "./scan.ts";
import { hubUrl, pageUrl } from "./urls.ts";

/** The run_worker_first patterns for a content scan, in a stable order. */
export function workerRoutes(scan: ContentScan): string[] {
  const topics = scan.entries
    .filter((e) => e.collection === "topics" && e.locale === SOURCE_LOCALE)
    .map((e) => ({
      id: e.slug,
      order: typeof e.data?.order === "number" ? e.data.order : Infinity,
    }))
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
    .map((t) => t.id);

  // A page is published in a locale unless its effective draft is true: inheritFrontmatter applies
  // the rule (an English page is a draft when its zh-TW source is), as everywhere else.
  const pageEntries = scan.entries.filter((e) => e.collection === "pages");
  const source = (slug: string) =>
    pageEntries.find((e) => e.slug === slug && e.locale === SOURCE_LOCALE)?.data;
  const published = (slug: string, locale: string) =>
    pageEntries.some(
      (e) =>
        e.slug === slug &&
        e.locale === locale &&
        e.data !== undefined &&
        inheritFrontmatter("pages", e.locale, e.data, source(slug)).draft !== true,
    );
  const pages = [...new Set(pageEntries.map((e) => e.slug))]
    .filter((slug) => published(slug, SOURCE_LOCALE))
    .sort();

  return [
    ...topics.map((t) => `${hubUrl("zh-tw", t)}*`),
    ...topics.map((t) => `${hubUrl("en", t)}*`),
    ...pages.flatMap((p) => [
      pageUrl("zh-tw", p),
      ...(published(p, "en") ? [pageUrl("en", p)] : []),
    ]),
  ];
}

const KEY = /("run_worker_first"\s*:\s*)\[[^\]]*\]/;

/** The wrangler.jsonc text with run_worker_first replaced; comments and layout elsewhere kept. */
export function replaceWorkerRoutes(jsonc: string, routes: string[]): string {
  if (!KEY.test(jsonc)) throw new Error('no "run_worker_first" array to update');
  return jsonc.replace(
    KEY,
    (_, key: string) => `${key}[${routes.map((r) => JSON.stringify(r)).join(", ")}]`,
  );
}
