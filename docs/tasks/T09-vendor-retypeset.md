# T09: Vendor Retypeset, upgrade to Astro 7

- Role: Site Engineer
- Depends on: T08 · Human steps: T09-H1
- Identity: app (`januslin-agent[bot]`)
- Branch: `agent/site/T09-vendor-retypeset`
- Size: L

## Goal
A working Astro 7 site at the root, based on Retypeset with its original design, building with pnpm on Node 24, with zero external requests at runtime and a full test harness in `pnpm verify`.

## Read first
`AGENTS.md`, `docs/overview.md`, ADR-0001, `docs/content-model.md` (layout only), Retypeset's README and theme guide upstream, the Astro 7 upgrade guide. The archive's T01 PR (`januswtlin/januslin.me-archive` #10) did this once; read it for lessons, but this task keeps more of the original design and starts from upstream again.

## Scope
- Import Retypeset from `https://github.com/radishzzz/astro-theme-retypeset` at `a636b6d393be714cab52d3fc4baddd3f3905f701`, without upstream history, as its own commit ("chore: import Retypeset at a636b6d"), so our changes are a reviewable diff. If upstream has moved, still import `a636b6d` and note newer commits for the upstream watch.
- **Keep the original design:** fonts (Snell Roundhand, EarlySummer Serif, and the rest), UI sound effects, styles, layout, UnoCSS and its design tokens. No visible design change without `needs-human`.
- `THIRD_PARTY_NOTICES.md`: Retypeset's MIT license and, for each bundled font and sound file, its source and license. Where a license cannot be confirmed from a primary source, write "unverified" and why (V14); the author decides in the PR whether the asset stays (T09-H1).
- Upgrade to the latest stable Astro 7 and compatible integrations; fix breaking changes (unclosed HTML, collapsed whitespace between inline elements).
- Markdown: `markdown.processor: unified({ remarkPlugins, rehypePlugins })` from `@astrojs/markdown-remark` (ADR-0001); Mermaid with `rehype-mermaid` `strategy: 'inline-svg'`.
- Configure `site: 'https://januslin.me'`, locales `zh-tw` (default, unprefixed) and `en` (`/en/`) only; remove other locales and their strings.
- Remove: demo posts (keep at most one as a fixture), Netlify and Vercel config and buttons, the `update-theme` script, comment systems (Twikoo, Waline, Giscus) and their dependencies, Partytown and analytics, embeds that call third-party services from the reader's browser (`::github`, `::youtube`, `::bilibili`, `::tweet`, `::codepen`, `::spotify`), and Open Graph fallbacks that point at external services.
- Scripts: `dev`, `build`, `build:preview` (sets `INCLUDE_DRAFTS=true`; T10 wires it), `preview`, `astro`; `check` becomes `astro check` plus `tsc`; `verify` gains `build`. Lint config extended to `src/` in a way the vendored code passes without mass rewrites.
- Until T10, the posts collection reads `tests/fixtures/site/` (a fixture page with inline and display math, Mermaid, a callout, and a footnote, plus at most one demo post), never `content/`.
- Test harness, all in `pnpm test`:
  - Checks over `dist/` (`tests/dist/`): an expected-route list (`/`, `/en/`, the fixture post and its `/en/` counterpart if the theme pairs them, `/404.html`) exists; internal links and asset references resolve; no URL to another host in any position that loads a resource (`src`, `srcset`, `<link href>`, CSS `url()` and `@import`, JS `import` and `fetch`); outbound `<a href>` is fine; the build log has no warning outside a reasoned allowlist (deprecations never allowed).
  - Playwright (`tests/e2e/`) against a local static server of `dist/` on a free port: every route loads with 200, no console errors, zero requests to other hosts; the fixture renders KaTeX, a Mermaid `<svg>` with no script for it, the callout, and the footnote; `@axe-core/playwright` finds no serious or critical violation on `/` and the fixture.
  - Visual snapshots of `/`, `/en/`, and the fixture at 375 px and 1280 px, light and dark; Linux baselines recorded in the sandbox, the same platform as CI.
  - Font bytes: a Playwright test measures font data transferred on first load of the fixture post and reports it; it fails above 400 KB unless the PR records a measured budget the author accepts (the original fonts, Snell Roundhand included, are kept, so this is a budget, not a reason to drop them).
  - A unit test reads the installed `astro` version (7.x); a test greps `src/` and `package.json` for `twikoo`, `waline`, `giscus`, `partytown`, `gtag`, `umami`.
- Sound effects: if they play only on user interaction and load from the site itself, keep them as they are; if any loads from another host, self-host it.

## Out of scope
Collections and content (T10), routing (T11), SEO outputs (T13), font changes (roadmap R11).

## Human steps

- **T09-H1, licenses and look (15 min).** In the PR, read the `THIRD_PARTY_NOTICES.md` rows marked "unverified" and reply "keep" or "remove" for each; look at the screenshots and reply whether the site still looks like Retypeset.

## Acceptance criteria
- [ ] `pnpm install && pnpm verify` passes on Node 24; `astro --version` reports the latest stable 7.x.
- [ ] `pnpm dev` serves `/` and `/en/` with Retypeset's original look, including Snell Roundhand and the sound effects; only `zh-tw` and `en` exist (screenshots in the PR).
- [ ] The fixture renders inline and display math, Mermaid as inline SVG, a callout, and a footnote (test names, screenshot).
- [ ] Zero requests to other hosts from any page (test name).
- [ ] No comment system, analytics, Partytown, or third-party embed code remains (test name).
- [ ] `THIRD_PARTY_NOTICES.md` lists every bundled font and sound with its license or "unverified" (V14 updated in `docs/infra-current-state.md`).
- [ ] Each class of check is shown to fail on a deliberate break: an external `<script src>`, a broken internal link, a removed route, an axe violation, a visual change (output in the PR).

## Automated verification
- `pnpm verify` runs `check`, `lint`, `build`, `test` with everything in Scope.
- `pnpm exec playwright install chromium` is required before `pnpm build` (Mermaid); `AGENTS.md` and `docs/overview.md` already say so.
- Manual: the screenshots, the license review of each asset.
