// The Markdown plugins of the content pipeline, in order (T10, #59), shared by astro.config.ts and
// the content-safety tests, so the tests run the order the site builds with.
//
// Raw HTML in content is disabled and unsafe URLs are dropped (./safety.ts): remarkNoRawHtml comes
// first, before plugins that add HTML of their own (the callout titles in ./directives.ts);
// rehypeSafeUrls comes before KaTeX and Mermaid add their output. astro.config.ts appends
// rehype-mermaid after these.
import rehypeKatex from "rehype-katex";
import remarkDirective from "remark-directive";
import remarkMath from "remark-math";

import { remarkDirectives } from "./directives.ts";
import { rehypeSafeUrls, remarkNoRawHtml } from "./safety.ts";

export const remarkPlugins = [remarkNoRawHtml, remarkDirective, remarkMath, remarkDirectives];

export const rehypePluginsBeforeMermaid = [rehypeSafeUrls, rehypeKatex];
