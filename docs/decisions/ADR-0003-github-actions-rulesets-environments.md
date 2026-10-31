# ADR-0003: GitHub Actions for CI/CD, protected by a `main` ruleset and environment secrets
- Status: accepted
- Date: 2026-10-29
- Deciders: Janus, coordinator session

## Context
Agents always have GitHub access, not necessarily Cloudflare access, and CI must also run checks unrelated to deployment (content validation, SEO outputs, secret scanning). The repository is public (ADR-0012), so GitHub Free gives it rulesets, environment secrets, and deployment branch policies, and standard Actions runners cost nothing.

Several identities can write branches: the App `januslin-agent[bot]` (with Workflows write, so it can also push branch workflows), the machine account `januslin-agent` (Write collaborator, used by AI tools), and a phone's deploy key (ADR-0009). None of them may change `main` or reach the deploy token. A private repository on GitHub Free would need compensating controls for this; on a public repository GitHub enforces it.

## Decision
- **GitHub Actions** runs all checks, builds, preview uploads (`wrangler versions upload --preview-alias pr-<n>`), and production deploys (`wrangler deploy`). Cloudflare Workers Builds is not used, so logs and checks stay in one place.
- **Two `main` rulesets**, because a bypass actor bypasses every rule in its ruleset: `main-protect` with no bypass actors (require a pull request with 0 approvals, require the `ci` status check, require linear history, block force pushes and deletion), and `main-restrict-updates` (restrict updates, with the repository admin role as the only bypass actor, in pull-request-only mode). Only the author merges, only green PRs merge, and nobody, the author included, pushes to `main` directly (V2).
- **Auto-merge off.** GitHub cancels auto-merge only on pushes by users without write access; with it on, a push by the machine account to a PR the author had armed would merge unreviewed code under the author's name.
- **Environment secrets:** the Cloudflare token exists only in the environments `production` and `preview`, the Access service token for pre-cutover smoke tests only in `smoke`, each limited to the `main` branch. No repository-level secrets. A branch workflow cannot read them. Jobs that hold the Cloudflare token run no repo script and install wrangler from a committed lockfile with scripts disabled.
- **Build and deploy are separate jobs.** The job that runs `pnpm install` and the build holds no secret; the deploy job downloads the artifact and runs a pinned `wrangler` with `main`'s config and Worker. Previews use `workflow_run`, so the upload runs `main`'s workflow file with `main`'s `wrangler.jsonc` and `worker/`, never the PR's.
- No required reviewers on the environments: every commit on `main` is already the author's merge, and a second approval per publish adds friction for no protection. V3 records whether the owner could approve their own deploys, in case this is revisited.
- Repository settings: default `GITHUB_TOKEN` read-only, Actions may not create or approve PRs, approval required for outside contributors' workflow runs.

### Compensating controls a private Free repository would need, and why they are not used
| Control (private repo on GitHub Free) | Now | Why |
|---|---|---|
| Per-commit deploy gate (every commit since the last deploy must be an author merge; forward-only; `GATE_ACCEPTED_SHAS` exceptions) | Dropped. The deploy job only skips a run that is no longer the tip of `main` | The ruleset makes every `main` commit an author merge and forbids force pushes, server-side |
| `main-guard.yml` (incident issue on force pushes and non-PR commits) | Dropped | The ruleset refuses both; the quarterly review checks the ruleset itself. The coordinator's merge check (ADR-0014) still flags anything unexpected |
| `.githooks/pre-push` refusing pushes to `main` | Dropped | The server refuses them with a clear error. `.githooks/` keeps only `prepare-commit-msg` for the `Agent:` trailer |
| `workflow_run` for deploys, wrangler config allow-list, last-deployed-commit Worker in previews | Deploy runs inside `ci.yml` on `main`; previews keep `workflow_run` with `main`'s Worker and config; no allow-list | `main` is trusted once only the author can update it. Previews still must not run a PR's `wrangler.jsonc` (a `build` command) next to the token |
| Repository secrets readable by any branch workflow; "no `push`/`pull_request` workflow references a secret" rule | Environment secrets limited to `main` | Server-enforced |

## Alternatives considered
- Cloudflare Workers Builds: no secret to manage, but logs in Cloudflare and checks still in Actions.
- Keeping the per-commit gate and `main-guard` as defense in depth: they defended against writes the ruleset now refuses, and they were the most complex code in the pipeline.
- Required reviewers on `production`: see above.

## Consequences
- One required status check (`ci`), one place for logs.
- The deploy token is created by the author (T14) only after the environments exist.
- Changes to the ruleset, environments, or settings are the author's, and the quarterly review checks them.
- A `workflow_run` job using a `main`-only environment is assumed to work (V9); the CI task confirms it.

## Revisit when
- GitHub changes what public repositories get on the Free plan.
- Actions limits for public repositories change, or Workers Builds makes the split unnecessary.
