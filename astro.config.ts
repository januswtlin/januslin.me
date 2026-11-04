import { defineConfig } from "astro/config";

import { unified } from "@astrojs/markdown-remark";
import sitemap from "@astrojs/sitemap";
import rehypeKatex from "rehype-katex";
import rehypeMermaid from "rehype-mermaid";
import remarkDirective from "remark-directive";
import remarkMath from "remark-math";

import { SITE } from "./src/config";
import { DEFAULT_LOCALE, HTML_LANG, LOCALES } from "./src/i18n";
import { MERMAID_FONT_FAMILY, cjkFont, writeMermaidStylesheet } from "./src/lib/fonts/cjk-font";
import { codeThemes } from "./src/lib/markdown/code-contrast";
import { remarkDirectives } from "./src/lib/markdown/directives";

// https://astro.build/config
export default defineConfig({
  site: SITE.url,
  // zh-tw at the root, en under /en/ (ADR-0005). T11 builds the full routing.
  i18n: {
    locales: LOCALES.map((path) => ({ path, codes: [HTML_LANG[path]] })),
    defaultLocale: DEFAULT_LOCALE,
    routing: { prefixDefaultLocale: false },
  },
  integrations: [sitemap(), cjkFont()],

  markdown: {
    // The unified (remark/rehype) pipeline instead of Astro 7's default Sätteri: KaTeX and
    // build-time Mermaid are unified plugins (ADR-0001, kept by ADR-0019).
    processor: unified({
      remarkPlugins: [remarkDirective, remarkMath, remarkDirectives],
      rehypePlugins: [
        rehypeKatex,
        // Mermaid renders to inline SVG at build time (headless Chromium through
        // Playwright), so pages ship no Mermaid JavaScript. Labels use the site's serif stack,
        // and the renderer loads those fonts first, so the label boxes it measures fit the text
        // the reader's browser draws (src/lib/fonts/cjk-font.ts).
        [
          rehypeMermaid,
          {
            strategy: "inline-svg",
            css: writeMermaidStylesheet(new URL("./", import.meta.url)),
            mermaidConfig: {
              fontFamily: MERMAID_FONT_FAMILY,
              themeVariables: { fontFamily: MERMAID_FONT_FAMILY },
            },
          },
        ],
      ],
    }),
    syntaxHighlight: {
      type: "shiki",
      excludeLangs: ["mermaid"],
    },
    shikiConfig: {
      // Sumi's muted vitesse pair, with the token colors that fall below WCAG AA on Sumi's code
      // background raised to 4.5:1 (src/lib/markdown/code-contrast.ts).
      themes: codeThemes,
      // Emit both palettes as custom properties rather than baking one in, so
      // the theme toggle switches highlighting with everything else. See the
      // code block rules in src/styles/prose.css.
      defaultColor: false,
      wrap: false,
    },
  },
});
