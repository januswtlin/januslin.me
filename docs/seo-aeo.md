# SEO and AEO (search and AI readiness)

Last reviewed: 2026-10-29

Goal: the site is easy to find, read, and cite for search engines, AI search, and AI agents from day one. Policy decision: ADR-0006. Information architecture: ADR-0007.

## What actually matters, in priority order

Facts (Google Search Central, checked 2026-10-27):
- Google's AI Overviews and AI Mode need **no special optimization**, no AI text files, and no special schema. A page must be indexed and eligible for a snippet.
- Keywords in URL paths have "hardly any effect beyond appearing in breadcrumbs".
- Most new pages are discovered through links; internal linking matters.

Our priorities, therefore (interpretation of the above plus common practice):
1. **First-hand, specific content.** Original photos, concrete details (places, dates, brew parameters, equipment used), the author's own judgment. This is the author's job and the site's main advantage.
2. **Topic hubs with real content and dense internal linking.** Hub introductions, curated "start here" lists, breadcrumbs, related posts, links within prose. (`docs/content-model.md` → Internal linking.)
3. **Clear author entity.** One consistent identity: About page, `Person` structured data with `sameAs`, byline on every post.
4. **English versions with correct hreflang.** Most AI queries are in English; translation coverage expands reach more than any markup.
5. **Technical fundamentals.** Static HTML, fast pages, sitemap, canonical URLs, honest `dateModified`, nothing blocking crawlers.
6. **Agent extras** (`llms.txt`, Markdown versions, content negotiation, Content Signals). Cheap and useful to non-Google agents and tools such as Cloudflare Agent Readiness; evidence of ranking or citation impact is weak. Keep them, but never at the expense of 1–5.

## Layers and ownership

| Layer | Responsible for | Where it lives |
|---|---|---|
| Edge (Cloudflare) | Which bots may enter; observability; www redirect; Crawler Hints | Zone settings, documented in `docs/infra-current-state.md` |
| Site code | Every machine-readable output below | `src/lib/seo/`, `src/pages/`, `scripts/`, `worker/` (theme-independent) |
| Theme | Semantic HTML (`<article>`, heading order, `<time datetime>`, `<nav>`, landmarks) | `src/components/`, `src/layouts/` |
| Content | First-hand substance, clear titles, real descriptions, topic hub introductions, `related` links | `content/` (author) |

## AI access policy (ADR-0006)

- Cloudflare AI Crawl Control: Search, Agent, and Training categories all **Allow**. Do not block the Training category: Googlebot, BingBot, and Applebot are evaluated under both Search and Training, so blocking Training also blocks them.
- robots.txt Content Signals: `search=yes, ai-input=yes, ai-train=yes`.
- Bot Preference Sync: off (our own `robots.txt` is authoritative).
- Do not enable features that challenge or alter responses for bots without an ADR: Bot Fight Mode, AI Labyrinth, Email Address Obfuscation, Rocket Loader. T17 verifies their state.

## Required outputs (acceptance checklist)

Each item is verified by CI (`tests/seo/`) against the built `dist/` unless marked manual.

### Discoverability
- [ ] `/robots.txt`:
  ```
  User-agent: *
  Content-Signal: search=yes, ai-input=yes, ai-train=yes
  Allow: /

  Sitemap: https://januslin.me/sitemap-index.xml
  ```
  Verify the directive name and syntax against the current Content Signals spec and Cloudflare's managed robots.txt docs during T13 (Cloudflare's docs show `Content-signal:` under `User-Agent: *`).
- [ ] `/sitemap-index.xml` with every published URL in both locales, `lastmod` from `updatedDate ?? pubDate`, hreflang alternates for translated pairs. No drafts.
- [ ] RSS: `/rss.xml` (zh-TW, all posts), `/en/rss.xml`, plus per-topic feeds `/<topic>/rss.xml` (and `/en/<topic>/rss.xml`). Full content in feeds.
- [ ] `/llms.txt` following the llms.txt convention: site summary, author, then one section per topic (hub description first) listing every published post with title, URL of its `.md` version, and description. `/en/llms.txt` for English.

### Per-page metadata
- [ ] `<html lang>` correct per locale (`zh-TW` / `en`).
- [ ] `<title>`, `<meta name="description">`, canonical URL (absolute, trailing slash, apex domain).
- [ ] hreflang `<link rel="alternate">` for existing pairs plus `x-default`.
- [ ] Open Graph and Twitter card tags; OG image generated per entry at build (CJK-capable font).
- [ ] JSON-LD:
  - Entries: `BlogPosting` with `headline`, `description`, `datePublished`, `dateModified`, `inLanguage`, `author` (reference to the Person; for an entry whose `author` names another writer, a `Person` with that name), `copyrightHolder` (the same Person as `author`), `license` (URL, only when the entry sets `license`), `image`, `keywords` (tag labels), `mainEntityOfPage`, and `translationOfWork` / `workTranslation` linking language pairs.
  - Site: `WebSite` + `Person` (Janus Lin) with `sameAs` links (GitHub, LinkedIn, etc., from site config), on the home and About pages.
  - Breadcrumbs: `BreadcrumbList` on posts (Home › Topic › Post) and hubs (Home › Topic), matching the visible breadcrumb.
  - Topic hubs: `CollectionPage` with `about` set to the topic.

- [ ] Every entry page ends with a license line: `© <year of pubDate> Janus Lin. All rights reserved.` by default, or `© <year of pubDate> Janus Lin.` followed by the entry's license name linked to its URL (`LICENSE-CONTENT.md`).

### Markdown for agents
- [ ] Every published entry and page has a Markdown version at `<page-url>index.md` (e.g. `/coffee/v60-recipe/index.md`), generated at build from the source with public frontmatter only (`title`, `description`, `pubDate`, `updatedDate`, `tags` as labels, canonical URL, language, a link to the other language version when it exists, license: the entry's SPDX id or `All rights reserved`). Image paths rewritten to absolute URLs of the optimized images.
- [ ] HTML pages include `<link rel="alternate" type="text/markdown" href="…/index.md">`.
- [ ] Content negotiation: a request to the page URL with `Accept: text/markdown` returns the Markdown with `Content-Type: text/markdown; charset=utf-8` and `Vary: Accept`. Implemented in the Worker or a Transform Rule (T14 decides; ADR-0002).
- [ ] HTTP `Link` header on HTML pages pointing to the Markdown alternate (RFC 8288).

### Internal linking
- [ ] Every post links to its topic hub and shows a visible breadcrumb.
- [ ] Every post shows at least 3 related links when the site has enough posts (`related`, then same topic, then shared tags).
- [ ] Every topic hub has a non-empty introduction and links to all its posts (paginated if needed).
- [ ] No orphan pages: every published URL in the sitemap is linked from at least one other page (CI check on `dist/`).

### Performance and rendering
- [ ] All content is in the initial HTML (no client-side rendering of text).
- [ ] Lighthouse (mobile) on home, a topic hub, a text-heavy post, and a photo-heavy post: Performance ≥ 90, Accessibility ≥ 95, SEO = 100, Best Practices ≥ 95. Run in CI on the preview build (T16), reported in the PR; regressions below threshold fail.
- [ ] Fonts: self-hosted, `font-display: swap`, unicode-range slices for CJK.

## Off-site setup (T17, partly human)

- Google Search Console and Bing Webmaster Tools: verify the domain via DNS TXT (agent adds the record via API; the author clicks verify if a login is required). Submit the sitemap.
- Cloudflare Crawler Hints: enable (sends IndexNow notifications on content changes).
- Cloudflare Web Analytics: enable for `januslin.me` (no cookies). Watch referrers from AI products (chatgpt.com, perplexity.ai, claude.ai, gemini.google.com).
- After cutover, rescan **Agent Readiness** in the dashboard. Target: Level 1 (Quick Wins) 5/5. Level 2, Level 3, and Commerce checks (API catalog, OAuth discovery, MCP server card, agent skills, WebMCP, payment protocols) are out of scope for a blog; do not add empty or placeholder files to raise the score. A real read-only MCP server is roadmap R02.

## Periodic audit (SEO/AEO role, monthly)

1. AI Crawl Control → Metrics: which crawlers visited, which paths, any robots.txt violations, any blocked requests that should not be blocked.
2. Search Console / Bing: coverage errors, top queries.
3. Agent Readiness rescan.
4. Spot-check three random pages with `curl -H 'Accept: text/markdown'`.
5. Write a short report as a PR to `docs/reports/seo-YYYY-MM.md` with findings and proposed actions.
