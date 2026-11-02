# Study: tokens through accepted task completion

Date: 2026-11-02 · Task: #97 · Proposal: ADR-0017

The objective is the smallest total token usage that completes the task, passes every required test, and clears independent review. Minimizing a single prompt, effort setting, or run is an incomplete objective. Include failed attempts, repair, coordination, and review in the total; also track completion rate so an early failure cannot appear efficient.

## What the sources establish

[OpenAI's current guide](https://developers.openai.com/api/docs/guides/latest-model#prompting-best-practices) recommends calibrated verification rather than unnecessary repeated checks. Its family prompting observations concern Astra and require evaluation on Sol. Sol supports `low` through `max` with `medium` as the default; this does not establish an optimum for repository tasks.

[Anthropic's Opus 5.5 guide](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5#calibrate-effort) recommends starting at explicit `medium`, testing effort levels, and reserving higher settings for measured gains. Its [effort documentation](https://platform.claude.com/docs/en/build-with-claude/effort) describes the token/thoroughness tradeoff. These vendor observations do not prove that `low` minimizes tokens after repair and review here.

## Repository changes

- Deduplicate architecture in AGENTS.md against the already-required overview. Preserve every shared rule from the first proposal verbatim, including content boundaries, credentials, review, and merge controls.
- Move the complete coordinator loop into a coordinator-only required document. Preserve its behavior and update its self-reference and entry links. Every role still reads the full shared workflow, including trust checks and self-repair limits.
- Shorten dispatch by referencing mandatory rules. Keep task identity, checked body timestamp, branch/base, tests, handoff, and independent review responsibilities explicit.
- Keep model tuning and this study out of ordinary startup. Retain complete test logs locally; return status and relevant evidence instead of loading every successful assertion into context. Full gate and independent reviewer verification remain required.

## Measured document footprint

Count the four shared startup files once each: `AGENTS.md`, `docs/overview.md`, `docs/agents/roles.md`, and `docs/agents/workflow.md`. Counts use Python `len(text.split())` and `len(text)` on UTF-8-decoded git/file contents. Before PR is commit `0f7c745`; first proposal is `6ed2586`; revised means this PR's final versions of those four files.

| Version | Whitespace-separated words | Unicode characters |
|---|---:|---:|
| Before PR | 8,535 | 56,090 |
| First proposal | 8,712 | 57,381 |
| Revised | 7,157 | 47,764 |

The revised shared startup is 16.1% smaller by words and 14.8% by characters than before the PR. This measures source text, not model tokens, cache behavior, or total task savings. Coordinators additionally load their moved procedure; task-specific reads and tool/system context are excluded. The model guide, ADR, and study are optional unless the task concerns them. Tokenizers differ; no tokenizer or model trial was run for these counts.

## Validation and limits

Compare the shared rules verbatim with `6ed2586`, and compare the moved coordinator block after normalizing its heading, self-reference, and terminal blank lines. Inspect dispatch against the original workflow responsibilities, check changed local links, run the existing shell suite and whitespace check, and obtain a fresh independent review of the substantive revision. These verify the documentation change, not the effectiveness of future task executions.

No matched end-to-end Sol/Opus trials are available. Claude's weekly quota blocked the earlier cross-tool attempt. Runtime effort remains unchanged. The model evaluation guide defines matched trials with complete usage and quality evidence; select a lower-effort setting only after those trials demonstrate a reduction without lost completion or review quality. A global minimum cannot be claimed from a documentation study.
