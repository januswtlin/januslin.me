# Model evaluation

Last checked: 2026-11-02 · Optional research for model tuning, not ordinary task startup.

Optimize total tokens per accepted task: all implementation attempts, repair, coordinator work, and independent review. Acceptance requires every criterion met, the full required test gate passing, and no blocking review finding. A shorter failed run is not a saving.

| Model | Evaluation starting point |
|---|---|
| GPT-6.1 Sol | `medium` is the API default; `none` is unsupported. Preserve supported effort when migrating, then compare one lower supported level. |
| Claude Opus 5.5 | Start at explicit `medium`; compare `low` on bounded tasks. Higher effort must earn its extra tokens through better completion. |

Sources: [OpenAI](https://developers.openai.com/api/docs/guides/latest-model), [Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5). These are evaluation starting points, not measured repository optima or CLI defaults. T06 (#56) owns runtime selection.

Use the same approved tasks, base, permissions, and tests across settings, in isolated worktrees without duplicate published PRs. Include docs, scripts, site work when available, and reviews with known findings. Change one variable at a time. Keep required independent review; extra agents must justify their additional context and output.

Record actual model/tool/effort, all attempts, input/output tokens (including review and reasoning where reported, without double-counting), completion rate, test results, and missed review findings. Separate cached tokens and monetary cost from token totals. Missing usage is unknown; words or characters measure document size only. Include tokens spent on failed trials in the comparison, and repeat matched trials before adopting a setting.

Prefer the lowest measured total token usage that preserves completion and review quality. Do not impose a hard output cap that truncates work or skip tests to meet a token target. Publish aggregate evidence through a PR; keep transcripts and credentials private. See [the study](../reports/agent-token-efficiency.md) and ADR-0017 for the current evidence and limits.
