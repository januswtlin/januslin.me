// Content safety for Markdown (T10, #59; docs/content-model.md, "Rich content").
//
// Raw HTML in content is disabled: HTML comments are dropped, and any other HTML is shown as the
// text it was written as, so nothing in it can run (no <script>, <iframe>, <object>, <embed>, or
// event handlers). Rich content uses Markdown and the directives handled by site code instead.
// Links and images keep only http:, https:, mailto:, tel:, and relative URLs, so a
// `javascript:` link is left without its href.
//
// remarkNoRawHtml must run before every other remark plugin: later plugins may create HTML nodes
// of their own (the callout titles in ./directives.ts). rehypeSafeUrls runs first among the rehype
// plugins, on the tree the Markdown produced, before KaTeX and Mermaid add their trusted output.
import { SKIP, visit } from "unist-util-visit";

interface Node {
  type: string;
  value?: string;
  children?: Node[];
  tagName?: string;
  properties?: Record<string, unknown>;
}

const COMMENT = /^\s*<!--[\s\S]*?-->\s*$/;

/** mdast nodes whose children are phrasing content. */
const PHRASING = new Set([
  "paragraph",
  "heading",
  "emphasis",
  "strong",
  "delete",
  "link",
  "linkReference",
  "tableCell",
  "textDirective",
]);

/** Remark plugin: raw HTML becomes text; HTML comments are removed. */
export function remarkNoRawHtml() {
  return (tree: unknown) => {
    visit(tree as never, "html", (n: unknown, index: number | undefined, parent: unknown) => {
      const node = n as Node;
      const siblings = (parent as Node | undefined)?.children;
      if (index === undefined || !siblings) return;
      if (COMMENT.test(node.value ?? "")) {
        siblings.splice(index, 1);
        return [SKIP, index];
      }
      const text: Node = { type: "text", value: node.value ?? "" };
      // Inline HTML sits inside phrasing content; block HTML sits where paragraphs do.
      const inline = PHRASING.has((parent as Node).type);
      siblings[index] = inline ? text : { type: "paragraph", children: [text] };
      return [SKIP, index + 1];
    });
  };
}

/** URL schemes allowed in content links and images. Relative URLs and fragments are fine. */
export const SAFE_SCHEMES = ["http:", "https:", "mailto:", "tel:"];

/** Whether a URL from content may stay: relative, a fragment, or a SAFE_SCHEMES URL. */
export function isSafeUrl(url: string): boolean {
  // Browsers ignore ASCII whitespace and control characters inside a scheme ("java\tscript:").
  const compact = url.replace(/[\u0000- \u007f]+/g, "").toLowerCase(); // eslint-disable-line no-control-regex
  const scheme = /^([a-z][a-z0-9+.-]*):/.exec(compact);
  return !scheme || SAFE_SCHEMES.includes(`${scheme[1]}:`);
}

const URL_PROPERTIES = [
  "href",
  "src",
  "srcSet",
  "cite",
  "action",
  "formAction",
  "poster",
  "xLinkHref",
  "background",
];
const BLOCKED_ELEMENTS = new Set([
  "script",
  "iframe",
  "object",
  "embed",
  "frame",
  "frameset",
  "base",
  "form",
  "style",
  "link",
  "meta",
]);

/** Rehype plugin: drops unsafe URLs, event handler attributes, and elements that load or run code. */
export function rehypeSafeUrls() {
  return (tree: unknown) => {
    visit(tree as never, "element", (n: unknown, index: number | undefined, parent: unknown) => {
      const node = n as Node;
      if (BLOCKED_ELEMENTS.has(node.tagName ?? "") && index !== undefined && parent) {
        (parent as Node).children?.splice(index, 1);
        return [SKIP, index];
      }
      const props = node.properties ?? {};
      for (const key of Object.keys(props)) {
        if (/^on/i.test(key)) delete props[key];
        else if (
          URL_PROPERTIES.includes(key) &&
          typeof props[key] === "string" &&
          !isSafeUrl(props[key] as string)
        )
          delete props[key];
      }
    });
  };
}
