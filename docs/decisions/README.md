# Architecture Decision Records

One file per decision: `ADR-NNNN-<slug>.md`. Status: `proposed` · `accepted` · `superseded by ADR-XXXX` · `deprecated`.

These records start over on 2026-10-29 with the move to a public repository. The first attempt's ADRs (0001 to 0017, including reversed ones such as Sveltia CMS and the GitHub-Free compensating controls) are in `januswtlin/januslin.me-archive`; they are background only.

Agents propose new ADRs in their PR when they make a decision a future agent would otherwise question. The author accepts or rejects them. Never rewrite an accepted ADR's decision; supersede it with a new one. Addenda that record what a task found (for example ADR-0002's Markdown negotiation result) are allowed when the ADR asks for them.

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
| [0009](ADR-0009-agent-identity.md) | Agent identity: an isolated macOS account, two role Apps, and a machine account | accepted |
| [0010](ADR-0010-local-coordinator-and-verify.md) | A local coordinator session dispatches subagents, and `pnpm verify` gates every task | accepted |
| [0011](ADR-0011-slack-and-remote-control.md) | The coordinator reaches the author through Slack; the author steers local sessions with Remote Control | accepted |
| [0012](ADR-0012-public-repository.md) | The repository is public | accepted |
| [0013](ADR-0013-local-ai-in-docker-sandboxes.md) | Local AI runs only inside a Docker Sandbox | accepted |

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
