# Deployment

Last reviewed: 2026-10-29 · Decisions: ADR-0002 (Workers), ADR-0003 (Actions, ruleset, environments)

**Status: design, not built yet.** Nothing in this file runs today. T14 ([#18](https://github.com/januswtlin/januslin.me/issues/18), Worker), T15 ([#20](https://github.com/januswtlin/januslin.me/issues/20), Access), T16 ([#23](https://github.com/januswtlin/januslin.me/issues/23), CI/CD), and T17 ([#24](https://github.com/januswtlin/januslin.me/issues/24), cutover) build it, and each corrects this file to what it built. What exists today: `docs/infra-current-state.md`.

## Overview

```
PR opened/updated ──▶ ci.yml (checks, preview build → artifact) ──workflow_run──▶ preview.yml (env: preview; versions upload → comment URL)
author merges ─────▶ ci.yml on main (checks, production build → artifact) ──▶ job deploy (env: production; deploy → smoke → rollback on failure)
```

GitHub Actions is the only path to production. Cloudflare Workers Builds is not used (ADR-0003).

## What protects production

| Control | Where | What it stops |
|---|---|---|
| Two `main` rulesets: `main-protect` (PR required, required check `ci`, linear history, no force push, no deletion; no bypass) and `main-restrict-updates` (only the repository admin may update, via PR); auto-merge off | GitHub, server-side (T01, `ci` check added in T16) | Direct or force pushes and merges by anyone but the author, including the machine account, the Apps, the phone's deploy key, and the author's own direct pushes; merges of red PRs by anyone |
| Environment secrets: the Cloudflare token lives only in the `production` and `preview` environments, the Access service token only in `smoke`, each limited to the `main` branch | GitHub, server-side (T14, T15) | A branch workflow reading the token. Workflows on other branches and on `pull_request` refs cannot enter these environments |
| Build and deploy in separate jobs | `ci.yml` | A malicious dependency in `pnpm install` seeing the token: the token is only in the deploy job, which runs a pinned `wrangler` on the downloaded artifact and no repo script |
| Previews use `main`'s Worker and config | `preview.yml` | A PR changing `wrangler.jsonc` (for example a `build` command) or `worker/` and having it run next to the token |
| Smoke test and automatic rollback | `ci.yml` deploy job | A broken deploy staying live |

The compensating controls a private repository on GitHub Free would need (a per-commit deploy gate, `main-guard.yml`, a local `pre-push` hook, a gate exception variable) are not used: the ruleset and environments enforce the same things on the server. ADR-0003 explains each.

## `wrangler.jsonc` (target shape; T14 owns the final version)

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "januslin-me",
  "account_id": "f2f02d203f0d3a3861b811030cb6f37f", // not secret
  "main": "worker/index.ts",
  "compatibility_date": "<date of T14>",
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "html_handling": "auto-trailing-slash",
    "not_found_handling": "404-page",
    // Only HTML entry paths invoke the script. Never /_astro/*, /fonts/*, images, feeds.
    // Generated from content/topics/ and content/pages/ by scripts/sync-worker-routes.ts; CI fails if out of sync.
    "run_worker_first": ["/tech/*", "/ai/*", "/travel/*", "/coffee/*", "/life/*", "/en/tech/*", "/en/ai/*", "/en/travel/*", "/en/coffee/*", "/en/life/*", "/about/", "/en/about/"]
  },
  // Added in T17 only. Before cutover, januslin.me is still attached to the old Pages project.
  "routes": [
    { "pattern": "januslin.me", "custom_domain": true },
    { "pattern": "www.januslin.me", "custom_domain": true }
  ],
  "workers_dev": false,
  "preview_urls": true,
  "observability": { "enabled": true }
}
```

Notes for T14:
- Verify `run_worker_first` semantics (globs, negation) in the current Cloudflare docs, and add a test that fails if a pattern could match `/_astro/`, `/fonts/`, or image, font, or feed extensions.
- `www.januslin.me` 301s to the apex with a zone Single Redirect rule (no Worker invocation).
- Decide the Markdown negotiation mechanism (Worker script or Transform Rule) and record it in ADR-0002.

## Workflows

### `ci.yml` (`pull_request`; `push` to `main`; `workflow_dispatch`)
Workflow and check name `ci`. Default `GITHUB_TOKEN` permissions are read-only (repository setting); jobs ask for more only where they post a label or comment.

Job `build` (no secrets):
1. Checkout, set up pnpm and Node (from `.nvmrc`), restore caches (pnpm store, `node_modules/.astro` image cache, Playwright browsers).
2. `pnpm install --frozen-lockfile`, then `pnpm exec playwright install chromium` (Mermaid renders at build time).
3. The same checks as `pnpm verify`, in the same order: `check`, `lint`, `validate`, `build`, `test`. A test or a documented check keeps the two lists equal.
4. Extra checks: gitleaks; slug history (every URL in the last production URL manifest still exists or has a `_redirects` entry); asset budget (fail above 18,000 files in `dist/` or any file over 20 MiB); Lighthouse against a local server of the build for home, a topic hub, a text-heavy post, and a photo-heavy post, thresholds from `docs/seo-aeo.md`.
5. Artifact: on PRs, `pnpm build:preview` (drafts included, `noindex` on every page, `X-Robots-Tag: noindex`) as `site-preview`; on `main`, the production build as `site-production`, plus the URL manifest.

Job `deploy` (only on `main`; `needs: build`; `environment: production`; holds `CLOUDFLARE_API_TOKEN`; runs no repo script):
1. Continue only if `github.sha` is still the tip of `main` (a later run deploys otherwise). Concurrency group `production`, `cancel-in-progress: false`.
2. Record the active version id for rollback (`wrangler deployments status --json`).
3. Check out `main` at `github.sha` with `persist-credentials: false`, sparse to `wrangler.jsonc`, `worker/`, and `.github/wrangler/` (a `package.json` and lockfile that pin wrangler and its whole dependency tree). Install wrangler from there with `pnpm install --frozen-lockfile --ignore-scripts`. Download `site-production` into a directory outside the checkout. Run `wrangler deploy --assets <that directory> --message "sha:<sha>"`. Never install the site's dependencies or run a repo script here. Every `wrangler` below is this pinned install.

Job `smoke` (`needs: deploy`; `environment: smoke`; runs the repo's smoke-test script; holds no Cloudflare token):
1. Until T17: against the deployed version's preview URL with the Access service token headers (`CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET`, secrets of the `smoke` environment). After T17: against `https://januslin.me`. Checks: home 200, one known entry 200, `robots.txt` content, `Accept: text/markdown` returns Markdown.
2. Requests that carry the Access headers never follow redirects, and their URLs are built from a fixed origin, so the headers cannot reach another host.

Job `rollback` (`needs: [deploy, smoke]`; `if: ${{ !cancelled() && needs.deploy.result == 'success' && needs.smoke.result == 'failure' }}`; `environment: production`; runs no repo script):
1. If a previous version id was recorded (passed through `env:`), `wrangler rollback "$PREV_VERSION" --name januslin-me --message "smoke test failed for <sha>"`. On the first deploy there is nothing to roll back to.
2. Open an issue labelled `incident`.

A forced smoke failure for testing rollback uses a `workflow_dispatch` input, accepted only when `github.actor_id` is the author's (2433928), so a Write collaborator cannot trigger rollbacks.

### `preview.yml` (`workflow_run` of `ci`, `completed`)
Runs from `main`'s copy of the file. `environment: preview`; holds `CLOUDFLARE_API_TOKEN`.
1. Continue only if the triggering run's event is `pull_request` and it concluded `success`.
2. Check out `main` with `persist-credentials: false`, sparse to `wrangler.jsonc` and `worker/`. A preview shows the PR's site with `main`'s Worker; Worker changes in a PR are tested in `ci` (`wrangler dev` tests) and by the smoke test after merge. Never run `pnpm install` or a repo script.
3. Download `site-preview` from the triggering run (`run-id`, `actions: read`) outside the checkout.
4. Install the pinned wrangler as in the deploy job, then `wrangler versions upload --preview-alias pr-<number> --assets <that directory>`. PR number: the entry in `workflow_run.pull_requests` whose `head.sha` equals the run's `head_sha`; skip if none matches.
5. Post or update a sticky PR comment with the preview URL and the Lighthouse summary. The summary comes from the PR's artifact, so it is untrusted: pass it through a file or `env:`, never interpolate it into `run:` or an expression.

Open verification V9 (`docs/infra-current-state.md`): a `workflow_run` job can use an environment limited to `main`. T16 confirms it before relying on it.

### Workflow rules
- No `pull_request_target` workflows. No `workflow_run` workflow other than `preview.yml`.
- Every job sets the smallest `permissions:`; nothing from a PR, an artifact, an issue, or a comment is interpolated into `run:`.
- `actionlint` and `zizmor` run in `pnpm verify` and `ci` over `.github/workflows/` (T16).
- A branch workflow can raise its own `GITHUB_TOKEN`, so a green `ci` is trusted only from the `ci.yml` run for the exact commit (`docs/security.md`).

## Secrets and environments

| Environment | Branch policy | Secrets | Required reviewers |
|---|---|---|---|
| `production` | `main` only | `CLOUDFLARE_API_TOKEN` | none (V3 records whether the owner could approve their own deploys; the rulesets already make every `main` commit the author's merge) |
| `preview` | `main` only | `CLOUDFLARE_API_TOKEN` | none |
| `smoke` | `main` only | `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET` (until T17) | none |

The `preview` job holds a token that can also deploy production; it is pinned and reviewed like the deploy job (`docs/security.md`, threat model).

No repository-level secrets or variables. The account id is not secret and lives in `wrangler.jsonc`. Workflows pass any `vars.*` or inputs through `env:`, never interpolated into `run:`. Third-party actions are pinned to full commit SHAs with a version comment.

## Rollback

- `wrangler rollback <version-id> --name januslin-me`, from the author's account with a short-lived token, or the `rollback` job. List versions with `wrangler versions list --name januslin-me`.
- Content mistakes: revert the PR on GitHub; the revert's merge redeploys.
- `docs/operations.md` → "Roll back production".

## Build budget

- Target CI time under 4 minutes with warm caches; investigate above 6 minutes.
