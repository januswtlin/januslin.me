# T11: Routing, topic hubs, tags, i18n UI

- Role: Site Engineer
- Depends on: T10 · Human steps: none
- Identity: app (`januslin-agent[bot]`)
- Branch: `agent/site/T11-routing-i18n`
- Size: L

## Goal
Every URL in the `docs/content-model.md` URL table exists, renders in Retypeset's style, links internally as specified, and behaves correctly for zh-only and translated entries.

## Read first
`docs/content-model.md` (URLs, Internal linking), `docs/i18n-and-translation.md`, `docs/seo-aeo.md` (What actually matters), ADR-0005, ADR-0007.

## Scope
- Routes (zh-TW and `/en/` mirrors): `/`, `/<topic>/`, `/<topic>/<slug>/`, `/tags/`, `/tags/<id>/`, `/archive/`, `/<page-slug>/`, `/404`. All URLs come from `src/lib/content/urls.ts`.
- Replace Retypeset's `/posts/` structure.
- Home: short intro (from site config), featured posts, then recent posts across topics, each labeled with its topic; links to every topic hub.
- Topic hub: rendered intro (Markdown body), `startHere` posts, then all posts in the topic by date (paginated).
- Post page: visible breadcrumb (Home › Topic › Post), reading time and TOC (Retypeset behavior), location and trip dates when present, tags, "read next" block (`related`, then same topic, then shared tags; up to 3–5 items), link back to the hub.
- Tag pages: posts from all topics carrying the tag, newest first, labeled with topic.
- Archive: all posts by year.
- Navigation: topic hubs in `order`, Tags, About, Search (placeholder until T12), language switch.
- i18n: `src/i18n/` string tables for `zh-tw` (Taiwan vocabulary) and `en`; localized dates; `<html lang>` `zh-TW`/`en`.
- Language switcher only when the counterpart exists. en listings only include posts with an en file.
- en posts show the reader-facing note from `docs/i18n-and-translation.md`.
- 404 per locale, linking to topic hubs.

## Out of scope
SEO metadata beyond `lang`, `<title>`, and visible breadcrumbs (T13). Search (T12).

## Human steps

None.

## Acceptance criteria
- [ ] With fixtures: every URL pattern in the content-model table returns 200 in `dist/`; `/en/<topic>/<zh-only-slug>/` does not exist.
- [ ] A tag shared by posts in two topics lists both on `/tags/<id>/` and only the translated one on `/en/tags/<id>/`.
- [ ] Each post page links to its hub and shows ≥ 3 read-next links when fixtures allow (test).
- [ ] No orphan pages in `dist/` (every sitemap-eligible page is linked from another page; test).
- [ ] Language switcher present on the zh+en fixture, absent on the zh-only fixture (Playwright).
- [ ] No Simplified Chinese characters in `src/i18n/zh-tw*` (test).
- [ ] Mobile (375 px) and desktop screenshots of home, a hub, a text post, a photo post, a tag page, in both locales, attached to the PR.

## Automated verification
What this task adds to `pnpm verify` (ADR-0010), and what stays manual.
- Route test: every URL pattern in the content-model table, generated from the fixtures through `urls.ts`, exists in `dist/`; `/en/<topic>/<zh-only-slug>/` does not.
- `dist/` tests: tag pages list the right posts per locale, each post links to its hub and has ≥ 3 read-next links, no orphan pages, internal links resolve.
- Playwright: language switcher present and absent as specified; `<html lang>` per locale; 404 per locale links to hubs; no serious or critical axe violation on each page type.
- A test fails on any Simplified-only character in `src/i18n/zh-tw*` (compare against a Simplified-to-Traditional mapping from a devDependency; the test names the character and file).
- Visual snapshots of home, a hub, a text post, a photo post, and a tag page in both locales at 375 px and 1280 px replace the T09 home snapshots; the same images go in the PR for the author.
