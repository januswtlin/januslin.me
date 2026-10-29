# T12: Images, rich content, search

- Role: Site Engineer
- Depends on: T11 · Human steps: T12-H1
- Identity: app (`januslin-agent[bot]`)
- Branch: `agent/site/T12-media-search`
- Size: M

## Goal
Photos look good and load fast, technical writing renders math and diagrams statically, and readers can search the site in both languages.

## Read first
`docs/content-model.md` (Images, Rich content), `docs/seo-aeo.md` (performance), `docs/operations.md` (limits).

## Scope
- Images: co-located images resolved through Astro's image pipeline; responsive `srcset`, modern formats, explicit dimensions, lazy loading except the first image/cover. Strip GPS EXIF from all generated derivatives.
- `pnpm images:optimize [path]`: optional pre-commit helper for laptop authors (resize long edge to 2400 px, convert HEIC, strip GPS), documented in `docs/authoring-guide.md` (one short paragraph).
- iOS Shortcut "Prepare photo for januslin.me" for mobile publishing (ADR-0004): Convert Image to JPEG with "Preserve Metadata" off, Resize Image to a long edge of 2400 px, save to Files for Working Copy. Document the exact actions in `docs/authoring-guide.md` so the author can build it; verify on a real photo that the output has no GPS EXIF and is under 1.5 MB (V13).
- Photo presentation (travel and coffee posts): full-width figure option and captions from Markdown image titles (`![alt](./a.jpg "caption")`). A simple gallery grid if Retypeset lacks one (no client JS required to view).
- Verify math, Mermaid (build-time SVG), callouts, footnotes in a real entry layout. Mermaid diagrams must respect dark mode (render both themes or use CSS variables).
- Search: Pagefind, indexing only published entries, separate indexes or filters per locale, UI at `/search/` and `/en/search/` styled to Retypeset. Verify Chinese search quality (Pagefind's CJK segmentation) with fixture queries; document limitations.
- Asset budget report script: total files in `dist/`, largest files; used by CI (T16).

## Out of scope
R2 migration (roadmap R06).

## Human steps

- **T12-H1, the photo Shortcut (15 min).** On your iPhone, build the "Prepare photo for januslin.me" Shortcut from the steps in `docs/authoring-guide.md` (added by this task), run it on one real photo with location data, and AirDrop or send the result to the agent's PR as an attachment (V13). The agent checks EXIF and size.

## Acceptance criteria
- [ ] A travel fixture with 10 photos: Lighthouse mobile Performance ≥ 90; no layout shift from images (CLS < 0.05).
- [ ] Derived images contain no GPS EXIF (test reads EXIF from `dist/`).
- [ ] Searching `京都` and `agents` on fixtures returns the expected entries in the right locale; drafts never appear in the index.
- [ ] Mermaid diagram readable in light and dark mode (screenshots).
- [ ] `docs/content-model.md` and `docs/authoring-guide.md` updated for anything authors need to know.

## Automated verification
What this task adds to `pnpm verify` (ADR-0010), and what stays manual.
- `dist/` tests: derived images have no GPS EXIF; every `<img>` has `width`, `height`, and `alt`; only the first image or cover is not lazy; asset budget script runs and its report is printed.
- Pagefind tests: fixture queries (`京都`, `agents`) return the expected entries per locale; drafts never appear in either index.
- Playwright: cumulative layout shift on the travel fixture below 0.05 (`PerformanceObserver` for `layout-shift`); Mermaid snapshots in light and dark.
- `pnpm test:perf` (not in `verify`, timing-sensitive): local Lighthouse mobile run on the travel fixture with the Playwright Chromium, Performance ≥ 90, report pasted in the PR. T16 moves Lighthouse into `ci`.
- Manual: the iOS Shortcut on a real photo (the author runs it, or the agent writes the steps and the author confirms).
