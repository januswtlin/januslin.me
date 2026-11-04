import { unified } from '@astrojs/markdown-remark'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import Compress from 'astro-compress'
import { defineConfig } from 'astro/config'
import rehypeKatex from 'rehype-katex'
import rehypeMermaid from 'rehype-mermaid'
import rehypeSlug from 'rehype-slug'
import remarkDirective from 'remark-directive'
import remarkMath from 'remark-math'
import UnoCSS from 'unocss/astro'
import { base, defaultLocale, themeConfig } from './src/config'
import { langMap } from './src/i18n/config'
import { rehypeCodeCopyButton } from './src/plugins/rehype-code-copy-button.mjs'
import { rehypeExternalLinks } from './src/plugins/rehype-external-links.mjs'
import { rehypeHeadingAnchor } from './src/plugins/rehype-heading-anchor.mjs'
import { rehypeImageProcessor } from './src/plugins/rehype-image-processor.mjs'
import { remarkContainerDirectives } from './src/plugins/remark-container-directives.mjs'
import { remarkReadingTime } from './src/plugins/remark-reading-time.mjs'

const { url: site } = themeConfig.site

export default defineConfig({
  site,
  base,
  trailingSlash: 'always', // Not recommended to change
  // Astro 7 defaults to JSX whitespace rules ('jsx'), which drop the spaces between inline
  // elements that Retypeset's templates rely on. `true` keeps Astro 6's HTML-aware
  // whitespace handling, so the original design renders unchanged (T09, #58).
  compressHTML: true,
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport', // hover, tap, viewport, load
  },
  i18n: {
    locales: Object.entries(langMap).map(([path, codes]) => ({
      path,
      codes: [...codes] as [string, ...string[]],
    })),
    defaultLocale,
  },
  integrations: [
    UnoCSS({
      injectReset: true,
    }),
    mdx(),
    sitemap(),
    Compress({
      CSS: true,
      HTML: true,
      Image: false,
      JavaScript: true,
      SVG: false,
    }),
  ],
  markdown: {
    // The unified (remark/rehype) pipeline instead of Astro 7's default Sätteri: the theme's
    // plugins, KaTeX, and build-time Mermaid are unified plugins (ADR-0001).
    processor: unified({
      remarkPlugins: [
        remarkDirective,
        remarkMath,
        remarkContainerDirectives,
        remarkReadingTime,
      ],
      rehypePlugins: [
        rehypeKatex,
        // Mermaid renders to inline SVG at build time (headless Chromium through
        // Playwright), so pages ship no Mermaid JavaScript (ADR-0001).
        [rehypeMermaid, { strategy: 'inline-svg' }],
        rehypeSlug,
        rehypeHeadingAnchor,
        rehypeImageProcessor,
        rehypeExternalLinks,
        rehypeCodeCopyButton,
      ],
    }),
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['mermaid'],
    },
    shikiConfig: {
      // Available themes: https://shiki.style/themes
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
  vite: {
    plugins: [
      {
        name: 'prefix-font-urls-with-base',
        transform(code, id) {
          if (!id.split('?')[0].endsWith('src/styles/font.css')) {
            return null
          }

          return code.replace(/url\(\s*(['"]?)\/fonts\//g, `url($1${base}/fonts/`)
        },
      },
    ],
    build: {
      chunkSizeWarningLimit: 600,
    },
  },
  devToolbar: {
    enabled: false,
  },
})
