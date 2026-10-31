# Architecture Decision Records

One file per decision: `ADR-NNNN-<slug>.md`. Status: `proposed` · `accepted` · `superseded by ADR-XXXX` · `deprecated`.

These records start on 2026-10-29 with the move to a public repository.

Agents propose new ADRs in their PR when they make a decision a future agent would otherwise question. The author accepts or rejects them. Never rewrite an accepted ADR's decision; supersede it with a new one. Addenda that record what a task found (for example ADR-0002's Markdown negotiation result) are allowed when the ADR asks for them. References to removed components (the earlier chat-app notification channel, the earlier repository) were taken out of accepted ADRs on 2026-10-31 at the author's request; no decision changed.

| ADR | Title | Status |
|---|---|---|
| [0001](ADR-0001-astro-and-retypeset.md) | Astro 7 with a vendored Retypeset theme, kept to its original design | accepted |
| [0002](ADR-0002-cloudflare-workers-static-assets.md) | Cloudflare Workers static assets instead of Pages | accepted |
| [0003](ADR-0003-github-actions-rulesets-environments.md) | GitHub Actions for CI/CD, protected by a `main` ruleset and environment secrets | accepted |
| [0004](ADR-0004-single-repo-no-cms.md) | One repository with an author-owned `content/`, published with Git only | accepted |
| [0005](ADR-0005-i18n-urls.md) | zh-TW at the root, English under `/en/` | accepted |
| [0006](ADR-0006-ai-access-policy.md) | Open AI access policy | accepted |
| [0007](ADR-0007-information-architecture.md) | Posts, topics, and tags, with topic-based URLs | accepted |
| [0008](ADR-0008-event-driven-automation.md) | Event-driven automation with Renovate, GitHub Actions, and scheduled agent tasks | accepted |
| [0009](ADR-0009-agent-identity.md) | Agent identity: an isolated macOS account, two role Apps, and a machine account | accepted; App ownership and key storage amended by ADR-0015 |
| [0010](ADR-0010-local-coordinator-and-verify.md) | A local coordinator session dispatches subagents, and `pnpm verify` gates every task | accepted; task-board state superseded by ADR-0014 |
| 0011 | How the coordinator reaches the author (file removed; see git history) | superseded by ADR-0014 |
| [0012](ADR-0012-public-repository.md) | The repository is public | accepted |
| [0013](ADR-0013-local-ai-in-docker-sandboxes.md) | Local AI runs only inside a Docker Sandbox | accepted |
| [0014](ADR-0014-github-issues-for-work-and-the-author.md) | GitHub issues carry the work and reach the author | proposed |
| [0015](ADR-0015-app-key-sets.md) | App key sets, kept in the author's account, one active on the host | proposed |

## Template

```markdown
# ADR-NNNN: Title
- Status: proposed
- Date: YYYY-MM-DD
- Deciders: …

## Context
## Decision
## Alternatives considered
## Consequences
## Revisit when
```
