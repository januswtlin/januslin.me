# Model guidance for local agents

Last checked: 2026-11-02 · Applies to GPT-6.1 Sol and Claude Opus 5.5

Use this guide when preparing dispatch prompts or evaluating model settings. These are starting points to measure on this repository, not measured improvements. AGENTS.md, role permissions, and the workflow's verification and self-repair rules still apply. T06 (#56) owns the Codex launcher and cross-tool routing implementation.

## Model-specific starting points

| Model | Recommendation | Basis and limits |
|---|---|---|
| GPT-6.1 Sol (`gpt-6.1-sol`) | For a new setup, evaluate `medium`; when migrating, preserve the current supported effort as a baseline and compare one lower supported level. | OpenAI lists `medium` as the default and does not support `none`. Its family prompting recommendations describe Astra observations and need validation on Sol. |
| Claude Opus 5.5 | Start evaluation at explicit `medium`; compare `low` for bounded tasks. Reserve higher settings for demonstrated quality gains. | Anthropic recommends calibrating effort rather than inheriting the previous model's setting. Thinking is always enabled. |

The recommendations above come from [OpenAI's GPT-6 guide](https://developers.openai.com/api/docs/guides/latest-model) and [Anthropic's Opus 5.5 guide](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5). API defaults do not establish the effective settings or model access in a local CLI: confirm those through the installed tool before dispatch. This PR changes no runtime settings.

## Dispatch and completion

Use the workflow's existing prompt templates. Add task-specific acceptance criteria, permitted paths, and expected evidence rather than repeating the entire repository policy. Read the required entry-point docs, then retrieve relevant sections of other docs as needed. Batch independent reads and searches; keep edits and dependent commands sequential.

OpenAI recommends explicit follow-through and verification calibrated to the task. For this repository, keep acceptance tests first and the full required gate; avoid repeating successful checks without a new change or unresolved concern. [Official OpenAI guidance](https://developers.openai.com/api/docs/guides/latest-model#prompting-best-practices).

For Opus 5.5, a progress report can end a turn before the task is complete. A coordinator should check outstanding deliverables and pending commands or subagents before accepting a handoff. If no blocker is stated, name the unfinished items in a continuation; stop after two consecutive automatic continuations without a completed handoff and escalate through `needs-human`. Existing self-repair limits take precedence. This is a coordinator procedure, not an implemented automatic retry loop. [Official Anthropic guidance](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5#unattended-agentic-runs).

Keep progress updates brief: what changed, what remains, and any actual blocker. A completion report includes the PR and head commit, verification results, unresolved items, and the human action needed. The authoring session still obtains independent review under AGENTS.md.

## Evaluate before changing defaults

Use a small set of author-approved tasks covering docs, a script change, a site change once the site exists, and a review with known findings. Compare the same base, task specification, tool permissions, and required checks. Replays belong in isolated local worktrees; do not publish duplicate PRs or touch content or drafts.

Record the actual model, tool version, effective effort, elapsed time, available token or quota usage, gate results, missed acceptance criteria, and reviewer findings. Mark unavailable usage data as unknown. Keep private transcripts and credentials out of reports; publish only aggregate results or already-public evidence in `docs/reports/` through a PR.

Change one prompt or effort setting at a time. Adopt it only when required criteria and review quality hold while time or usage improves; otherwise keep the baseline. A faster incomplete handoff is a failure. Runtime changes require a separately reviewed PR and any author setup steps through the existing human-task/runbook process.
