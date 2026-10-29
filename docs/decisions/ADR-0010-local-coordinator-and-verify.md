# ADR-0010: A local coordinator session dispatches subagents, and `pnpm verify` gates every task
- Status: accepted
- Date: 2026-10-29
- Deciders: Janus, coordinator session

## Context
Without coordination the author is the slowest part of the loop: pasting a dispatch prompt for every task, relaying reviews, starting the next session after each merge. Agents also need something to check their own work against before review, or "done" rests on evidence the authoring agent writes about itself. The author wants agents to drive the work between merges and keeps every merge, one PR at a time.

## Decision

### Coordinator session in the local sandbox
- One long-running Claude Code session in the sandbox started from the `agent` account (ADR-0013) runs the loop in `docs/agents/workflow.md` ("Coordinator loop"): pick startable tasks (derived from `main`), start one implementer subagent per task (fresh context, the task's role, its own git worktree from an up-to-date `main`), start a separate reviewer subagent on each PR (`januslin-reviewer[bot]`), pass blocking findings back, and report to the author when a PR is ready to merge.
- Implementers and reviewers can be Claude Code subagents or Codex sessions in the same sandbox, dispatched by the coordinator with `codex exec`; reviews are cross-tool by default, and implementers move to Codex when Claude's quota runs low (`docs/agents/workflow.md`, "Claude and Codex").
- The coordinator writes only `docs/` and never implements. It never starts cloud sessions or scheduled tasks (ADR-0009).

### Merge cadence
- The author merges every PR. No stacked PRs: a task starts only after every task it depends on is merged, from `main` at that point.
- A task's own PR sets its row to `done`, so `main` says `done` exactly when the work is merged. Readiness is derived from `main`, not stored. `pnpm tasks` (T08) computes it and checks the board against `docs/tasks/plan.md`.
- After every merge, open task PRs merge `main` into their branch (never rebase or force-push) and rerun `pnpm verify`.
- Independent tasks may run in parallel where `docs/tasks/plan.md` allows.

### `pnpm verify`
- One command that proves a task: `check`, `lint`, `validate`, `build`, `test`. The bootstrap task (T07) creates it; each task extends it as its "Automated verification" section says; `ci` runs the same checks.
- Acceptance tests first: an automatable criterion gets its test before the implementation, in its own `test:` commit that fails on the base (snapshot baselines after the implementation). Criteria that cannot be automated are marked "manual".
- Tests must be shown to bite: one deliberate, uncommitted break per new class of check, with the failing output in the PR.
- Self-repair has limits: stop and ask (`needs-human`) when the same check fails after two fix attempts, `pnpm verify` is red after five rounds, or the only fix is to weaken a test, update an unexplained baseline, or change a criterion. A test is never weakened or a baseline updated without saying so.

## Alternatives considered
- A cloud coordinator driving cloud sessions: a cloud session cannot reach the local sandbox, the Apps, or the local review identity, and starting cloud sessions is the author's alone (ADR-0009).
- Stacked PRs: rejected by the author.
- Agents merging after an approving review and a green `verify`: only the author merges (ADR-0003).

## Consequences
- The author's work per task is merging, the task's human steps, and `needs-human` items. The coordinator prepares human steps as exact instructions, batched, before they are needed.
- State lives in `docs/tasks/README.md`, the PRs, and their threads, so a new coordinator session resumes from them.
- Visual snapshot baselines are recorded on Linux in the sandbox, the same platform as CI.
- Parallel subagents share the sandbox: they start servers on free ports and stop them before they report.

## Revisit when
- A coordinator-run task causes an incident, or the self-repair limits stop more than one task in a row for the same reason.
