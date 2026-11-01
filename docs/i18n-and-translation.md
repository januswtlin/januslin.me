# i18n and translation

Last reviewed: 2026-10-29

## Locales

| Locale | Filename suffix | URL prefix | `lang` / hreflang | Role |
|---|---|---|---|---|
| Traditional Chinese (Taiwan) | `zh-tw` | none (root) | `zh-TW` | Default, source language |
| English | `en` | `/en/` | `en` | English versions, written by the entry's writer |

Adding a locale requires an ADR.

## URL rules

- Every entry has exactly one zh-TW URL and at most one en URL, sharing topic and slug: `/coffee/v60-recipe/` and `/en/coffee/v60-recipe/` (ADR-0005, ADR-0007).
- UI chrome (nav, labels, dates) is localized from `src/i18n/` string tables. zh-TW strings use Taiwan vocabulary and Traditional characters only.
- Date format: zh-TW `2026年11月8日`, en `8 Nov 2026` (T11 finalizes).
- `x-default` hreflang points to the zh-TW URL.

## Pages that exist only in one locale

- A post without `index.en.md` has **no** `/en/...` URL. No machine-translated fallback, no placeholder.
- The language switcher is shown only when the counterpart exists.
- en listings (`/en/<topic>/`, `/en/tags/<id>/`, `/en/archive/`) show only posts with an en version.
- Topic hubs and pages follow the same rule; English hubs need their own `index.en.md`.
- hreflang alternates are emitted only for pairs that exist.

## English versions

The writer of an entry (the author, or the developer named in its `author`, ADR-0016) writes its English version, in their own words. No machine or agent translation, and no agent edits `index.en.md` (`docs/agents/roles.md`).

- An English version is `index.en.md` next to `index.zh-tw.md`, with the same frontmatter fields as the zh-TW file. It inherits `topic`, `pubDate`, `tags`, `related`, `cover`, `coverAlt`, `location`, `tripStart`, `tripEnd`, and `license` from the zh-TW file unless it sets them (`docs/content-model.md`).
- Reader-facing note on English pages: "Originally written in Traditional Chinese." The string lives in `src/i18n/` and the author may change it.

## Missing English versions (T19)

A deterministic check, not an agent: no model, no subscription usage, and it never writes content.

- `scripts/english-versions.ts` lists every published zh-TW entry (posts, topic hubs, pages) that has no `index.en.md`.
- `.github/workflows/english-versions.yml` runs it on push to `main` that touches `content/**` and weekly on a schedule. For each missing English version it opens an issue `english: <collection>/<slug>` labelled `translation-needed`, or leaves the existing one alone; never a duplicate (one run at a time; existing issues matched by exact title through the list-issues API). When the English version lands, it closes the issue with a comment naming the commit; when an entry is deleted, turned into a draft, or renamed, it closes that entry's open issue too.
- It never reopens an issue the author closed. Closing an issue without adding an English version is how the author says "this entry stays zh-TW only".
- Issues are the to-do list. The entry's writer writes the English on their own schedule, in the same PR flow as any content, and the author merges it.
