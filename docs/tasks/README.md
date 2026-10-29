# Task board

> **First, right after pushing the initial commit:** do **T01-H1** (lock the repository's interaction and contribution settings). See `plan.md`.

One row per task. Each task is done by one session in one role and lands as one PR. **Order, phases, and what runs in parallel: [`plan.md`](plan.md).** How work flows: `docs/agents/workflow.md`.

- A task's own PR sets its row to `done` with the PR link; the row reaches `main` when the author merges.
- A task is **startable** when its status is not `done` or `dropped` and every task in "Depends on" is `done` on `main`, whatever its Status cell says. The next task is the first startable one in `plan.md`. From T08, `pnpm tasks` prints it and `pnpm tasks --check` checks this board against the plan.
- Statuses: `blocked` · `ready` · `in-progress` · `review` · `done` · `dropped`.
- Human steps are the author's steps, numbered per task (`T01-H1`, `T01-H2`, ...) and written out in each task file's "Human steps" section. `plan.md` shows them in order with the agent's work.

| ID | Title | Role | Depends on | Human steps | Size | Status | PR |
|---|---|---|---|---|---|---|---|
| [T01](T01-repo-settings-and-ruleset.md) | Repository settings, `main` rulesets, App installations | Platform | none | T01-H1, T01-H2, T01-H3, T01-H4 | S | ready | |
| [T02](T02-machine-account-and-agent-scripts.md) | Machine account, App transfer, agent scripts | Platform | T01 | T02-H1, T02-H2, T02-H3, T02-H4, T02-H5, T02-H6, T02-H7, T02-H8 | M | blocked | |
| [T03](T03-sandbox-runtime.md) | Sandbox runtime and token broker | Platform | T02 | T03-H1, T03-H2, T03-H3, T03-H4, T03-H5 | M | blocked | |
| [T04](T04-coordinator-slack-channel.md) | Coordinator Slack channel, config outside the repo | Platform | T03 | T04-H1, T04-H2, T04-H3 | S | blocked | |
| [T05](T05-claude-code-local-and-cloud.md) | Claude Code in the sandbox and in the cloud | Platform | T03 | T05-H1, T05-H2, T05-H3, T05-H4, T05-H5, T05-H6, T05-H7 | M | blocked | |
| [T06](T06-codex-local-and-cloud.md) | Codex in the sandbox and in the cloud | Platform | T05 | T06-H1, T06-H2, T06-H3, T06-H4, T06-H5, T06-H6, T06-H7 | M | blocked | |
| [T07](T07-bootstrap-node-project.md) | Bootstrap the Node project and `pnpm verify` | Platform | T04, T06 | none | S | blocked | |
| [T08](T08-task-plan-check.md) | `pnpm tasks`: check the board, print the next task | Platform | T07 | none | S | blocked | |
| [T09](T09-vendor-retypeset.md) | Vendor Retypeset, upgrade to Astro 7 | Site | T08 | T09-H1 | L | blocked | |
| [T10](T10-content-layer.md) | Content layer: collections, schema, validation | Site | T09 | none | M | blocked | |
| [T11](T11-routing-i18n.md) | Routing, topic hubs, tags, i18n UI | Site | T10 | none | L | blocked | |
| [T12](T12-media-rich-content-search.md) | Images, rich content, search | Site | T11 | T12-H1 | M | blocked | |
| [T13](T13-seo-aeo-outputs.md) | SEO and AEO outputs | SEO/AEO | T11 | none | M | blocked | |
| [T14](T14-worker-hosting.md) | Worker, wrangler config, headers | Platform | T09 | T14-H1, T14-H2, T14-H3 | M | blocked | |
| [T15](T15-access-for-previews.md) | Cloudflare Access for previews | Platform | T14 | T15-H1, T15-H2, T15-H3 | S | blocked | |
| [T16](T16-ci-cd.md) | CI, previews, production deploy | Platform | T10, T14, T15 | T16-H1, T16-H2 | L | blocked | |
| [T17](T17-cutover.md) | Cutover and go-live | Platform | T12, T13, T16 | T17-H1, T17-H2, T17-H3, T17-H4, T17-H5, T17-H6 | M | blocked | |
| [T18](T18-post-launch-audit.md) | Post-launch independent audit | Reviewer | T17 | T18-H1 | S | blocked | |
| [T19](T19-renovate-and-maintenance.md) | Renovate, maintenance tooling, missing-English check | Platform | T16 | T19-H1 | M | blocked | |
| [T20](T20-scheduled-agent-tasks.md) | Scheduled agent tasks and prompt files | Platform | T05, T16, T19 | T20-H1, T20-H2 | M | blocked | |

## Task file format

Every task file has a header (Role, Depends on, Human steps, Identity, Branch, Size), then Goal, Read first, Scope, Out of scope, Human steps, Acceptance criteria, and Automated verification. Each human step says where to click, what to type, and what to send back to the agent. A step shared by several tasks is written out in the first task that needs it; later tasks refer to it (for example "as in T14-H1"). Acceptance criteria must be checkable by someone who did not write the code; criteria that cannot be automated say "manual".

`Identity:` is `app` (`januslin-agent[bot]`, through the sandbox proxy or `scripts/agent-gh`; it also covers `.github/workflows/**` changes), `machine account` (cloud sessions), or `author` for steps only the author can do. Repository settings, secrets, merges, and account changes are always the author's (ADR-0009).
