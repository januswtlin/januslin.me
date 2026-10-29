# T19: Renovate, maintenance tooling, missing-English check

- Role: Platform Engineer (Upgrade Engineer's scope for Renovate and the version scripts)
- Depends on: T16 · Human steps: T19-H1
- Identity: app (`januslin-agent[bot]`, including the two workflows; the author reviews them, CODEOWNERS)
- Branch: `agent/platform/T19-maintenance`
- Size: M

## Goal
Dependency, Node, pnpm, and Actions updates arrive as small grouped PRs from Renovate; the tools the Upgrade review task needs exist; and every published zh-TW entry without an English version has exactly one open issue, without any agent involved.

## Read first
`docs/automation.md`, `docs/operations.md`, `docs/deployment.md`, `docs/i18n-and-translation.md` ("Missing English versions"), `docs/content-model.md`, ADR-0008.

## Scope
- `renovate.json`: weekly schedule (Asia/Bangkok timezone, weekend), grouped (Astro ecosystem; UnoCSS; Cloudflare/wrangler; dev tooling; everything else), majors separate, Node via `.nvmrc` and `engines` (LTS only), pnpm via `packageManager`, GitHub Actions with SHA pinning, no automerge (must stay off: the author merges every PR), labels `upgrade`, PR body includes release-note links. Dependency dashboard issue enabled.
- `scripts/visual-check.ts` (`pnpm visual-check --base <url>`): Playwright screenshots of a fixed page list (home, a hub, a post with math + Mermaid, a photo-heavy post, a tag page; zh-TW and en; 375 px and 1280 px; light and dark), saved as CI artifacts and attachable to PR comments. Diffing against committed baselines already runs in `pnpm test` since T09 (R07, ADR-0010); `visual-check` is for comparing a preview with production.
- `scripts/check-versions.ts` (`pnpm check-versions`): current vs latest for Astro, wrangler, Node LTS, pnpm.
- `.github/workflows/monthly-maintenance.yml`: opens the "Monthly maintenance" issue (label `maintenance`) with the checklist from `docs/operations.md`, including the interaction-limit expiry reminder, on the 1st of each month; manual dispatch enabled. Default `GITHUB_TOKEN` stays read-only; the job asks for `issues: write` only.
- `scripts/retypeset-upstream.ts` (`pnpm retypeset:upstream`): reads the last reviewed upstream commit from `docs/operations.md`, lists upstream commits since then (title, date, files touched) through the public GitHub API without a token, and prints them for the monthly review. The monthly issue includes its output. Recording a new SHA stays a reviewed docs change.
- `scripts/english-versions.ts` (`pnpm english-versions`): lists published zh-TW entries (posts, topic hubs, pages; drafts excluded) without `index.en.md`, using the content helpers from T10. Pure function plus a thin CLI; no network in the function.
- `.github/workflows/english-versions.yml`: on push to `main` touching `content/**`, on a weekly schedule, and on manual dispatch. Permissions `contents: read`, `issues: write`, no secrets, no environment, no agent or model. It runs the script and reconciles issues titled `english: <collection>/<slug>` with label `translation-needed`: open one per missing entry if none exists (open or closed); close an open one with a comment naming the commit when the English version exists; never reopen a closed one; close an open one with a comment when its entry is no longer published (deleted, now a draft, or renamed; a rename then gets a new issue under the new slug); never write to the repository. `concurrency: { group: english-versions, cancel-in-progress: false }`. Existing issues are found with the list-issues API (`labels=translation-needed`, `state=all`, paginated) matched on exact title, never with search, which lags. The token is `${{ github.token }}`.
- V1 (Renovate part, and `github-actions[bot]`): Renovate opens its onboarding PR and the workflow opens issues while PR and issue creation are limited to collaborators and the interaction limit is on; record the result in `docs/infra-current-state.md`. If either App, Renovate, or `github-actions[bot]` is blocked by the limit, stop with `needs-human`: the requirement and the agent design conflict, the author decides, and ADR-0012 records the outcome.

## Out of scope
Scheduled agent tasks (T20). Porting upstream Retypeset changes (each becomes its own Upgrade PR). Writing English content (the author does).

## Human steps

- **T19-H1, install Renovate (5 min).** `https://github.com/apps/renovate` → Install → `januswtlin` → Only select repositories → `januswtlin/januslin.me`. Send the agent: "T19-H1 done". Merge Renovate's onboarding PR when the agent says it is ready.

## Acceptance criteria
- [ ] Renovate onboarding PR merged; the dependency dashboard issue exists and lists expected groups (screenshot).
- [ ] A Node LTS update would be proposed via `.nvmrc` (show Renovate's detected dependencies in the dashboard).
- [ ] `pnpm visual-check --base <preview-url>` produces the screenshot set (artifact link).
- [ ] `pnpm check-versions` and `pnpm retypeset:upstream` output in the PR.
- [ ] V1 (Renovate, `github-actions[bot]`) recorded.
- [ ] On `main` with real content, a dispatch of `english-versions.yml` opens one issue per missing English version; a second dispatch opens none; a closed issue stays closed (run links). The closing path (English version added, entry unpublished) is shown with recorded API responses in the tests, and confirmed by the first real run after the author merges an `index.en.md` (the author's step; agents never write it).
- [ ] Manual dispatch of the monthly workflow opens the issue (demonstrate, then close it).

## Automated verification
What this task adds to `pnpm verify` (ADR-0010), and what stays manual.
- Unit tests for `check-versions` and `retypeset:upstream` (parsing, comparison, against recorded API responses) in `pnpm verify`.
- Unit tests for `english-versions` on content fixtures (zh-only post, zh+en pair, draft, hub, page) and for the issue reconciliation against recorded API responses: no duplicate, no reopen of a closed issue, close on arrival, close when the entry is unpublished or renamed.
- `visual-check` compares a preview against production; diffing against committed baselines already exists since T09 (ADR-0010).
- Manual: the Renovate onboarding and dashboard, the monthly workflow dispatch, and the first real `english-versions.yml` runs.
