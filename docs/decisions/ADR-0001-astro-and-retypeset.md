# ADR-0001: Astro 7 with a vendored Retypeset theme, kept to its original design
- Status: accepted
- Date: 2026-10-29
- Deciders: Janus (author), coordinator session

## Context
Content is mostly Traditional Chinese, literary in tone (essays, travel memoir), with tech and AI writing that needs math and diagrams. CJK typography (serif fonts, punctuation, spacing between CJK and Latin) is the hardest thing to retrofit into a theme. Of the Astro themes reviewed on 2026-10-27 (Retypeset, Sumi, Astro Kami, Erudite, Pilcrow, Patrika), only Retypeset has first-class Traditional Chinese support (heti, EarlySummer Serif, a `zh-tw` locale), i18n with an unprefixed default locale, KaTeX, Mermaid, TOC, and OG images. The others are Latin-first and would fall back to system fonts for Chinese.

Retypeset is a starter template, not a library. Upstream `master` is at `a636b6d393be714cab52d3fc4baddd3f3905f701` (2026-04-12) on Astro 6. We restructure collections and routing heavily, so upstream merges would conflict constantly.

The author likes Retypeset's design as it is, including its Snell Roundhand display font and its UI sound effects.

## Decision
- Astro 7 (latest stable), static output, with Retypeset vendored into this repository at `a636b6d`. We own the code and never merge upstream.
- **Keep the original design:** fonts (including Snell Roundhand and EarlySummer Serif), UI sound effects, styles, layout, and UnoCSS design tokens. Visible design changes need the author's approval (`needs-human`). No second CSS framework.
- Remove only what breaks our constraints: comment systems, analytics, Partytown, embeds and fallbacks that make the reader's browser call third-party services, deploy buttons for other hosts, the `update-theme` script, and locales other than `zh-tw` (root) and `en` (`/en/`).
- **Markdown:** the unified (remark/rehype) pipeline through `@astrojs/markdown-remark`, set with `markdown.processor: unified({ remarkPlugins, rehypePlugins })`. Astro 7's default processor, Sätteri, has its own plugin API and no KaTeX renderer or Mermaid-to-SVG plugin, and the theme's directive, heading, image, and code-copy plugins are unified-only. (Reached from the APIs and a working unified build, not a Sätteri trial build.)
- **Mermaid** renders to inline SVG at build time (`rehype-mermaid`, `strategy: 'inline-svg'`), so pages ship no Mermaid JavaScript. It drives headless Chromium through Playwright during `pnpm build`, so every environment that builds needs `pnpm exec playwright install chromium`.
- **Upstream watch:** once a month the Upgrade Engineer compares upstream with the last reviewed upstream commit recorded in `docs/operations.md`, ports fixes worth having by hand, and records the new SHA.
- The licenses of the bundled fonts and sound effects are not verified yet (V14). The vendoring task records each one in `THIRD_PARTY_NOTICES.md`, marked unverified where it cannot confirm it, and the author decides whether an unverified asset stays.

## Alternatives considered
- Sumi (the author's first pick for its look): no i18n, search, math, Mermaid, or CJK font.
- Kami, Pilcrow, Patrika, Erudite: Latin-first typography.
- Tracking upstream (`update-theme` or regular merges): constant conflicts once collections and routing change.
- Replacing Retypeset's fonts after a CJK font specimen: dropped while the original design is kept; roadmap R11.

## Consequences
- The vendoring task upgrades Retypeset from Astro 6 to 7 and fixes breaking changes (the Astro 7 compiler no longer corrects unclosed HTML; whitespace between inline elements collapses).
- `playwright` is a devDependency the build needs, not only the tests.
- The inline-svg Mermaid strategy has no dark variant; a CSS filter inverts diagrams in dark mode unless the media task finds something better.
- Upstream security or Astro-compatibility fixes reach us only through the monthly watch.

## Revisit when
- The vendored theme becomes a larger burden than a redesign, or the author wants a visual refresh.
- Sätteri gains KaTeX and diagram support and porting the theme's plugins becomes cheap.
- V14 finds a license that does not allow redistribution.
