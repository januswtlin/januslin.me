// Checks over the built site in dist/ (T09, #58). Run `pnpm build` first; `pnpm verify` does.
// - every expected route exists, and only the zh-tw (root) and en (/en/) locales;
// - every internal link and asset reference resolves to a file in dist/;
// - nothing loads a resource from another host (src, srcset, <link href>, CSS url() and
//   @import, JS import and fetch, in HTML, CSS, JS, and the XML feeds and sitemaps);
//   outbound <a href> is fine;
// - the front page ships the static ink fallback and loads no ink JavaScript (ADR-0019);
// - no Japanese text is left from the theme's accents;
// - the build log has no warning outside the reasoned allowlist, and never a deprecation.
// T10 (#59) adds:
// - the content routes, derived from tests/fixtures/content/ through src/lib/content/urls.ts
//   (tests/dist/routes.ts): drafts and English URLs of zh-only posts are absent;
// - content safety: raw HTML, event handlers, and javascript: URLs from content are inert, and
//   JSON in <script> cannot be ended by a title.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "node-html-parser";
import { beforeAll, describe, expect, test } from "vitest";
import { resolveFile } from "../e2e/static-server.js";
import { BUILD_LOG, WARNING_ALLOWLIST, findWarnings } from "./build-log.js";
import { classify, cssUrls, htmlRefs, jsRemoteLoads, xmlRefs } from "./refs.js";
import { contentRoutes } from "./routes.ts";
import { SAFETY_POST, STATIC_ROUTES, htmlRoutes, listFiles } from "./site.js";

const DIST = resolve(process.env.DIST_DIR ?? "dist");
const ROUTES = contentRoutes(resolve(import.meta.dirname, "../.."));

/** @type {string[]} */
let files = [];

beforeAll(() => {
  if (!existsSync(resolve(DIST, "index.html"))) {
    throw new Error(
      `${DIST} has no index.html; run \`CONTENT_DIR=tests/fixtures/content pnpm build\` first`,
    );
  }
  files = listFiles(DIST);
});

/** @param {string} file a dist-relative path */
const read = (file) => readFileSync(resolve(DIST, file), "utf8");

/** URL path a dist file is served at. @param {string} file */
const pagePath = (file) =>
  file === "index.html"
    ? "/"
    : file.endsWith("/index.html")
      ? `/${file.slice(0, -10)}`
      : `/${file}`;

describe("dist/ routes", () => {
  test.each([...STATIC_ROUTES, ...ROUTES.expected])("expected route %s exists", async (route) => {
    expect(await resolveFile(DIST, route), `${route} is missing from dist/`).not.toBeNull();
  });

  test("the fixtures give drafts, zh-only English URLs, and unused tags to check", () => {
    expect(ROUTES.absent).toEqual(
      expect.arrayContaining([
        "/tech/draft-post/",
        "/en/tech/draft-post/",
        "/en/travel/kyoto-walk/",
        "/tags/unused/",
      ]),
    );
  });

  test.each(ROUTES.absent)("route %s does not exist", async (route) => {
    expect(await resolveFile(DIST, route), `${route} is in dist/`).toBeNull();
  });

  test("the draft fixture is in no page, feed, or index", () => {
    const hits = files
      .filter((f) => /\.(?:html|xml|txt)$/.test(f))
      .filter((f) => /draft-post|Draft fixture post/.test(read(f)));
    expect(hits).toEqual([]);
  });

  test("only zh-tw (root, lang zh-TW) and en (/en/, lang en) pages exist", () => {
    const wrong = [];
    for (const route of htmlRoutes(DIST)) {
      const file = route.endsWith("/") ? `${route.slice(1)}index.html` : route.slice(1);
      const lang = parse(read(file)).querySelector("html")?.getAttribute("lang");
      const expected = route.startsWith("/en/") ? "en" : "zh-TW";
      if (lang !== expected) wrong.push(`${route}: lang=${lang}, expected ${expected}`);
      if (/^\/(?:zh|zh-tw|zh-hant|ja|ko|en-[a-z]+)(?:\/|$)/i.test(route)) {
        wrong.push(`${route}: a locale other than zh-tw (root) and en`);
      }
    }
    expect(wrong).toEqual([]);
  });
});

describe("dist/ references", () => {
  test("internal links and asset references resolve", async () => {
    const broken = [];
    for (const file of files) {
      const from = pagePath(file);
      /** @type {{ url: string, where: string }[]} */
      let refs = [];
      if (file.endsWith(".html")) refs = htmlRefs(read(file));
      else if (file.endsWith(".css"))
        refs = cssUrls(read(file)).map((url) => ({ url, where: "css" }));
      for (const { url, where } of refs) {
        const c = classify(url, from);
        if (c.kind !== "internal") continue;
        if (!(await resolveFile(DIST, c.path))) broken.push(`${file}: ${where} ${url}`);
      }
    }
    expect(broken, "broken internal references").toEqual([]);
  });

  test("no resource loads from another host", () => {
    const external = [];
    for (const file of files) {
      const from = pagePath(file);
      /** @type {{ url: string, loads: boolean, where: string }[]} */
      let refs = [];
      if (file.endsWith(".html")) refs = htmlRefs(read(file));
      else if (file.endsWith(".css"))
        refs = cssUrls(read(file)).map((url) => ({ url, loads: true, where: "css url()/@import" }));
      else if (/\.(?:xml|xsl)$/.test(file)) refs = xmlRefs(read(file));
      else if (/\.m?js$/.test(file))
        refs = jsRemoteLoads(read(file)).map((url) => ({
          url,
          loads: true,
          where: "js import/fetch",
        }));
      for (const { url, loads, where } of refs) {
        if (!loads) continue;
        const c = classify(url, from);
        if (c.kind === "external") external.push(`${file}: ${where} ${c.url}`);
      }
    }
    expect(external, "resources loaded from other hosts").toEqual([]);
  });
});

describe("content safety (T10)", () => {
  const safety = () => parse(read(`${SAFETY_POST.slice(1)}index.html`));

  test("raw HTML in content is shown as text, not as elements", () => {
    const body = safety().querySelector(".post__body");
    expect(body, "the safety fixture renders").not.toBeNull();
    for (const tag of ["script", "iframe", "object", "embed", "img"]) {
      expect(body?.querySelectorAll(tag).length, `<${tag}> in the post body`).toBe(0);
    }
    expect(body?.textContent).toContain('<script>alert("raw script")</script>');
    expect(body?.textContent).toContain("onerror=");
    expect(body?.innerHTML).not.toContain("<!--");
  });

  test("no page has a javascript: URL or an event handler attribute from content", () => {
    const hits = [];
    for (const f of files.filter((x) => x.endsWith(".html"))) {
      for (const el of parse(read(f)).querySelectorAll("*")) {
        for (const [name, value] of Object.entries(el.attributes)) {
          if (/^on/i.test(name)) hits.push(`${f}: <${el.tagName.toLowerCase()} ${name}>`);
          if (/^\s*javascript:/i.test(value)) hits.push(`${f}: ${name}=${value}`);
        }
      }
    }
    expect(hits).toEqual([]);
  });

  test("links with a javascript: URL lose their href; ordinary links keep it", () => {
    const links = safety().querySelectorAll(".post__body a");
    const byText = Object.fromEntries(links.map((a) => [a.textContent, a.getAttribute("href")]));
    expect(byText["javascript link"]).toBeUndefined();
    expect(byText["mixed-case javascript link"]).toBeUndefined();
    expect(byText["ordinary link"]).toBe("https://example.com/");
  });

  test("a title with </script> stays text, and every JSON-LD block parses", () => {
    const root = safety();
    expect(root.querySelector("h1")?.textContent).toBe("</script><script>alert(1)</script>");
    const inlineScripts = root.querySelectorAll(
      'script:not([src]):not([type="application/ld+json"])',
    );
    expect(inlineScripts.some((s) => /alert\(1\)/.test(s.textContent))).toBe(false);
    for (const f of files.filter((x) => x.endsWith(".html"))) {
      for (const s of parse(read(f)).querySelectorAll('script[type="application/ld+json"]')) {
        expect(s.textContent, f).not.toMatch(/<\/?script/i);
        expect(() => JSON.parse(s.textContent), f).not.toThrow();
      }
    }
    const ld = JSON.parse(
      root.querySelector('script[type="application/ld+json"]')?.textContent ?? "",
    );
    expect(ld.headline).toContain("</script><script>alert(1)</script>");
  });
});

describe("the front page ink (off by default, ADR-0019)", () => {
  test.each(["index.html", "en/index.html"])("%s shows the static fallback only", (file) => {
    const root = parse(read(file));
    expect(root.querySelector(".ink--hero .ink__fallback")).not.toBeNull();
    expect(root.querySelector("fluid-ink")).toBeNull();
  });

  test("no page loads the ink script", () => {
    const pages = files.filter((f) => f.endsWith(".html"));
    const loading = pages.filter((f) =>
      parse(read(f))
        .querySelectorAll("script[src], link[rel=modulepreload]")
        .some((el) => /fluid|ink/i.test(el.getAttribute("src") ?? el.getAttribute("href") ?? "")),
    );
    expect(loading).toEqual([]);
  });
});

describe("Japanese accents removed", () => {
  test("no page has kana or the theme's Japanese marks", () => {
    const hits = files
      .filter((f) => f.endsWith(".html"))
      .flatMap((f) => {
        const text = parse(read(f)).textContent;
        const m = text.match(/[぀-ヿ]|墨と|INK IN WATER|INK AND SPACE/g);
        return m ? [`${f}: ${[...new Set(m)].join(" ")}`] : [];
      });
    expect(hits).toEqual([]);
  });
});

describe("build log", () => {
  test("has no warning outside the allowlist and no deprecation", () => {
    expect(existsSync(BUILD_LOG), `${BUILD_LOG} is missing; run \`pnpm build\``).toBe(true);
    const { disallowed } = findWarnings(readFileSync(BUILD_LOG, "utf8"), WARNING_ALLOWLIST);
    expect(disallowed, "build warnings").toEqual([]);
  });
});
