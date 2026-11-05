// Shared facts about the built site for the dist/ checks and the Playwright tests (T09, #58).
import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

/** The site's own origin; absolute URLs to it are internal. */
export const SITE_ORIGIN = "https://januslin.me";

/**
 * The T09 fixture post (tests/fixtures/content/posts/fixture-post/), a zh+en pair, at
 * /<topic>/<slug>/ since T10 (#59). tests/unit/content-urls.test.js checks these against
 * src/lib/content/urls.ts, which tests/dist/routes.ts derives the content routes from.
 */
export const FIXTURE_POST = "/coffee/fixture-post/";
export const FIXTURE_POST_EN = "/en/coffee/fixture-post/";

/** The content-safety fixture (tests/fixtures/content/posts/safety/). */
export const SAFETY_POST = "/tech/safety/";

/** Routes that do not come from content and must exist in dist/ (T09 acceptance criteria). */
export const STATIC_ROUTES = [
  "/",
  "/en/",
  "/blog/",
  "/tags/",
  "/404.html",
  "/rss.xml",
  "/sitemap-index.xml",
  "/robots.txt",
  "/llms.txt",
];

/** The theme's localStorage key for a pinned light or dark theme (ThemeToggle.astro). */
export const THEME_KEY = "sumi-theme";

/**
 * Lists every file under dir, as paths relative to it with forward slashes.
 * @param {string} dir
 * @returns {string[]}
 */
export function listFiles(dir) {
  /** @type {string[]} */
  const out = [];
  /** @param {string} d */
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const full = join(d, name);
      if (statSync(full).isDirectory()) walk(full);
      else out.push(relative(dir, full).split(sep).join("/"));
    }
  };
  walk(dir);
  return out.sort();
}

/**
 * The URL path of every HTML page in dist (directory pages end with "/").
 * @param {string} dist
 */
export function htmlRoutes(dist) {
  return listFiles(dist)
    .filter((f) => f.endsWith(".html"))
    .map((f) =>
      f === "index.html" ? "/" : f.endsWith("/index.html") ? `/${f.slice(0, -10)}` : `/${f}`,
    );
}
