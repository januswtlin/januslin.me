# Content model

Last reviewed: 2026-11-05

`content/` is owned by the author. It must remain usable without Astro: plain Markdown, YAML frontmatter, co-located images. Astro reads it through content collections defined in `src/content.config.ts`. There is no CMS (ADR-0004); the author edits the files directly. **The schemas in `src/lib/content/schema.ts` (used by `src/content.config.ts` and `pnpm validate`) are the source of truth; this document must match them.**

Information architecture decision: ADR-0007.

## Principles

- **Collections are defined by form (schema), not by subject.** All essays, whatever the subject, are `posts`. A new collection is added only when the content needs a genuinely different schema (e.g. a future structured coffee brew log, roadmap R21).
- **Topics are the primary category.** Every post has exactly one topic. Topics are a small, curated set; each has a hub page with real introductory content. Topics drive navigation and the URL.
- **Tags are cross-cutting attributes.** A post can have many tags; a tag can span topics (`japan` on a travel post and on a coffee post).

## Directory layout

```
content/
  posts/
    <slug>/
      index.zh-tw.md        # required: the original
      index.en.md           # optional: English version, written by the entry's writer
      cover.jpg             # optional: co-located images, any name
  topics/
    <topic-id>/
      index.zh-tw.md        # topic hub: intro text + curation
      index.en.md
  pages/
    about/
      index.zh-tw.md
      index.en.md
  taxonomy/
    tags.yaml               # tag registry
  _templates/               # starter files for authors (not a collection)
```

- One folder per entry. The folder name is the **slug**.
- The topic is a frontmatter field, not a folder. Moving a post to another topic is a one-line change (and requires a redirect, see URLs).
- The locale is the filename suffix: `index.<locale>.md`, `<locale>` ∈ {`zh-tw`, `en`} (lowercase in filenames and URLs; `zh-TW` in `lang` attributes and hreflang).
- Images live next to the Markdown that uses them, referenced relatively: `![alt](./figure-1.png)`.
- Entry ids are `<slug>/<locale>`, e.g. `v60-recipe/zh-tw` (`src/lib/content/entries.ts`). Any other Markdown file under `posts/`, `topics/`, or `pages/` fails validation, so a misnamed `index.md` or `index.zh-TW.md` is never silently skipped.
- `_templates/` holds `post.md`, `topic.md`, and `page.md`, starter files that are not loaded.
- `CONTENT_DIR` (default `content`) points the collections, `pnpm validate`, and `pnpm sync-worker-routes` at another directory inside the project; the tests use `tests/fixtures/content/` (T10).

## URLs

| Page | zh-TW | en |
|---|---|---|
| Home | `/` | `/en/` |
| Topic hub | `/<topic>/` | `/en/<topic>/` |
| Post | `/<topic>/<slug>/` | `/en/<topic>/<slug>/` |
| Post as Markdown | `/<topic>/<slug>/index.md` | `/en/<topic>/<slug>/index.md` |
| Tag index / tag | `/tags/` · `/tags/<tag>/` | `/en/tags/` · `/en/tags/<tag>/` |
| Archive (all posts by date) | `/archive/` | `/en/archive/` |
| Page | `/<page-slug>/` | `/en/<page-slug>/` |
| Search | `/search/` | `/en/search/` |

Rules:
- Slugs and topic ids: lowercase ASCII kebab-case `^[a-z0-9]+(?:-[a-z0-9]+)*$`, max 60 chars. Chinese titles get an English slug chosen by the author.
- **Reserved first segments** (cannot be a topic id or page slug): `en`, `blog`, `tags`, `archive`, `search`, `admin`, `rss.xml`, `llms.txt`, `robots.txt`, `sitemap-index.xml`, `_astro`, `fonts`, `og`, `pagefind`, `404`, `favicon.svg`, `og-default.png`, plus every top-level file or folder in `public/` and every static top-level route in `src/pages/`, which `pnpm validate` adds itself (`reservedSegments` in `src/lib/content/validate.ts`). `pnpm validate` enforces this.
- Post slugs are unique across all topics (so a post can move topics without a slug clash).
- **Published URLs are permanent.** Changing a post's topic or slug requires a `_redirects` entry (301) in the same PR. CI's slug-history guard fails the PR otherwise (T16).

## Collections

| Collection | Path | Notes |
|---|---|---|
| `posts` | `content/posts/<slug>/index.<locale>.md` | All long-form writing |
| `topics` | `content/topics/<id>/index.<locale>.md` | Topic hubs; the set of folders *is* the topic registry |
| `pages` | `content/pages/<slug>/index.<locale>.md` | Standalone pages (About, later others) |
| `tags` (data) | `content/taxonomy/tags.yaml` | Tag registry |

The collections are defined in `src/content.config.ts`, with the loader in `src/lib/content/loader.ts` (Astro's glob loader over `<collection>/*/index.*.md`) and the schemas in `src/lib/content/schema.ts`, which `pnpm validate` uses too. Every schema is strict: a field not listed below (a typo such as `tag:`) fails. Every reference must exist, or the build and `pnpm validate` fail with the file, the field, and the value. Pages read entries through `getPublished(collection, locale)` (`src/lib/content/collections.ts`), which applies the draft rule in [drafts](#drafts-and-scheduling), and build every URL with `src/lib/content/urls.ts`.

### Initial topics

| id | zh-TW label | en label | Scope |
|---|---|---|---|
| `tech` | 技術 | Tech | Software engineering, tools, infrastructure |
| `ai` | AI | AI | AI, agents, models, and how to work with them |
| `travel` | 旅行 | Travel | Travel essays and memoir |
| `coffee` | 咖啡 | Coffee | Third-wave coffee, brewing, equipment |
| `life` | 生活 | Life | Everything else worth writing about |

Labels and descriptions are the author's to change. Adding a topic = adding a folder in `content/topics/`. Removing or renaming a topic id requires redirects for all its posts.

## Frontmatter

### `posts`

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | yes | Not empty. |
| `author` | string | no, default `Janus Lin` | The writer's name, for an entry written by someone else (ADR-0016). Shown as the byline and in JSON-LD. |
| `description` | string | yes | 40–160 characters. Meta description, OG, RSS, llms.txt. Write it as a standalone summary. |
| `topic` | topic id | yes | Reference to `topics` (the hub entry `<topic>/zh-tw`); unknown ids fail the build. |
| `pubDate` | date (`YYYY-MM-DD` or ISO datetime with offset) | yes | |
| `updatedDate` | date | no | Set when content changes meaningfully. Feeds `dateModified`. |
| `tags` | list of tag ids | no, default `[]` | Each must exist in `tags.yaml`. |
| `related` | list of post slugs | no, default `[]` | Explicit "read next" links (internal linking). Unknown slugs fail the build. A published post cannot list a draft (`pnpm validate` and production builds fail); a draft can. |
| `draft` | boolean | no, default `false` | Excluded from production builds, sitemap, feeds, search, llms.txt. Included in local and preview builds. |
| `featured` | boolean | no, default `false` | Home page curation. |
| `cover` | image (relative path) | no | A JPEG, PNG, WebP, AVIF, or GIF in the entry's folder, e.g. `./cover.jpg`. |
| `coverAlt` | string | required if `cover` is set | Not empty. |
| `location` | object or list | no | `{ name, country, lat?, lng? }`, or a non-empty list of them. `country` is an ISO 3166-1 alpha-2 code in capitals (`JP`); `lat` is −90 to 90, `lng` −180 to 180. Typically for travel, allowed on any post (e.g. a café). |
| `tripStart`, `tripEnd` | date | no | Travel dates, distinct from `pubDate`. `tripEnd` cannot be before `tripStart`. |
| `license` | SPDX identifier from the allow-list in `src/lib/content/licenses.ts` | no | `CC-BY-4.0`, `CC-BY-SA-4.0`, `CC-BY-NC-4.0`, `CC0-1.0`, or `MIT`; any other value fails with the file and the value. Omitted means all rights reserved (`LICENSE-CONTENT.md`). Set it only for an entry licensed differently, e.g. `CC-BY-4.0` for a technical guide; it covers the entry's text and the images in its folder unless the text says otherwise. Shown on the entry page and in its JSON-LD and Markdown version. |

### `topics` (hub pages)

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | yes | Not empty. Display label, e.g. 咖啡 |
| `description` | string | yes | Not empty. Used in navigation tooltips, meta description, llms.txt |
| `order` | number | no | Navigation order; hubs without one come after, by id |
| `startHere` | list of post slugs | no, default `[]` | Curated "start here" posts shown above the chronological list. Unknown slugs fail the build, and so do drafts, except in builds that include drafts. |

The Markdown body is the hub's introduction: a few paragraphs on what the author writes about under this topic and why. An empty body (HTML comments do not count) fails `pnpm validate` once the topic has published posts (hubs without real content are weak for readers and search).

### `pages`

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | yes | Not empty. |
| `description` | string | yes | Not empty. |
| `layout` | enum | no, default `default` | `default` is the only value. Extension point for new page types (e.g. `now`, `projects`). Adding a value requires a layout component and a docs update. |
| `updatedDate` | date | no | |
| `draft` | boolean | no, default `false` | |
| `license` | SPDX identifier | no | As for posts. |

### English versions (`index.en.md`)

Same fields as the zh-TW file; no extra translation metadata. A post inherits `topic`, `pubDate`, `tags`, `related`, `cover`, `coverAlt`, `location`, `tripStart`, `tripEnd`, and `license` from the zh-TW file unless it sets them; a page inherits `license`; a topic hub inherits nothing. Every other field (`title`, `description`, `author`, `featured`, `updatedDate`, a hub's `order` and `startHere`) is the English file's own. The English file is validated after inheriting, so it may leave out the required fields it inherits.

**Drafts in English versions** (the author's decision, 2026-11-05): an English post or page is a draft when its zh-TW file is a draft or it is one itself (effective draft = `zh.draft || en.draft`). The zh-TW entry is never affected by its English version's `draft`.

| zh-TW `draft` | English `draft` | zh-TW page | English page |
|---|---|---|---|
| `true` | `true` | draft | draft |
| `true` | `false` or not set | draft | draft |
| `false` or not set | `true` | published | draft |
| `false` or not set | `false` or not set | published | published |

The rule is applied once, where the English entry inherits (`inheritFrontmatter` in `src/lib/content/entries.ts`), so the collections, `getPublished()`, English routes and listings, tag pages, hreflang alternates, the draft-reference check, and `pnpm validate` all see the same effective value. With `INCLUDE_DRAFTS=true` every version is shown. Language behavior is defined under [localization and English versions](#localization-and-english-versions).

### Example

```markdown
---
title: 在京都的雨天走路
description: 一個人在京都的三天，關於雨、步行速度，以及旅行時如何不急著看完一座城市。
topic: travel
pubDate: 2026-11-08
tags: [japan, slow-travel]
related: [kyoto-coffee-shops]
cover: ./cover.jpg
coverAlt: 雨中的哲學之道，石板路上的落葉
location:
  name: 京都
  country: JP
tripStart: 2026-10-30
tripEnd: 2026-11-02
---
```

## Tag registry (`content/taxonomy/tags.yaml`)

```yaml
- id: espresso            # ASCII kebab-case, permanent, used in URLs
  zh-tw: 義式濃縮
  en: Espresso
  description:            # optional, shown on the tag page
    zh-tw: ...
    en: ...
- id: japan
  zh-tw: 日本
  en: Japan
```

- `id` (ASCII kebab-case), `zh-tw`, and `en` are required; `description` is optional, and so is each locale in it. Ids are unique. An empty file is an empty registry.
- Tag pages list posts from every topic carrying the tag, newest first, each labeled with its topic.
- Renaming a tag's label is free; changing an `id` requires a redirect.

## Internal linking (built in)

Internal links matter more for search and AI discovery than URL shape (see `docs/seo-aeo.md`). Every post page renders:
1. Breadcrumb: Home › Topic › Post (visible and as `BreadcrumbList`).
2. `related` posts if set, then up to 3 more from the same topic, then from shared tags.
3. A link to the topic hub.

Topic hubs render the intro, `startHere`, then all posts in the topic by date.

## Images

- Co-located with the entry. Accepted inputs: JPEG, PNG, WebP, AVIF, GIF (`.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.gif`; no SVG: the file-type allow-list rejects it). `pnpm validate` rejects HEIC: convert first (laptop: `pnpm images:optimize`; phone: the iOS Shortcut in T12).
- **Source size policy:** long edge ≤ 2400 px, file ≤ 1.5 MB (warning), hard fail > 5 MB. Laptop authors run `pnpm images:optimize`; on the phone, the iOS Shortcut does the same before the photo is committed (T12).
- Rendering uses Astro's image pipeline: responsive `srcset`, modern formats, explicit width/height, lazy loading below the fold. Every image needs alt text (CI warns on empty alt).
- Strip GPS metadata from published derivatives (privacy). T12 documents whether originals are also stripped.

## Rich content

- Math: `$inline$` and `$$block$$`, rendered to static HTML with KaTeX at build time.
- Diagrams: fenced ```` ```mermaid ```` blocks, rendered to SVG at build time (no client JS) with Mermaid's `securityLevel: 'strict'`: labels are sanitized, and click handlers and `javascript:` links are dropped.
- Callouts: `:::note`, `:::tip`, `:::important`, `:::warning`, `:::caution` directives, with an optional title in brackets (`:::tip[Brewing]`). Any other `:name` or `::name` stays as written, so times and ratios such as `10:30` and `1:15` are safe.
- Footnotes: standard Markdown footnotes.
- Tables: standard GFM tables (useful for brew recipes and gear specs).
- No MDX in `content/`. Interactive needs are met with directives handled by site code, documented here.

### Content safety (T10)

- **Raw HTML is disabled**, not sanitized: HTML comments are dropped, and any other HTML in a Markdown file (`<script>`, `<iframe>`, `<object>`, `<embed>`, `<img onerror=…>`, but also `<br>` or `<details>`) is shown as the text it was written as. None of it reaches the page as an element, so none of it can run or load anything. Use Markdown and the directives above instead. Chosen over an allow-list sanitizer because no content needs raw HTML, and an allow-list would have to admit the KaTeX, Mermaid, and Shiki output while keeping everything else out (`remarkNoRawHtml` in `src/lib/markdown/safety.ts`).
- **Links and images keep only `http:`, `https:`, `mailto:`, `tel:`, relative URLs, and fragments.** Any other scheme (`javascript:`, `vbscript:`, `data:`, `file:`), in any letter case and with whitespace or control characters inside, loses its `href` or `src`; event handler attributes and elements that load or run code are removed too (`rehypeSafeUrls`).
- **JSON in `<script>`** (JSON-LD) escapes `<`, `>`, `&`, U+2028, and U+2029 as `\u003c`-style escapes, so a title such as `</script><script>…` cannot end the element (`src/lib/content/json-script.ts`).
- Titles, descriptions, and other frontmatter strings are escaped by Astro wherever they appear in HTML.

## Drafts and scheduling

- `draft: true` keeps an entry out of production builds. It is still committed, and the repository is public (ADR-0012), so the text is world-readable on GitHub and stays in history. Use it only for work you do not mind being seen.
- Drafts are included only with `INCLUDE_DRAFTS=true`: `pnpm dev`, `pnpm dev:drafts`, and `pnpm build:preview` set it; `pnpm build` does not.
- Writing that must stay private lives in `drafts/` at the repo root (same layout as `content/`), gitignored except its README. `pnpm dev:drafts` loads it locally (it sets `LOCAL_DRAFTS=true`); no other command reads it, and `astro build` and `astro sync` refuse to run with `LOCAL_DRAFTS=true` (`src/lib/content/local-drafts.ts`). Its entries are always drafts, whatever their frontmatter says, and a missing `drafts/` folder is fine. A slug in both `drafts/` and `content/` loads from `content/`, with a warning. `DRAFTS_DIR` names another folder; the tests use `tests/fixtures/drafts/` and never read `drafts/`. Publishing starts by moving the entry folder into `content/`.
- Scheduled publishing is not supported in v1 (roadmap R16).

## Validation (`pnpm validate`, T10)

`scripts/validate-content.ts` checks `content/` (or `CONTENT_DIR`) from the files alone, before the build, and is part of `pnpm verify`. It prints every issue as `<level>: <file>: <field>: <message>` and exits 1 on any error. The rules are in `src/lib/content/validate.ts`; every rule has a negative fixture in `tests/fixtures/content-broken/<case>/`.

Errors:
- The frontmatter of every entry against the schemas above (after inheritance, for English versions): YAML that does not parse, missing or invalid fields, unknown fields, `cover` without `coverAlt`, a `cover` that is missing or not an accepted image type.
- Slug and topic id format; reserved first segments for topic ids and page slugs; a page slug equal to a topic id; unique post slugs.
- An `index.zh-tw.md` in every entry folder; a locale other than `zh-tw` or `en` in a file name; Markdown that is not an entry file (`index.md`, `notes.md`, `posts/x.md`); YAML outside `taxonomy/`.
- Unknown topics, tags, `related` slugs, and `startHere` slugs; a `related` or `startHere` slug that is effectively a draft, in an entry that is not a draft (the build checks this too, unless it includes drafts). An English entry is checked against the English version of the post it names when there is one, otherwise against the zh-TW version.
- An empty hub introduction (HTML comments do not count) for a topic with published posts.
- `tags.yaml` missing, not a list, an invalid tag, or a duplicate id.
- A file type not on the allow-list (`.md`, `.yaml`, and the image types above), with HEIC named separately; an image over 5 MB.

Warnings: an image over 1.5 MB; files in `content/` that nothing reads. `.gitkeep`, `.DS_Store`, and `.obsidian/` are skipped.

The build checks the same schemas and references while loading the collections, and fails with the file named.

## Worker routes (`pnpm sync-worker-routes`, T10)

`scripts/sync-worker-routes.ts` writes `run_worker_first` in `wrangler.jsonc` from the topics (`/<topic>/*` for every hub, by `order` then id, then the same under `/en/`) and the published pages (`/<page>/`, and `/en/<page>/` when the page has a published English version), and leaves the rest of the file as it is. `--check`, in `pnpm verify`, changes nothing and fails when the file is out of date. Until `wrangler.jsonc` exists (T14), both modes print a notice and pass (ADR-0007, `docs/deployment.md`).

## Localization and English versions

### Locales

| Locale | Filename suffix | URL prefix | `lang` / hreflang | Role |
|---|---|---|---|---|
| Traditional Chinese (Taiwan) | `zh-tw` | none (root) | `zh-TW` | Default, source language |
| English | `en` | `/en/` | `en` | English versions, written by the entry's writer |

Adding a locale requires an ADR.

### URL rules

- Every entry has exactly one zh-TW URL and at most one en URL, sharing topic and slug: `/coffee/v60-recipe/` and `/en/coffee/v60-recipe/` (ADR-0005, ADR-0007).
- UI chrome (nav, labels, dates) is localized from `src/i18n/` string tables. zh-TW strings use Taiwan vocabulary and Traditional characters only.
- Date format: zh-TW `2026年11月8日`, en `8 Nov 2026` (T11 finalizes).
- `x-default` hreflang points to the zh-TW URL.

### Pages that exist only in one locale

- A post without `index.en.md` has **no** `/en/...` URL. No machine-translated fallback, no placeholder.
- The language switcher is shown only when the counterpart exists.
- en listings (`/en/<topic>/`, `/en/tags/<id>/`, `/en/archive/`) show only posts with an en version.
- Topic hubs and pages follow the same rule; English hubs need their own `index.en.md`.
- hreflang alternates are emitted only for pairs that exist and are both published: a zh-TW page never links to an English version that is effectively a draft (T10 adds them to post pages; T13 completes them).

### English versions

The writer of an entry (the author, or the developer named in its `author`, ADR-0016) writes its English version, in their own words. No machine or agent translation, and no agent edits `index.en.md` (`docs/agents/roles.md`).

- An English version is `index.en.md` next to `index.zh-tw.md`, with the same frontmatter fields as the zh-TW file. A post inherits `topic`, `pubDate`, `tags`, `related`, `cover`, `coverAlt`, `location`, `tripStart`, `tripEnd`, and `license` from the zh-TW file unless it sets them; a page inherits `license`; and an English version is a draft whenever its zh-TW file is (see [English versions](#english-versions-indexenmd)).
- Reader-facing note on English pages: "Originally written in Traditional Chinese." The string lives in `src/i18n/` and the author may change it.

### Missing English versions (T19)

A deterministic check, not an agent: no model, no subscription usage, and it never writes content.

- `scripts/english-versions.ts` lists every published zh-TW entry (posts, topic hubs, pages) that has no `index.en.md`.
- `.github/workflows/english-versions.yml` runs it on push to `main` that touches `content/**` and weekly on a schedule. For each missing English version it opens an issue `english: <collection>/<slug>` labelled `translation-needed`, or leaves the existing one alone; never a duplicate (one run at a time; existing issues matched by exact title through the list-issues API). When the English version lands, it closes the issue with a comment naming the commit; when an entry is deleted, turned into a draft, or renamed, it closes that entry's open issue too.
- It never reopens an issue the author closed. Closing an issue without adding an English version is how the author says "this entry stays zh-TW only".
- Issues are the to-do list. The entry's writer writes the English on their own schedule, in the same PR flow as any content, and the author merges it.
