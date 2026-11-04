# ADR-0019: Sumi instead of Retypeset, on the unified pipeline, with a Taiwan-standard font
- Status: accepted (the author merged PR #123 and re-specified T09, #58, on 2026-11-04); applied in T09
- Date: 2026-11-04
- Deciders: Janus (author); proposed by the Site Engineer (task #122)
- Supersedes: [ADR-0001](ADR-0001-astro-and-retypeset.md) (the theme and its "keep the original design" rule). ADR-0001's Astro 7, static output, unified Markdown pipeline, and build-time Mermaid decisions carry over unchanged.

## Context
ADR-0001 chose Retypeset because it was the only theme reviewed with first-class Traditional Chinese support. Sumi, the author's first pick for its look, was set aside for lacking i18n, search, math, Mermaid, and a CJK font.

On 2026-11-04 the author said they prefer Sumi's layout, and that Taiwan Ministry of Education glyph forms matter. Retypeset's bundled EarlySummer Serif uses traditional print forms. Any theme can use an open-licensed Taiwan-standard font such as Noto Serif TC, so the font no longer favors Retypeset. PR #121 (T09, Retypeset on Astro 7) is on hold.

The re-evaluation is in [`docs/reports/theme-reevaluation.md`](../reports/theme-reevaluation.md):
- Sumi is [kpab/astro-sumi](https://github.com/kpab/astro-sumi), MIT, native Astro 7; it builds and type-checks cleanly on Astro 7.4.5.
- KaTeX and build-time Mermaid work in Sumi with the same `unified()` processor as PR #121, because Sumi depends on no Markdown plugins.
- Sumi's remaining gaps are i18n chrome, CJK typesetting rules, callouts, search, and a CJK OG font. Each has a bounded fix; search, OG images, topic hubs, and routing are rebuilt by T11–T13 on either theme.
- With Noto Serif TC in both themes, the side-by-side screenshots compare layout only.

## Decision
- Vendor Sumi at `c6bbdd91417cb0a624e7abbb570544c951ac5c6f` (v1.0.0) in place of Retypeset. We own the code and never merge upstream, as with Retypeset.
- Use the unified pipeline from ADR-0001: `markdown.processor: unified({ remarkPlugins, rehypePlugins })`, KaTeX, and `rehype-mermaid` with `strategy: 'inline-svg'`. Callouts use the `:::note` directives that `docs/content-model.md` names, ported from Retypeset's plugin. Text and leaf directives that no plugin handles are turned back into their source text, so `1:15` stays text instead of becoming an empty `<div>`.
- Chinese text uses **Noto Serif TC** (SIL OFL 1.1, Taiwan forms), self-hosted and subset at build time to a measured font budget. Sumi's Latin faces (Source Serif 4, JetBrains Mono, OFL 1.1) stay first in the stack, except for CJK punctuation, which is routed to the CJK face. `THIRD_PARTY_NOTICES.md` also records Sumi's OG font, `src/assets/fonts/jetbrains-mono-latin-400.ttf`, which sits outside `public/fonts/` and its license file.
- Keep Sumi's design: tokens, layout, header, TOC rail, and palettes. These changes are made to fit our requirements, and every other visible change needs the author's approval (`needs-human`):
  - CJK typesetting rules ported from Retypeset's heti-based styles;
  - no synthetic italics for Chinese;
  - an AA-compliant code highlighting theme;
  - the Japanese accents replaced by the author's text;
  - i18n chrome for `zh-tw` (root) and `en` (`/en/`).
- The WebGL ink ships disabled (`INK.hero` and `INK.divider` false, static gradient shown) until the author decides after a real-phone test. Turning it on is a configuration change, not a redesign.
- PR #121 is closed unmerged. Its test harness, toolchain choices, and verification approach are reused in the new T09. Its Retypeset-specific decisions (Pinyon Script, removed sounds, callout colors) lapse.

## Alternatives considered
- **Finish on Retypeset (PR #121) with Noto Serif TC.** Cheapest: T09 is done and approved, and only the font swap, its subsetting, and a directive fix remain. Rejected only because the author prefers Sumi's layout. This remains the fallback if this ADR is not accepted.
- **Sumi on Sätteri.** No KaTeX or Mermaid-to-SVG plugins exist for Sätteri (ADR-0001), and the trial needed none of Sätteri's features.
- **Another Latin-first theme (Kami, Pilcrow, Patrika, Erudite).** Not re-evaluated; the author named Sumi.

## Consequences
- T09 (#58) is re-specified as "Vendor Sumi"; T10–T13 need the text changes listed in the report. Net cost is about one extra medium task compared with finishing on Retypeset.
- Sumi's upstream is young and has one maintainer. The monthly upstream watch in `docs/operations.md` records Sumi's last reviewed commit instead of Retypeset's.
- A CJK font budget is required on either theme. Noto Serif TC as packaged by Fontsource loads about 1.0 MB for one short post, against T09's 400 KB budget, so build-time subsetting becomes part of the theme task.
- `AGENTS.md`, `docs/overview.md`, `docs/roadmap.md` (R11), and the plan issue #53 stop describing Retypeset when the decision is applied.

## Revisit when
- The CJK typesetting port cannot reach the author's standard without large changes to Sumi's layout.
- The font budget cannot be met with subsetting.
- Sätteri gains KaTeX and diagram support (as in ADR-0001).

## Applied in T09 (#58), 2026-11-04
Choices made while applying this decision, so a later agent does not undo them by accident:
- **Font subsetting.** The source is `@fontsource-variable/noto-serif-tc` (npm, OFL 1.1): the variable font (wght 200–900) in about 100 unicode-range slices. After `astro build`, `src/lib/fonts/cjk-font.ts` (an Astro integration) subsets each slice the built pages use to exactly their glyphs with `subset-font` (BSD-3-Clause; HarfBuzz through `harfbuzzjs`, MIT), writes one hashed stylesheet whose `@font-face` rules keep per-file `unicode-range`, and points every page at it. Slices instead of one merged file keep each page's download to the slices its own text needs as the site grows. Fontsource's Latin, Cyrillic, and Vietnamese slices are never used. No font file is committed. `astro dev` injects the full slices instead.
- **Font budget.** First load of the fixture post: 336,403 font bytes (Source Serif 4, JetBrains Mono, KaTeX, and 13 Noto files of 132,248 bytes for 282 codepoints), under the 400,000-byte budget. The subset grows with the site's distinct characters; the budget test (`tests/e2e/font-bytes.spec.js`) will show when that matters (R11).
- **CJK punctuation.** A second family, "Noto Serif TC Punct", covers only U+2014 and U+2026 and goes first in the serif stack on `:lang(zh)` pages, so English pages keep Source Serif's dashes and ellipses.
- **No italics for Chinese**: `:lang(zh)` quotes and `em` are upright; `em` takes emphasis dots under the text (著重號) so emphasis stays visible.
- **Code highlighting.** Sumi's vitesse pair is kept; token colors below 4.5:1 on Sumi's code background are darkened or lightened in place (`src/lib/markdown/code-contrast.ts`), which keeps their hue.
- **Callouts** keep Retypeset's markup (`blockquote.admonition-<type>`, `.admonition-title`) and use Sumi's tokens: fg-muted for note and tip, fg for important, the vermilion accent for warning and caution.
- **Mermaid** labels use the site's serif stack (Source Serif 4, then Noto Serif TC). rehype-mermaid loads those fonts into its build-time Chromium from `file:` URLs before rendering, so the label boxes it measures fit the text the reader sees; the subset includes the diagram text. In dark mode, edges and arrowheads take Sumi's muted foreground (3:1 or more; `src/styles/mermaid.css`); the diagrams are otherwise Mermaid's light default theme (T12 decides dark diagrams).
- **The ink** is off (`INK.hero`, `INK.divider` false). Its module (10,647 bytes, 3,783 gzipped) is still emitted to `dist/_astro/` but no page loads it.
- **Removed from upstream**: the Japanese marks and rails (`墨`, `墨と水`, `墨と余白`, the `.tategaki` helper), the About page (theme demo copy; `pages` arrive with T10), MDX (`docs/content-model.md` allows none), and the demo posts. The 404 page's decorative `無` stays: it is also Chinese.
- **Interim routing.** The home page and posts render in both locales (`src/pages/[...lang]/`); the blog and tag archives exist at the root only, and the English navigation links to them until T11.
