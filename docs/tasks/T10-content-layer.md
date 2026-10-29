# T10: Content layer: collections, schema, validation

- Role: Site Engineer
- Depends on: T09 · Human steps: none
- Identity: app (`januslin-agent[bot]`)
- Branch: `agent/site/T10-content-layer`
- Size: M

## Goal
Astro reads `content/` exactly as `docs/content-model.md` specifies (posts, topics, pages, tags) with a strict schema, and `pnpm validate` catches content mistakes before the build.

## Read first
`docs/content-model.md`, `docs/i18n-and-translation.md` (English versions), ADR-0004, ADR-0005, ADR-0007, ADR-0012.

## Scope
- `src/content.config.ts`:
  - `posts`, `topics`, `pages`: glob loader over `content/<collection>/*/index.*.md`; derive `slug` (folder) and `locale` (suffix); entry id `<slug>/<locale>`.
  - `tags`: file loader over `content/taxonomy/tags.yaml`.
  - Zod schemas exactly as in `docs/content-model.md`: `topic` as `reference('topics')`, `tags` as `reference('tags')`, `related` checked against post slugs, `cover` via `image()`, `location` (object or list), `tripStart`/`tripEnd`, topic `order`/`startHere`, page `layout` (`default` only), optional `license` (an SPDX id from an allow-list in `src/lib/content/licenses.ts` with display name and URL: `CC-BY-4.0`, `CC-BY-SA-4.0`, `CC-BY-NC-4.0`, `CC0-1.0`, `MIT`).
- English entries inherit `topic`, `pubDate`, `tags`, `related`, `cover`, `coverAlt`, `location`, `tripStart`, `tripEnd`, `license` from the zh-TW source unless set.
- `src/lib/content/urls.ts`: the one place that builds post, hub, tag, page, and Markdown URLs for both locales.
- Drafts: `getPublished(collection, locale)` used everywhere; drafts only when `INCLUDE_DRAFTS=true` (`pnpm dev`, `pnpm build:preview`).
- Local-only drafts: `pnpm dev:drafts`, and only it, also loads the gitignored `drafts/` folder (same layout; missing is fine), always as drafts. A slug in both warns, and `content/` wins. Tests use `DRAFTS_DIR` with fixtures; no test or script ever reads the real `drafts/`.
- `scripts/validate-content.ts` (`pnpm validate`): slug and topic id format; reserved first segments; unique post slugs; topic ids and page slugs do not collide; a `zh-tw` file in every entry folder; non-empty hub bodies for topics with published posts; image policy (warn over 1.5 MB, fail over 5 MB, fail on HEIC); `coverAlt` with `cover`; unknown tags, topics, related; files whose extension is not on the allow-list (`.md`, `.yaml`, the raster types in `docs/content-model.md`).
- Content safety: raw HTML in Markdown is disabled or sanitized with an allow-list (no `<script>`, `<iframe>`, `<object>`, `<embed>`, event handlers, `javascript:` URLs); record the choice in `docs/content-model.md`. JSON embedded in `<script>` escapes `<` as `<`.
- `scripts/sync-worker-routes.ts`: regenerate `run_worker_first` in `wrangler.jsonc` from topics and pages, with `--check` (T14 consumes it; until `wrangler.jsonc` exists, `--check` passes with a notice).
- Content skeleton (the one-time exception in `docs/agents/roles.md`): `content/posts/.gitkeep`, `content/topics/.gitkeep`, `content/pages/.gitkeep`, an empty `content/taxonomy/tags.yaml`, and `content/_templates/` (`post.md`, `topic.md`, `page.md`, excluded from collections). No author text.
- Fixtures in `tests/fixtures/content/`: a zh-only post, a zh+en pair, a draft, a post with location, a tag shared by posts in two topics, `related` links, topic hubs (one with `startHere`), a page. Collections read fixtures when `CONTENT_DIR` is set. The T09 fixture path goes away.
- Docs: `docs/content-model.md` matches the implemented schema exactly; `docs/authoring-guide.md` and `drafts/README.md` for anything the author must know.

## Out of scope
Routes and UI (T11).

## Human steps

None.

## Acceptance criteria
- [ ] `CONTENT_DIR=tests/fixtures/content pnpm build` builds; a broken fixture set fails with errors naming file and field.
- [ ] An unknown topic, tag, or related slug fails with the value and file named.
- [ ] A page slug equal to a topic id, or a reserved word as topic id, fails `pnpm validate`.
- [ ] Content-safety fixtures (`<script>`, `onerror`, `javascript:`, a disallowed file type, a `title` with `</script><script>alert(1)</script>`) are rejected or inert (test names).
- [ ] The draft fixture is absent from `pnpm build` and present with `INCLUDE_DRAFTS=true`; a `DRAFTS_DIR` entry appears only with `dev:drafts`.
- [ ] `license: CC-BY-4.0` validates; an unknown SPDX id fails with file and value.
- [ ] `docs/content-model.md` matches the schema (the reviewer checks field by field; manual).

## Automated verification
- `pnpm verify` gains `pnpm validate` and `sync-worker-routes --check`.
- Unit tests for slug and locale derivation, inheritance, draft filtering, URL helpers, and each validation rule.
- Negative fixtures under `tests/fixtures/content-broken/<case>/`, each asserted to fail with file and field named.
- `tests/dist/routes.ts` derives expected routes from the fixtures through `urls.ts`.
- Manual: the schema-to-doc comparison.
