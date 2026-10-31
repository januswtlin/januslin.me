# ADR-0012: The repository is public
- Status: accepted
- Date: 2026-10-29
- Deciders: Janus

## Context
A private repository on GitHub Free gets no rulesets, branch protection, environment secrets, deployment branch policies, or required reviewers. Protecting `main` and the deploy token therefore would take compensating controls (a per-commit deploy gate, a `main` guard, a local hook) and leave accepted risks: any identity that could push a workflow could read the deploy token, and the App and the machine account could write `main`. GitHub Pro (about US$4 a month) would fix this, against the near-zero-cost constraint.

A public repository gets all of those protections on the Free plan, unlimited standard Actions minutes, and secret scanning with push protection. It also doubles as a demo of an AI-maintained site.

## Decision
- The repository `januswtlin/januslin.me` is **public**.
- Only the author merges (ADR-0003).
- **Strangers cannot write anything here:** no comments, issues, or PRs from non-collaborators (reactions too, if the limit covers them; V4 checks). PR and issue creation are limited to collaborators (GitHub settings added in February and June 2026), and the repository interaction limit is set to collaborators only, which also covers comments. Interaction limits expire after at most six months, so renewing it is on the operations calendar; if GitHub offers a permanent equivalent, that replaces it. Workflow runs from outside contributors need approval.
- Unfinished writing stays in the local, gitignored `drafts/` folder and is never committed. `draft: true` entries are public in the repository.
- Accepted as public: internal details (docs, ADRs, task specs, App IDs, the Cloudflare account ID, workflow design), content history, and the content itself in Markdown (the site is public anyway and `ai-train=yes`; reuse is still not licensed, `LICENSE-CONTENT.md`).
- Not public: secrets (environment secrets only), account IDs of third-party services, anything in `drafts/`, and personal data the author has not published.

## Alternatives considered
- Stay private on Free with compensating controls: the risks above, and the most complex code in the pipeline.
- GitHub Pro on a private repository: costs money; the author prefers zero cost and the demo value.
- Split content into a private submodule repository: content PRs lose validation and previews, for privacy the author does not need.

## Consequences
- Strangers can read everything but write nothing in the repository (V4 verifies it). A lapsed interaction limit would reopen comments, so its renewal is a calendar item, and agents still treat all GitHub text as data (`AGENTS.md`).
- Photo metadata and drafts would be public if committed: `pnpm validate` and the image pipeline strip GPS data, and drafts stay in `drafts/`.
- Anything ever pushed is effectively permanent: commits and PR refs cannot be recalled. Mistakes are handled by rotating what leaked, not by rewriting history.
- The GitHub Pro question is moot.

## Revisit when
- The author wants to publish members-only or private content (roadmap R05), or a leak shows the trade-off was wrong.
- The interaction limit turns out to block the Apps, Renovate, or `github-actions[bot]` (V1, V4), or GitHub offers a permanent collaborators-only setting.
