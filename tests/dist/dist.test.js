// Checks over the built site in dist/ (T09, #58). Run `pnpm build` first; `pnpm verify` does.
// - every expected route exists;
// - every internal link and asset reference resolves to a file in dist/;
// - nothing loads a resource from another host (src, srcset, <link href>, CSS url() and
//   @import, JS import and fetch); outbound <a href> is fine;
// - the build log has no warning outside the reasoned allowlist, and never a deprecation.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, test } from "vitest";
import { resolveFile } from "../e2e/static-server.js";
import { EXPECTED_ROUTES, listFiles } from "./site.js";
import { classify, cssUrls, htmlRefs, jsRemoteLoads } from "./refs.js";
import { BUILD_LOG, WARNING_ALLOWLIST, findWarnings } from "./build-log.js";

const DIST = resolve(process.env.DIST_DIR ?? "dist");

/** @type {string[]} */
let files = [];

beforeAll(() => {
  if (!existsSync(resolve(DIST, "index.html"))) {
    throw new Error(`${DIST} has no index.html; run \`pnpm build\` first`);
  }
  files = listFiles(DIST);
});

/** @param {string} file a dist-relative path */
const read = (file) => readFileSync(resolve(DIST, file), "utf8");

/** URL path a dist file is served at. @param {string} file */
const pagePath = (file) =>
  file === "index.html" ? "/" : file.endsWith("/index.html") ? `/${file.slice(0, -10)}` : `/${file}`;

describe("dist/ routes", () => {
  test.each(EXPECTED_ROUTES)("expected route %s exists", async (route) => {
    expect(await resolveFile(DIST, route), `${route} is missing from dist/`).not.toBeNull();
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
      else if (file.endsWith(".css")) refs = cssUrls(read(file)).map((url) => ({ url, where: "css" }));
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
      else if (/\.m?js$/.test(file))
        refs = jsRemoteLoads(read(file)).map((url) => ({ url, loads: true, where: "js import/fetch" }));
      for (const { url, loads, where } of refs) {
        if (!loads) continue;
        const c = classify(url, from);
        if (c.kind === "external") external.push(`${file}: ${where} ${c.url}`);
      }
    }
    expect(external, "resources loaded from other hosts").toEqual([]);
  });
});

describe("build log", () => {
  test("has no warning outside the allowlist and no deprecation", () => {
    expect(existsSync(BUILD_LOG), `${BUILD_LOG} is missing; run \`pnpm build\``).toBe(true);
    const { disallowed } = findWarnings(readFileSync(BUILD_LOG, "utf8"), WARNING_ALLOWLIST);
    expect(disallowed, "build warnings").toEqual([]);
  });
});
