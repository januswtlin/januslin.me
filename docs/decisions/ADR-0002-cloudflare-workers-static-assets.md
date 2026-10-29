# ADR-0002: Cloudflare Workers static assets instead of Pages
- Status: accepted
- Date: 2026-10-29
- Deciders: Janus, coordinator session

## Context
The live site is a Pages project `januslin` Git-connected to the old repository `januswtlin/januslin`; an existing Pages project cannot be switched to another repository, and it holds almost no configuration worth keeping. Cloudflare positions Workers as the broader platform and documents a Pages-to-Workers migration.

The site needs two things static hosting cannot do alone: Markdown content negotiation (`Accept: text/markdown`) and per-page `Link` headers for AI agents. Cloudflare's managed "Markdown for Agents" was reported (2026) as Pro and above.

## Decision
- A new Worker `januslin-me` with static assets, configured in `wrangler.jsonc`, deployed from GitHub Actions. `januslin.me` and `www.januslin.me` become custom domains at cutover; the Pages project is deleted after it.
- The Worker script stays minimal and runs only for HTML entry paths through a narrow `run_worker_first`. On the Free plan, script invocations count against a daily limit; asset requests that skip the script do not.
- The Worker task evaluates two mechanisms for Markdown negotiation and records the result here as an addendum: (1) the Worker script; (2) a zone Transform Rule rewriting the path when `Accept` contains `text/markdown`, if the Free plan allows the needed expression. Criteria, in order: correctness (same URL, `Vary: Accept`), no impact on normal readers, Free-plan compatibility, config as code.

## Alternatives considered
- Reuse the Pages project: blocked by the repository connection, and its settings live in the dashboard.
- Workers Builds instead of GitHub Actions: ADR-0003.

## Consequences
- Hosting config is reviewable in PRs.
- A short cutover window when `januslin.me` moves from Pages to the Worker.
- Daily script invocations are monitored (`docs/operations.md`).

## Revisit when
- Cloudflare offers Markdown for Agents on the Free plan, or traffic approaches the script limit.
