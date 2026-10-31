# Roadmap

Last reviewed: 2026-10-31 · Next review: first week of each month (see `docs/operations.md`)

This is where ideas wait until we decide to do them or not. Nothing here is committed work; committed work is a task issue under the plan issue [#11](https://github.com/januswtlin/januslin.me/issues/11). An item becomes a task only after it is `accepted` at a review.

## How items are evaluated

Each item gets a short assessment before a decision:

| Criterion | Question | Scale |
|---|---|---|
| Value | Does it help the author write and publish, or help readers/AI find and read the work? | 1 (nice) · 2 (clear benefit) · 3 (core to the site's purpose) |
| Effort | One-time agent work to build it | S · M · L |
| Running cost | Money, or risk of leaving a free tier | $0 · risk · paid |
| Maintenance | Ongoing burden for agents and the author (upgrades, moderation, tokens, failure modes) | low · med · high |
| Reversibility | Can we remove it cleanly later? | easy · hard |
| Fit | Consistent with ADRs and non-goals? If not, which ADR would change? | yes · needs ADR |

Decision rule of thumb: accept when Value ≥ 2, Running cost = $0, and Maintenance ≤ med, unless it needs an ADR change (then the author decides explicitly).

Status values: `idea` · `evaluating` · `accepted` (→ task ID) · `deferred` (with a "revisit when" trigger) · `rejected` (with reason) · `done`.

## Items

| ID | Item | Status | Value | Effort | Cost | Maint. | Revisit when / notes |
|---|---|---|---|---|---|---|---|
| R02 | **Read-only MCP server** "search Janus's writing" on the same Worker: tools for search, get entry (Markdown), list by tag; publish an MCP server card | idea | 2 | M | risk (Worker requests) | med | Interesting as an AI-native showcase. Evaluate after 3 months of AI Crawl Control metrics show agent traffic. |
| R03 | Comments (Giscus via GitHub Discussions) | deferred | 1 | S | $0 | med (moderation, third-party script, CSP) | Revisit if readers ask to respond publicly. |
| R04 | Newsletter / email subscription | idea | 2 | M | risk (most services paid beyond small lists) | med | Revisit when RSS subscribers or reader requests justify it. |
| R05 | Members-only or private posts (Cloudflare Access on a path) | idea | 1 | S | $0 | low | Requires a new ADR replacing ADR-0006. |
| R06 | Move images to R2 (and/or Cloudflare Images) | deferred | 2 | M | risk (R2 free tier limits) | med | Trigger: asset files > 15,000, repo > 1 GB, or build time > 6 min due to images. |
| R07 | Automated visual regression diffing for upgrades | accepted (→ T09, T16) | 2 | M | $0 | med | Part of the vendoring task's Playwright snapshot tests (ADR-0010); the CI task adds Linux baselines. |
| R08 | Webmentions (receive/send) | idea | 1 | M | $0 | med | |
| R09 | Maps: per-trip map and a site-wide map of places written about (travel, cafés) (static map tiles or SVG, no third-party JS) | idea | 2 | M | $0 if self-rendered | med | Needs `location.lat/lng` on posts. |
| R10 | Photo essays / gallery layout and EXIF display (camera, lens; never GPS) | idea | 2 | M | $0 | low | |
| R11 | Font refresh: a CJK font specimen and a possible change from Retypeset's default fonts | deferred | 1 | M | $0 | low | Retypeset's original design is kept for now (ADR-0001), so a font specimen task is not planned. Revisit after 3 months of publishing, or when the author asks. |
| R12 | Sidenotes component (Patrika-style) and refined accents (Pilcrow-style) | idea | 2 | S | $0 | low | Port as MIT components with notices. Good for tech/AI essays. |
| R13 | Agent Readiness Level 2+ items | rejected | 1 | n/a | n/a | n/a | No APIs, auth, or commerce on a blog; placeholders would game the score. Only via R02 if accepted. |
| R14 | Web CMS (e.g. Sveltia, Pages CMS) for mobile publishing | rejected (for now) | 1 | M | $0 | high | ADR-0004: a content-only credential cannot be enforced by GitHub, and emulating it in CI leaks. Revisit if GitHub adds path-level write permissions or Working Copy proves too awkward. |
| R15 | Split `content/` into its own repo | rejected (for now) | 1 | M | $0 | med | See ADR-0004. Revisit if a second consumer of the content appears. |
| R16 | Scheduled publishing (publish at a future `pubDate`) | idea | 1 | S | $0 | low | Daily scheduled rebuild + date filter. |
| R17 | Cloudflare Markdown for Agents (managed) | deferred | 1 | S | paid (Pro) | low | Revisit if offered on Free; would replace our own negotiation. |
| R18 | AI-assisted content ops: suggest tags, draft `description`, alt-text suggestions for photos, all as PR suggestions the author accepts (never translation) | idea | 2 | M | $0 (agent sessions) | low | Must never edit author content directly; suggestions only. |
| R19 | Series (multi-part essays) with navigation | idea | 2 | S | $0 | low | Needs a `series` field in the content model. |
| R20 | "Now" page or "Projects" page type | idea | 1 | S | $0 | low | Uses `pages.layout` extension point. |
| R21 | Structured coffee content: brew log (bean, roaster, grinder, setting, dose, yield, ratio, water, time, notes) and equipment pages, possibly as a new collection | idea | 2 | M | $0 | med | Revisit once a few coffee posts exist and the coffee project takes shape. Strong first-hand content for search and AI (ADR-0007). |
| R22 | GitHub Pro for server-side protection of a private repo | rejected | 1 | S | US$4/month | low | Moot: the repository is public (ADR-0012), which gives rulesets and environment secrets for free (ADR-0003). |
| R23 | One host check script for the quarterly review (`scripts/host-check.sh`, a CODEOWNERS path): the author runs one read-only command in `agent-session` and pastes one report, instead of a dozen separate commands | idea | 2 | S | $0 | low | Fewer, shorter human tasks (`docs/automation.md`, "Who does what"). Must print names and states only, never key or token contents. |

## Review procedure (coordinator, monthly)

1. Read new ideas added since the last review (anyone may add rows with status `idea`).
2. For each `idea` or item whose trigger fired: fill the assessment, decide, and write one line of rationale in the notes.
3. For each newly `accepted` item: open a task issue under the plan issue (the author approves it with the `approved` label) and link it here.
4. Update "Last reviewed" at the top.

Coordinator prompt:

```
You are the coordinator for januslin.me. Run the monthly roadmap review.
Read docs/roadmap.md, docs/overview.md, the ADR index, and docs/reports/ from the last month.
For each item that is new or whose "revisit when" trigger may have fired, propose an assessment and a decision with one-line rationale.
Do not change statuses yourself; produce a proposal for the author to approve, then apply the approved changes in a PR.
```
