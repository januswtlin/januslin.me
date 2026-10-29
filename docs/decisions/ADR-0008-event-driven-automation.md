# ADR-0008: Event-driven automation with Renovate, GitHub Actions, and scheduled agent tasks
- Status: accepted
- Date: 2026-10-29
- Deciders: Janus, coordinator session

## Context
The author wants upgrades and reviews to happen without starting each one, and a reminder when an entry has no English version yet. Agents need a reliable way to learn that work exists, without polling.

## Decision
- **Detect** with deterministic, free tools: Renovate for dependency, Node, pnpm, and Actions updates; GitHub Actions workflows that turn content events into issues (for example missing English versions, which need no agent at all).
- **Act** with Claude Code cloud scheduled tasks, triggered by GitHub PR or issue events or by schedules, on the author's Claude subscription. They act as the machine account `januslin-agent` (ADR-0009). Each task's prompt points to a versioned prompt file in `automation/prompts/`. The task board itself is run by the local coordinator (ADR-0010).
- **Decide** by the author merging PRs.
- Catalog and details: `docs/automation.md`.

## Alternatives considered
- `anthropics/claude-code-action` in GitHub Actions: would need a Claude credential as a secret. Kept as a fallback; with environment secrets limited to `main` (ADR-0003) it could only run from `main`.
- Dependabot updates: do not cover `.nvmrc`; Renovate does.
- Agents polling on a tight schedule: wasteful.

## Consequences
- Scheduled tasks are a research preview; the fallback stays documented.
- Only the author creates scheduled tasks.
- Human steps: install Renovate on the repository, create the scheduled tasks (T19-H1, T20-H1).

## Revisit when
- Scheduled tasks leave preview with different limits or features.
