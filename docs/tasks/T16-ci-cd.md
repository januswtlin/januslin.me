# T16: CI, previews, production deploy

- Role: Platform Engineer
- Depends on: T10, T14, T15 · Human steps: T16-H1, T16-H2 (needs T14-H2 and T15-H2 done)
- Identity: app (`januslin-agent[bot]`, which has Workflows write; the author reviews every workflow diff, CODEOWNERS)
- Branch: `agent/platform/T16-ci-cd`
- Size: L

## Goal
Every PR is validated and gets a protected preview URL; every merge to `main` deploys, is smoke-tested, and rolls back automatically on failure; the Cloudflare token is reachable only from `main`.

## Read first
`docs/deployment.md` (all), `docs/security.md`, ADR-0003, ADR-0012, `docs/agents/workflow.md`, `docs/infra-current-state.md` (V3, V9). GitHub docs: environments and deployment branch policies, `workflow_run`, `actions/download-artifact` with `run-id`. Wrangler docs: `deploy --assets`, `versions upload --preview-alias`, `rollback`, `--message`.

## Scope
- `.github/workflows/ci.yml` and `preview.yml` exactly as in `docs/deployment.md`. Pin third-party actions to full commit SHAs with a version comment. Set the smallest `permissions:` per job.
- `ci.yml` job `build`: the same checks as `pnpm verify`, in the same order, plus gitleaks, the slug-history check (a URL manifest artifact from each production build), the asset budget, and Lighthouse against a local server of the build with the thresholds in `docs/seo-aeo.md`. Caches: pnpm store, `node_modules/.astro`, Playwright browsers. Chromium installed before `pnpm build`.
- `ci.yml` jobs `deploy` and `rollback` (environment `production`) and `smoke` (environment `smoke`) on `main` only, as in `docs/deployment.md`. The deploy, rollback, and preview jobs install wrangler from `.github/wrangler/` (`package.json` and lockfile, `pnpm install --frozen-lockfile --ignore-scripts`; Renovate updates it) and never install the site's dependencies or run a repo script. Until T17, smoke tests target the deployed version's preview URL with the Access service token; after T17, `https://januslin.me`.
- Forced rollback test: a `workflow_dispatch` input that makes the smoke test request a path that returns 404, honored only when `github.actor_id == 2433928`.
- `preview.yml` (`workflow_run`, `preview` environment): `main`'s `wrangler.jsonc` and `worker/`, the PR's `site-preview` artifact, sticky PR comment. Confirm V9 before relying on it; if a `workflow_run` job cannot use the `main`-only environment, stop and propose an alternative in the PR (do not loosen the branch policy).
- Fake-`ci` test (the trigger in ADR-0009, risk 5): on a throwaway branch, a `workflow_dispatch` workflow pushed by `januslin-agent[bot]` raises its `GITHUB_TOKEN` (`permissions: checks: write, statuses: write`) and tries to create a passing check run and a commit status named `ci` on the head commit of a throwaway PR. Record whether GitHub accepts each, and whether the `main-protect` required check counts it. Delete the branch, the PR, and anything created. If either is accepted, open the follow-up for the narrow token (ADR-0009) and say so in the handoff.
- V3: on a throwaway environment with the author as required reviewer and "prevent self-review" off, does the author's approval of a run they triggered work? Record the result; delete the environment afterwards. Do not add reviewers to `production` or `preview`.
- Visual snapshot baselines: they are already Linux (recorded in the sandbox). Confirm `ci` passes against them on the GitHub runner; if fonts or rendering differ, `ci` generates replacements on request as an artifact (it never pushes) and the implementer commits them with the reason. Document the procedure in `docs/deployment.md`.
- Delivery in two PRs, because `workflow_run` and the `main` jobs only run from `main`:
  1. Workflows PR. Its own run proves the `build` job. **Merging it deploys production for the first time** (the Worker without custom domains). After merge, the author adds `ci` as a required status check to `main-protect` (prepared as an exact command). V2 addendum: a PR whose `ci` is failing or pending cannot be merged, by the author either.
  2. Verification PR: a trivial change that shows the preview, the deploy, and a forced rollback; it records run URLs in `docs/deployment.md` and corrects that doc to what was built.

## Out of scope
Custom domains (T17). Renovate and the monthly workflow (T19).

## Human steps

Only the author can do these. The agent prepares each one with the exact values before it is needed and waits for the reply. Never paste a secret into a chat; where a secret is involved, the step stores it directly.

- **T16-H1, require `ci` (5 min), after the workflows PR merges.** Run the `gh api` command the agent sends that adds the `ci` status check to `main-protect`, then check that a PR with failing `ci` shows no merge button for you. Send the output.
- **T16-H2, forced rollback and V3 (10 min).** Dispatch `ci` on `main` with the forced-failure input the agent names (Actions → ci → Run workflow); afterwards close the `incident` issue it opens. For V3, approve the run on the throwaway environment the agent created, and send what GitHub allowed.

## Acceptance criteria
- [ ] A test PR shows `ci` green, a preview URL comment behind Access, and the Lighthouse summary (verification PR; manual).
- [ ] A PR that removes a published fixture slug without a redirect fails the slug-history check (demonstrated).
- [ ] `grep -rn CLOUDFLARE_API_TOKEN .github/workflows` lists only the deploy and rollback jobs in `ci.yml` and `preview.yml`; each of those jobs declares an environment; none installs the site's dependencies or runs a repo script; `CF_ACCESS_` appears only in the `smoke` job (point to the lines).
- [ ] A branch workflow that tries to use the `production` environment is refused by the branch policy and the workflow cannot read `CLOUDFLARE_API_TOKEN` or the Access secrets: on a throwaway branch, a `workflow_dispatch` workflow pushed by `januslin-agent[bot]` that references `environment: production` and prints whether `secrets.CLOUDFLARE_API_TOKEN` is non-empty (never the value) is refused or reports empty; branch deleted afterwards.
- [ ] The merge of the verification PR deploys; a forced smoke failure by the author rolls back and opens an `incident` issue; the next deploy succeeds (run URLs).
- [ ] The forced-failure input is ignored when another actor dispatches (test of the condition, or a dispatch by the machine account from the author's browser).
- [ ] V3 and V9 recorded in `docs/infra-current-state.md`.
- [ ] The fake-`ci` test ran, with its result recorded in ADR-0009 (and the narrow-token follow-up opened if a fake check was accepted).
- [ ] `ci` is a required status check on `main-protect`, and a red PR cannot be merged by the author (API output, screenshot).
- [ ] `docs/deployment.md` matches the implemented workflows.

## Automated verification
- `ci` runs the same checks as `pnpm verify`; a test compares the two lists.
- Smoke-test unit tests: the URL is built from a fixed origin; requests with Access headers do not follow redirects (a 3xx to another host fails without being followed).
- Workflow lint (`actionlint` and `zizmor`) in `pnpm verify` and `ci` for `.github/workflows/`, enforcing the rules in `docs/deployment.md` ("Workflow rules").
- Manual: the runs on GitHub and Cloudflare (preview, deploy, rollback, branch-policy refusal), V3, V9.
