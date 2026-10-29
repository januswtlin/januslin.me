# ADR-0005: zh-TW at the root, English under `/en/`
- Status: accepted
- Date: 2026-10-29
- Deciders: Janus, coordinator session

## Context
Traditional Chinese is the source language and most of the content. English versions are written by the author, later and not for every entry. URLs must be stable and shared across languages for clean hreflang pairs.

## Decision
- `zh-TW` is the default locale, served without a prefix; `en` is served under `/en/`.
- Slugs are ASCII kebab-case and shared by both language versions.
- An entry without an English file has no English URL; no automatic fallback pages.
- Files: `index.zh-tw.md` and `index.en.md` in the entry folder.

## Alternatives considered
- Prefixing both locales (`/zh-tw/`, `/en/`): symmetric, but longer URLs for the main audience and a change from Retypeset's default.
- Chinese slugs: percent-encoded in most contexts and awkward to share.

## Consequences
- The language switcher appears only when the counterpart exists.
- English listings contain only translated entries.

## Revisit when
- A third language is added.
