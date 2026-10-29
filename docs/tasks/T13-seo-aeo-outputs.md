# T13: SEO and AEO outputs

- Role: SEO/AEO Engineer (Site Engineer's code areas)
- Depends on: T11 · Human steps: none
- Identity: app (`januslin-agent[bot]`)
- Branch: `agent/site/T13-seo-aeo`
- Size: M

## Goal
Implement every item in the "Required outputs" checklist of `docs/seo-aeo.md`, theme-independently, with automated tests.

## Read first
`docs/seo-aeo.md` (all), `ADR-0006`, `docs/i18n-and-translation.md` (hreflang rules).

## Scope
- Site-level SEO module in `src/lib/seo/` (metadata builder, JSON-LD builders) used by layouts; the theme only calls it.
- `robots.txt`, sitemap (with hreflang alternates), RSS feeds (site and per collection, per locale, full content), `llms.txt` per locale.
- Per-page Markdown output at `<page-url>index.md` with public frontmatter and absolute URLs for images and links; `<link rel="alternate" type="text/markdown">` in HTML head.
- JSON-LD: `BlogPosting`, `WebSite`, `Person` (with `sameAs` from site config), `BreadcrumbList`; translation links between language pairs. Serialize with `<` escaped as `\u003c` (frontmatter must never break out of the element); a test feeds a `title` containing `</script>` and asserts the output stays inside one `<script type="application/ld+json">` element.
- License line at the end of every entry page, `copyrightHolder` and (when set) `license` in `BlogPosting` JSON-LD, and `license` in the Markdown version, per `docs/seo-aeo.md` and `LICENSE-CONTENT.md`.
- OG image generation per entry with a CJK-capable font (a subset of Retypeset's bundled CJK font if its license allows it (V14); otherwise a Noto Sans TC subset, recorded in `THIRD_PARTY_NOTICES.md`).
- Preview builds (`INCLUDE_DRAFTS=true`) add `<meta name="robots" content="noindex">` to every page.
- `tests/seo/`: tests that parse `dist/` and assert every checklist item, including: no drafts in sitemap/feeds/llms.txt/search; every HTML page has canonical, description, lang, and Markdown alternate; hreflang pairs reciprocal; JSON-LD validates against schema.org types (structural check).
- Site config: author name, `sameAs` links (placeholders the author fills: GitHub `https://github.com/januswtlin`, others left empty), default OG image.

## Out of scope
Content negotiation at the edge and `Link` headers (T14). Search Console, Crawler Hints, analytics (T17).

## Human steps

None.

## Acceptance criteria
- [ ] Every checkbox in `docs/seo-aeo.md` → "Required outputs" except the ones marked for T14/T17 is covered by a test in `tests/seo/`, listed in the PR with test names.
- [ ] `curl`-equivalent fetch of `dist/<topic>/<fixture>/index.md` shows clean Markdown with absolute image URLs.
- [ ] `llms.txt` lists every published fixture entry in the right locale with its `.md` URL.
- [ ] Rich Results Test or schema validator output for one entry pasted in the PR (manual check on the preview URL).
- [ ] `docs/seo-aeo.md` updated with any change to paths or formats.

## Automated verification
What this task adds to `pnpm verify` (ADR-0010), and what stays manual.
- `tests/seo/` runs in `pnpm verify` against `dist/`, one named test per "Required outputs" checkbox.
- The Markdown output, `llms.txt`, feeds, and sitemap tests read the built files, so the `curl`-equivalent AC is a test, not a manual step.
- Manual: Rich Results Test or a schema validator on one entry (needs a reachable URL; until T16, a schema validator run on the built HTML is acceptable).
