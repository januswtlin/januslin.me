# Authoring guide

Last reviewed: 2026-10-29

For the author. How to write and publish; engineering details live in the other docs.

## Two paths, one file format

Whether you write on the laptop or the phone, the result is the same: Markdown files in `content/` with photos in the same folder, committed with Git. You can mix paths freely, e.g. draft on the phone and polish on the laptop.

```
content/posts/<slug>/index.zh-tw.md      every post, whatever the topic
content/topics/<topic>/index.zh-tw.md     topic hub introductions (tech, ai, travel, coffee, life)
content/pages/about/index.zh-tw.md        About and other pages
content/taxonomy/tags.yaml                tag registry
```

Each post has one `topic` (its main category) and any number of tags. The URL is `/<topic>/<slug>/`, e.g. `/coffee/v60-recipe/`. `<slug>` is lowercase English with hyphens. Do not change the slug or topic after publishing; if you must, an agent adds a redirect.

## Writing on the laptop (iA Writer / Obsidian)

1. Open the repo's `content/` folder in iA Writer or Obsidian.
2. New post: create `content/posts/<slug>/` containing `index.zh-tw.md` and any photos. Start from the templates in `content/_templates/` (created in T10).
3. Local preview: run `pnpm dev` at the repo root and open `http://localhost:4321`. Entries with `draft: true` are visible locally.
4. Publish: branch, commit, push, open a PR, wait for the preview, merge.

The repository is public, so anything you commit (including `draft: true` entries) is readable on GitHub. For unfinished writing, use the local-only `drafts/` folder (same layout as `content/`). `pnpm dev:drafts` shows it locally. When it is ready, move the entry folder into `content/` and continue from step 3.

## Writing on mobile (iA Writer + Working Copy), when needed

There is no CMS (ADR-0004). On the iPhone or iPad the same Markdown files are edited directly:

1. One-time setup per device: clone `januswtlin/januslin.me` in Working Copy with a deploy key (`docs/operations.md` → "Author's recurring steps"), and add the clone to iA Writer as a library location (Working Copy's Files provider).
2. In Working Copy, create a branch for the post (any name except `main`).
3. Write `content/posts/<slug>/index.zh-tw.md` in iA Writer, starting from `content/_templates/post.md`.
4. Photos: run the "Prepare photo for januslin.me" Shortcut (JPEG, long edge 2400 px, no metadata; steps in T12) on each photo, then add the results to the post's folder in Working Copy. HEIC and files over 5 MB fail CI.
5. Commit and push the branch in Working Copy. Pushes to `main` are refused by GitHub (the `main` ruleset); always use a branch.
6. In the GitHub mobile app, open a PR from the branch, wait for the preview link (behind Cloudflare Access, visible only to you), and merge. The post goes live a few minutes later.

## Frontmatter template

```markdown
---
title: 文章標題
description: One or two sentences, 40–160 characters. This appears in search results, social previews, and AI citations; write it as a standalone summary.
topic: ai
pubDate: 2026-11-08
tags: [agents]
related: [another-post-slug]
draft: true
---

Body starts here.
```

Travel (or any post tied to a place) can add:

```yaml
location:
  name: 京都
  country: JP
tripStart: 2026-10-30
tripEnd: 2026-11-02
cover: ./cover.jpg
coverAlt: 雨中的哲學之道
```

## Writing tips

- **Write from first-hand experience.** Specifics only you have (photos, places, dates, brew parameters, the gear you actually used) are what search engines and AI systems value most.
- **Link generously.** Use `related` and link other posts in the text; it helps readers and discovery more than anything technical.
- **Write the description with care.** It is the first sentence readers see on Google and the passage AI systems most often quote.
- **Use headings** (`##`, `###`) to structure long pieces; a table of contents is generated automatically.
- Math: `$E = mc^2$`. Diagrams: fenced ```` ```mermaid ```` blocks.
- Callouts: `:::note`, `:::tip`, `:::warning`.
- New tag: add an entry to `content/taxonomy/tags.yaml` (English `id`, plus zh-TW and en labels).
- To keep something off the site for now: `draft: true`. Hidden in production, visible in previews and locally, but public in the repository. Truly private drafts go in `drafts/`.
- After meaningfully editing a published entry, set `updatedDate`.
- Everything you write is all rights reserved by default (`LICENSE-CONTENT.md`). To license one entry differently, e.g. a technical guide others may reuse, add `license: CC-BY-4.0` (or another SPDX id on the allowed list) to its frontmatter; the page then shows that license. It covers the entry's text and the photos in its folder unless the text says otherwise.

## English versions

You write English versions yourself, as `index.en.md` in the same folder, with the same frontmatter as the Chinese file (fields you leave out are taken from it). After you publish a Chinese entry, a check (on each merge and weekly) opens an issue `english: <collection>/<slug>` for it, labelled `translation-needed`; the issue closes by itself when the English version is merged. If an entry should stay Chinese-only, close its issue; it will not be reopened. When you change a Chinese entry that already has an English version, update the English yourself if needed; nothing tracks that.

## When something goes wrong

- Published by mistake: revert the PR on GitHub, or ask an agent.
- Lost phone: delete that device's deploy key on GitHub (`docs/operations.md` → "Lost device").
- Any other technical problem: open an issue describing it and hand it to an agent.
