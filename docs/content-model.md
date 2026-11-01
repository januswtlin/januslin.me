# Content model

Last reviewed: 2026-10-29

`content/` is owned by the author. It must remain usable without Astro: plain Markdown, YAML frontmatter, co-located images. Astro reads it through content collections defined in `src/content.config.ts`. There is no CMS (ADR-0004); the author edits the files directly. **The schema in `src/content.config.ts` is the source of truth; this document must match it.**

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
      index.en.md           # optional: English version, written by the author
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
- **Reserved first segments** (cannot be a topic id or page slug): `en`, `tags`, `archive`, `search`, `admin`, `rss.xml`, `llms.txt`, `robots.txt`, `sitemap-index.xml`, `_astro`, `fonts`, `og`, `pagefind`, `404`. `pnpm validate` enforces this.
- Post slugs are unique across all topics (so a post can move topics without a slug clash).
- **Published URLs are permanent.** Changing a post's topic or slug requires a `_redirects` entry (301) in the same PR. CI's slug-history guard fails the PR otherwise (T16).

## Collections

| Collection | Path | Notes |
|---|---|---|
| `posts` | `content/posts/<slug>/index.<locale>.md` | All long-form writing |
| `topics` | `content/topics/<id>/index.<locale>.md` | Topic hubs; the set of folders *is* the topic registry |
| `pages` | `content/pages/<slug>/index.<locale>.md` | Standalone pages (About, later others) |
| `tags` (data) | `content/taxonomy/tags.yaml` | Tag registry |

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
| `title` | string | yes | |
| `author` | string | no, default `Janus Lin` | The writer's name, for an entry written by someone else (ADR-0016). Shown as the byline and in JSON-LD. |
| `description` | string | yes | 40–160 characters. Meta description, OG, RSS, llms.txt. Write it as a standalone summary. |
| `topic` | topic id | yes | Reference to `topics`; unknown ids fail the build. |
| `pubDate` | date (`YYYY-MM-DD` or ISO datetime with offset) | yes | |
| `updatedDate` | date | no | Set when content changes meaningfully. Feeds `dateModified`. |
| `tags` | list of tag ids | no | Each must exist in `tags.yaml`. |
| `related` | list of post slugs | no | Explicit "read next" links (internal linking). Unknown slugs fail the build. |
| `draft` | boolean | no, default `false` | Excluded from production builds, sitemap, feeds, search, llms.txt. Included in local and preview builds. |
| `featured` | boolean | no | Home page curation. |
| `cover` | image (relative path) | no | |
| `coverAlt` | string | required if `cover` is set | |
| `location` | object or list | no | `{ name, country (ISO 3166-1 alpha-2), lat?, lng? }`. Typically for travel, allowed on any post (e.g. a café). |
| `tripStart`, `tripEnd` | date | no | Travel dates, distinct from `pubDate`. |
| `license` | SPDX identifier from the allow-list in `src/lib/content/licenses.ts` | no | Omitted means all rights reserved (`LICENSE-CONTENT.md`). Set it only for an entry licensed differently, e.g. `CC-BY-4.0` for a technical guide; it covers the entry's text and the images in its folder unless the text says otherwise. Shown on the entry page and in its JSON-LD and Markdown version. |

### `topics` (hub pages)

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | yes | Display label, e.g. 咖啡 |
| `description` | string | yes | Used in navigation tooltips, meta description, llms.txt |
| `order` | number | no | Navigation order |
| `startHere` | list of post slugs | no | Curated "start here" posts shown above the chronological list |

The Markdown body is the hub's introduction: a few paragraphs on what the author writes about under this topic and why. An empty body fails validation in production builds (hubs without real content are weak for readers and search).

### `pages`

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | yes | |
| `description` | string | yes | |
| `layout` | enum | no, default `default` | Extension point for new page types (e.g. `now`, `projects`). Adding a value requires a layout component and a docs update. |
| `updatedDate` | date | no | |
| `draft` | boolean | no | |
| `license` | SPDX identifier | no | As for posts. |

### English versions (`index.en.md`)

Same fields as the zh-TW file; no extra translation metadata. English versions inherit `topic`, `pubDate`, `tags`, `related`, `cover`, `coverAlt`, `location`, `tripStart`, `tripEnd`, `license` from the zh-TW file unless they set them (`docs/i18n-and-translation.md`).

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

- Tag pages list posts from every topic carrying the tag, newest first, each labeled with its topic.
- Renaming a tag's label is free; changing an `id` requires a redirect.

## Internal linking (built in)

Internal links matter more for search and AI discovery than URL shape (see `docs/seo-aeo.md`). Every post page renders:
1. Breadcrumb: Home › Topic › Post (visible and as `BreadcrumbList`).
2. `related` posts if set, then up to 3 more from the same topic, then from shared tags.
3. A link to the topic hub.

Topic hubs render the intro, `startHere`, then all posts in the topic by date.

## Images

- Co-located with the entry. Accepted inputs: JPEG, PNG, WebP, AVIF, GIF (no SVG: T10's file-type allow-list rejects it). CI rejects HEIC in the repo: convert first (laptop: `pnpm images:optimize`; phone: the iOS Shortcut in T12).
- **Source size policy:** long edge ≤ 2400 px, file ≤ 1.5 MB (warning), hard fail > 5 MB. Laptop authors run `pnpm images:optimize`; on the phone, the iOS Shortcut does the same before the photo is committed (T12).
- Rendering uses Astro's image pipeline: responsive `srcset`, modern formats, explicit width/height, lazy loading below the fold. Every image needs alt text (CI warns on empty alt).
- Strip GPS metadata from published derivatives (privacy). T12 documents whether originals are also stripped.

## Rich content

- Math: `$inline$` and `$$block$$`, rendered to static HTML with KaTeX at build time.
- Diagrams: fenced ```` ```mermaid ```` blocks, rendered to SVG at build time (no client JS).
- Callouts: `:::note`, `:::tip`, `:::warning` directives (Retypeset convention).
- Footnotes: standard Markdown footnotes.
- Tables: standard GFM tables (useful for brew recipes and gear specs).
- No MDX in `content/`. Interactive needs are met with directives handled by site code, documented here.

## Drafts and scheduling

- `draft: true` keeps an entry out of production builds. It is still committed, and the repository is public (ADR-0012), so the text is world-readable on GitHub and stays in history. Use it only for work you do not mind being seen.
- Writing that must stay private lives in `drafts/` at the repo root (same layout as `content/`), gitignored except its README. `pnpm dev:drafts` loads it locally; no other command reads it (T10). Publishing starts by moving the entry folder into `content/`.
- Scheduled publishing is not supported in v1 (roadmap R16).
