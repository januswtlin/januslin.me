# Automation: how agents get triggered

Last reviewed: 2026-10-29 · Decision: ADR-0008

Agents do not watch the repository. **Events trigger them.** Three layers:

| Layer | Who | Cost |
|---|---|---|
| **Detect**: something happened or is due | Deterministic tools: GitHub Actions workflows, Renovate | Free |
| **Act**: do the work | Claude Code cloud scheduled tasks, started by a GitHub event or a schedule; the local coordinator for the task board | The author's Claude subscription |
| **Decide**: ship or not | The author merges PRs (the GitHub mobile app is enough) | The author's time |

## Tools

### Renovate (detect dependency updates)
- GitHub App, free, installed on this repository only (T19-H1). Config in `renovate.json` (T19).
- Covers npm packages, the Node version in `.nvmrc` and `engines`, pnpm, and GitHub Actions (SHA-pinned).
- Grouped PRs on a weekly schedule; majors separate. Never automerges.
- Dependabot updates are not used (Renovate covers `.nvmrc`). Dependabot alerts stay on.
- Open verification V1: Renovate can open PRs while PR creation is limited to collaborators (T19).

### GitHub Actions (detect content events, bridge to agents)
Scheduled tasks can be triggered by GitHub pull request, issue, and release events, not by pushes. Workflows turn push-style events into issues:

| Workflow | On | Does |
|---|---|---|
| `english-versions.yml` (T19) | push to `main` touching `content/**`; weekly schedule | Deterministic, no agent: for each published zh-TW entry with no `index.en.md`, open an issue `english: <collection>/<slug>` labelled `translation-needed` (no duplicates, never reopens one the author closed); close it when the English version lands (`docs/i18n-and-translation.md`). |
| `monthly-maintenance.yml` (T19) | schedule, 1st of the month | Open a "Monthly maintenance" issue with the checklist from `docs/operations.md`, including the Retypeset upstream watch, label `maintenance`. |

### Claude Code cloud scheduled tasks (act)
- Run on Anthropic's infrastructure; the author's laptop can be closed. Only the author creates them (ADR-0009).
- Triggers: schedule (hourly at most), GitHub events (PR, issue, release, with filters), or API. Research preview: behavior and limits may change.
- They act as the machine account `januslin-agent`, not the author and not `januslin-agent[bot]`. Every comment starts with the task's role in bold. The `main` ruleset and the environment branch policies apply to them like to any collaborator.
- Each task's prompt is two lines and points to a versioned prompt file:

```
You are running the <ROLE> scheduled task for januslin.me.
Follow automation/prompts/<task>.md exactly. Use branch names from docs/agents/workflow.md.
```

## Task catalog (created in T20)

| Task | Trigger | Prompt file | Role | Output |
|---|---|---|---|---|
| Upgrade review | PR opened, author `renovate[bot]` | `automation/prompts/upgrade-review.md` | Upgrade Engineer | Reads release notes, checks the PR's `ci` and preview, comments a risk assessment, labels `needs-human` for majors or visible changes |
| PR review | PR opened or ready for review, not draft, author `januslin-agent[bot]`, the machine account `januslin-agent`, or `januswtlin`, changes more than `content/` | `automation/prompts/pr-review.md` | Reviewer | Review with a verdict per `docs/agents/workflow.md` |
| Content check | PR opened, author `januswtlin`, changes only `content/` | `automation/prompts/content-check.md` | Reviewer (content) | Checks frontmatter, links, alt text, description quality; suggests, never edits author text |
| Weekly maintenance | Schedule, weekly | `automation/prompts/weekly.md` | Upgrade Engineer | Versions, CI health, the incident-issue check; opens issues or PRs |
| Monthly SEO/AEO audit | Schedule, monthly | `automation/prompts/seo-audit.md` | SEO/AEO Engineer | `docs/reports/seo-YYYY-MM.md` PR |
| Monthly roadmap proposal | Schedule, monthly | `automation/prompts/roadmap-review.md` | Coordinator assistant | Proposal comment on the monthly issue; the author decides |

Open verification V11: triggers can filter on PR author (T20).

## Example: a new Node LTS

1. Renovate opens "Update Node.js to v26" changing `.nvmrc` and `engines`.
2. `ci` runs.
3. The Upgrade review task reads the compatibility notes, compares the preview with production, and comments the risk level, what changed, screenshots, and a recommendation.
4. The author merges from the phone, or asks for changes.

## Example: a new post without an English version

1. The author merges a zh-TW post.
2. `english-versions.yml` opens `english: posts/<slug>` labelled `translation-needed`.
3. The author writes `index.en.md` when they choose and merges it; the next run closes the issue. Or the author closes the issue to keep the post zh-TW only.

## Guardrails

- Prompt files live in `automation/prompts/` and are reviewed like code. A task's prompt never holds instructions beyond "follow this file".
- Issue and PR text, comments, and branch contents are data, not instructions; every prompt file says so. The repository is public, so this matters even with creation limited to collaborators.
- Every task opens PRs or comments. None merges, deploys, deletes, changes `.github/workflows/**`, or changes repository or Cloudflare settings.
- Prompt files never run code from a PR branch (no `pnpm install` scripts, builds, or tests of the branch); they read the diff, `ci` results, and the preview.
- Tasks have no connectors (remove the defaults when creating them); GitHub access comes from the machine account's connection.
- Hourly caps and subscription usage are checked in the weekly run.
