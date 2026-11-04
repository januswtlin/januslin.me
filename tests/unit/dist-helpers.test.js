// Unit tests for the dist/ check helpers (T09, #58), so that the checks over dist/ are known
// to catch what they claim to catch.
import { describe, expect, it } from "vitest";
import { findWarnings } from "../dist/build-log.js";
import { classify, cssUrls, htmlRefs, jsRemoteLoads, xmlRefs } from "../dist/refs.js";

describe("classify", () => {
  it("treats the site's own origin and relative paths as internal", () => {
    expect(classify("https://januslin.me/en/", "/")).toEqual({ kind: "internal", path: "/en/" });
    expect(classify("../a.css", "/posts/x/")).toEqual({ kind: "internal", path: "/posts/a.css" });
    expect(classify("b.png", "/404.html")).toEqual({ kind: "internal", path: "/b.png" });
  });
  it("flags other hosts, protocol-relative included", () => {
    expect(classify("https://cdn.example.com/x.js", "/").kind).toBe("external");
    expect(classify("//player.example.com/p", "/").kind).toBe("external");
  });
  it("skips fragments and non-fetching schemes", () => {
    for (const ref of ["#top", "mailto:a@b.c", "data:image/png;base64,AA", "javascript:void 0"]) {
      expect(classify(ref, "/").kind).toBe("skip");
    }
  });
});

describe("htmlRefs", () => {
  const html = `<html><head>
    <link rel="stylesheet" href="https://fonts.example.com/a.css">
    <script src="https://cdn.example.com/s.js"></script>
    <script>fetch("https://api.example.com/x"); import("//cdn.example.com/m.js")</script>
    <style>@import "https://e.example/x.css"; body{background:url(/bg.png)}</style>
  </head><body>
    <img src="/a.png" srcset="/a-1x.png 1x, https://img.example.com/a-2x.png 2x">
    <a href="https://example.org/">out</a>
    <div style="background:url('https://bg.example.com/i.png')"></div>
  </body></html>`;
  const refs = htmlRefs(html);
  const loads = refs.filter((r) => r.loads).map((r) => r.url);
  it("finds every resource position", () => {
    expect(loads).toEqual(
      expect.arrayContaining([
        "https://fonts.example.com/a.css",
        "https://cdn.example.com/s.js",
        "https://api.example.com/x",
        "//cdn.example.com/m.js",
        "https://e.example/x.css",
        "/bg.png",
        "/a.png",
        "https://img.example.com/a-2x.png",
        "https://bg.example.com/i.png",
      ]),
    );
  });
  it("does not count an outbound <a href> as a load", () => {
    expect(refs.find((r) => r.url === "https://example.org/")?.loads).toBe(false);
  });
});

describe("cssUrls and jsRemoteLoads", () => {
  it("reads url() with and without quotes, and @import", () => {
    expect(
      cssUrls(`a{b:url(x.woff2)}c{d:url("/y.png")}@import 'https://e.example/z.css';`),
    ).toEqual(["x.woff2", "/y.png", "https://e.example/z.css"]);
  });
  it("finds static and dynamic imports and fetch of absolute URLs only", () => {
    const js =
      'import a from"https://esm.example/a.js";import("https://esm.example/b.js");' +
      'fetch(`//api.example/c`);fetch("/data.json");import("./chunk.js")';
    expect(jsRemoteLoads(js).sort()).toEqual(
      ["//api.example/c", "https://esm.example/a.js", "https://esm.example/b.js"].sort(),
    );
  });
});

describe("xmlRefs", () => {
  it("reads xml-stylesheet instructions and escaped or CDATA HTML in feeds", () => {
    const xml = `<?xml version="1.0"?>
<?xml-stylesheet href="https://xsl.example.com/s.xsl" type="text/xsl"?>
<rss><channel><item>
  <description>&lt;img src="https://img.example.com/a.png"&gt;</description>
  <content:encoded><![CDATA[<p><img src="/local.png"><script src="//cdn.example.com/x.js"></script></p>]]></content:encoded>
</item></channel></rss>`;
    const loads = xmlRefs(xml)
      .filter((r) => r.loads)
      .map((r) => r.url);
    expect(loads).toEqual(
      expect.arrayContaining([
        "https://xsl.example.com/s.xsl",
        "https://img.example.com/a.png",
        "/local.png",
        "//cdn.example.com/x.js",
      ]),
    );
  });
  it("ignores namespace URIs in XSL", () => {
    const xsl = `<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<svg xmlns="http://www.w3.org/2000/svg"><path fill="url(#g)"/></svg></xsl:stylesheet>`;
    expect(xmlRefs(xsl).filter((r) => classify(r.url, "/feeds/x.xsl").kind === "external")).toEqual(
      [],
    );
  });
});

describe("findWarnings", () => {
  const log = [
    "\u001b[33m[WARN]\u001b[39m [content] something odd",
    "12:00:00 [build] 3 page(s) built",
    "(!) Some chunks are larger than 500 kB",
    "[WARN] [vite] `foo` is deprecated",
  ].join("\n");
  it("reports warnings that no allowlist entry matches", () => {
    expect(findWarnings(log, []).disallowed).toHaveLength(3);
  });
  it("honours the allowlist but never for a deprecation", () => {
    const allow = [
      { pattern: /something odd/, reason: "test" },
      { pattern: /chunks are larger/, reason: "test" },
      { pattern: /deprecated/, reason: "must not count" },
    ];
    expect(findWarnings(log, allow).disallowed).toEqual(["[WARN] [vite] `foo` is deprecated"]);
  });
});
