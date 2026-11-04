# Architecture Decision Records

One file per decision: `ADR-NNNN-<slug>.md`. Status: `proposed` · `accepted` · `superseded by ADR-XXXX` · `deprecated`.

These records start on 2026-10-29 with the move to a public repository.

## Reading guide

Use this topic summary to find the relevant rationale. For day-to-day work, follow the linked current guide; the chronological records below preserve alternatives, amendments, and their original statuses. This summary changes no decision or approval status.

| Topic | Summary | Current guide | Decision history |
|---|---|---|---|
| Site and content | Static Astro with vendored Retypeset; posts organized by topics and tags; zh-TW at the root, English under `/en/`. | [Overview](../overview.md), [content model](../content-model.md) | [0001](ADR-0001-astro-and-retypeset.md), [0005](ADR-0005-i18n-urls.md), [0007](ADR-0007-information-architecture.md) |
| Publishing and ownership | Public repository, Markdown and Git, one editor who merges, people write content. | [Authoring](../authoring-guide.md), [roles](../agents/roles.md) | [0004](ADR-0004-single-repo-no-cms.md), [0012](ADR-0012-public-repository.md), [0016](ADR-0016-one-editor-many-developers.md) |
| Hosting and releases | Workers static assets; Actions builds and deploys; protected `main` and environment secrets. | [Deployment](../deployment.md) | [0002](ADR-0002-cloudflare-workers-static-assets.md), [0003](ADR-0003-github-actions-rulesets-environments.md) |
| Search and AI access | Allow search, agent, and training access; publish Markdown alternates. | [SEO/AEO](../seo-aeo.md) | [0006](ADR-0006-ai-access-policy.md) |
| Identities and isolation | Local AI stays in the sandbox; role Apps act locally, a machine account acts in the cloud; the author controls active key sets. | [Security](../security.md), [sandbox](../agents/sandbox.md), [admin guide](../admin-guide.md) | [0009](ADR-0009-agent-identity.md), [0013](ADR-0013-local-ai-in-docker-sandboxes.md), [0015](ADR-0015-app-key-sets.md), [0016](ADR-0016-one-editor-many-developers.md), [0018](ADR-0018-codex-in-vm-login.md) |
| Work and automation | Issues carry tasks and notifications; the local coordinator dispatches; verification and independent review precede author merges. | [Workflow](../agents/workflow.md), [coordinator](../agents/coordinator.md), [automation](../automation.md) | [0008](ADR-0008-event-driven-automation.md), [0010](ADR-0010-local-coordinator-and-verify.md), [0014](ADR-0014-github-issues-for-work-and-the-author.md), [0017](ADR-0017-task-context-and-token-efficiency.md) |

## Chronological records

Agents propose new ADRs in their PR when they make a decision a future agent would otherwise question. The author accepts or rejects them. Never rewrite an accepted ADR's decision; supersede it with a new one. Addenda that record what a task found (for example ADR-0002's Markdown negotiation result) are allowed when the ADR asks for them. References to removed components (the earlier chat-app notification channel, the earlier repository) were taken out of accepted ADRs on 2026-10-31 at the author's request; no decision changed.

| ADR | Title | Status |
|---|---|---|
| [0001](ADR-0001-astro-and-retypeset.md) | Astro 7 with a vendored Retypeset theme, kept to its original design | accepted; fonts, sounds, and callout colors amended 2026-11-04 (V14, PR #121) |
| [0002](ADR-0002-cloudflare-workers-static-assets.md) | Cloudflare Workers static assets instead of Pages | accepted |
| [0003](ADR-0003-github-actions-rulesets-environments.md) | GitHub Actions for CI/CD, protected by a `main` ruleset and environment secrets | accepted |
| [0004](ADR-0004-single-repo-no-cms.md) | One repository with an author-owned `content/`, published with Git only | accepted |
| [0005](ADR-0005-i18n-urls.md) | zh-TW at the root, English under `/en/` | accepted |
| [0006](ADR-0006-ai-access-policy.md) | Open AI access policy | accepted |
| [0007](ADR-0007-information-architecture.md) | Posts, topics, and tags, with topic-based URLs | accepted |
| [0008](ADR-0008-event-driven-automation.md) | Event-driven automation with Renovate, GitHub Actions, and scheduled agent tasks | accepted |
| [0009](ADR-0009-agent-identity.md) | Agent identity: an isolated macOS account, two role Apps, and a machine account | accepted; App ownership and key storage amended by ADR-0015; collaborators by ADR-0016; Codex login amendment recorded in proposed ADR-0018 |
| [0010](ADR-0010-local-coordinator-and-verify.md) | A local coordinator session dispatches subagents, and `pnpm verify` gates every task | accepted; task-board state superseded by ADR-0014 |
| 0011 | How the coordinator reaches the author (file removed; see git history) | superseded by ADR-0014 |
| [0012](ADR-0012-public-repository.md) | The repository is public | accepted |
| [0013](ADR-0013-local-ai-in-docker-sandboxes.md) | Local AI runs only inside a Docker Sandbox | accepted; Codex login amendment recorded in proposed ADR-0018 |
| [0014](ADR-0014-github-issues-for-work-and-the-author.md) | GitHub issues carry the work and reach the author | proposed; startable amended by ADR-0016 |
| [0015](ADR-0015-app-key-sets.md) | App key sets, kept in the author's account, one active on the host | proposed; developers' own sets amended by ADR-0016 |
| [0016](ADR-0016-one-editor-many-developers.md) | One editor, any number of developers | proposed |
| [0017](ADR-0017-task-context-and-token-efficiency.md) | Reduce task context while preserving completion gates | proposed |
| [0018](ADR-0018-codex-in-vm-login.md) | Codex login inside the VM and active role identities | proposed; records the author's 2026-11-04 in-VM login approval; human verification pending |

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
