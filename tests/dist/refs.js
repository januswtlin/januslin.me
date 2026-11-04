// Reference extraction for the dist/ checks (T09, #58): which URLs an HTML, CSS, or JS file
// refers to, and whether each one is internal to the site or on another host.
import { parse } from "node-html-parser";
import { SITE_ORIGIN } from "./site.js";

const SKIP_SCHEMES = /^(?:mailto:|tel:|javascript:|data:|blob:|about:)/i;

/**
 * Classifies a reference found in a file served at `from`.
 * @param {string} raw
 * @param {string} from
 * @returns {{ kind: "skip" } | { kind: "external", url: string } | { kind: "internal", path: string }}
 */
export function classify(raw, from) {
  const ref = raw.trim();
  if (!ref || ref.startsWith("#") || SKIP_SCHEMES.test(ref)) return { kind: "skip" };
  if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(ref)) {
    const url = new URL(ref, SITE_ORIGIN);
    if (url.origin !== SITE_ORIGIN) return { kind: "external", url: url.href };
    return { kind: "internal", path: url.pathname };
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(ref)) return { kind: "external", url: ref };
  const url = new URL(ref, `${SITE_ORIGIN}${from}`);
  return { kind: "internal", path: url.pathname };
}

/** @param {string} srcset */
const srcsetUrls = (srcset) =>
  srcset
    .split(",")
    .map((c) => c.trim().split(/\s+/)[0])
    .filter(Boolean);

/** CSS url() and @import targets. @param {string} css */
export function cssUrls(css) {
  const out = [];
  for (const m of css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi)) out.push(m[2]);
  for (const m of css.matchAll(/@import\s+(['"])([^'"]+)\1/gi)) out.push(m[2]);
  return out;
}

/** Absolute or protocol-relative URLs that JavaScript imports or fetches. @param {string} js */
export function jsRemoteLoads(js) {
  const q = "[\"'`]";
  const target = "((?:[a-z][a-z0-9+.-]*:)?\\/\\/[^\"'`\\s]+)";
  const patterns = [
    new RegExp(`\\bimport\\s*\\(\\s*${q}${target}`, "gi"),
    new RegExp(`\\bfrom\\s*${q}${target}`, "gi"),
    new RegExp(`\\bimport\\s*${q}${target}`, "gi"),
    new RegExp(`\\bfetch\\s*\\(\\s*${q}${target}`, "gi"),
    new RegExp(`\\bimportScripts\\s*\\(\\s*${q}${target}`, "gi"),
  ];
  return patterns.flatMap((p) => [...js.matchAll(p)].map((m) => m[1]));
}

/**
 * Every reference in an HTML file, with whether it loads a resource.
 * @param {string} html
 * @returns {{ url: string, loads: boolean, where: string }[]}
 */
export function htmlRefs(html) {
  const root = parse(html, { comment: false });
  const refs = [];
  for (const el of root.querySelectorAll("*")) {
    const tag = el.tagName.toLowerCase();
    const src = el.getAttribute("src");
    if (src) refs.push({ url: src, loads: true, where: `<${tag} src>` });
    for (const attr of ["srcset", "imagesrcset"]) {
      const v = el.getAttribute(attr);
      if (v) for (const u of srcsetUrls(v)) refs.push({ url: u, loads: true, where: `<${tag} ${attr}>` });
    }
    const href = el.getAttribute("href");
    if (href && tag === "link") refs.push({ url: href, loads: true, where: `<link href>` });
    if (href && tag === "a") refs.push({ url: href, loads: false, where: `<a href>` });
    if (tag === "meta" && /^og:image$/i.test(el.getAttribute("property") ?? "")) {
      refs.push({ url: el.getAttribute("content") ?? "", loads: false, where: "og:image" });
    }
    const style = el.getAttribute("style");
    if (style) for (const u of cssUrls(style)) refs.push({ url: u, loads: true, where: `<${tag} style>` });
    if (tag === "style") for (const u of cssUrls(el.text)) refs.push({ url: u, loads: true, where: "<style>" });
    if (tag === "script" && !src) {
      for (const u of jsRemoteLoads(el.text)) refs.push({ url: u, loads: true, where: "<script>" });
    }
  }
  return refs;
}
