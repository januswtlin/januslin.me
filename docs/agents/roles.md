# Agent roles

Last reviewed: 2026-10-29

Each dispatched session takes exactly one role. The role determines what it may change. If a task needs changes outside the role's write scope, split the task or escalate to the coordinator.

## Roles

### Coordinator (the author, assisted by a coordinator session)
- Owns direction: ADRs, roadmap, task specs, priorities. The author decides; the coordinator session proposes and writes.
- The author merges every PR and resolves `needs-human` items. Only the author merges.
- A coordinator session in the local sandbox dispatches tasks to implementer subagents and starts reviewer subagents, following "Coordinator loop" in `docs/agents/workflow.md` (ADR-0010). Each subagent takes exactly one role and acts through that role's App.
- Coordinator sessions write `docs/` (except `docs/reports/`) and never implement features.

### Site Engineer
- Builds and maintains the Astro site: theme, components, layouts, routes, content collections, topic hubs, i18n routing, search, images, rich content, SEO outputs implementation.
- Writes tests for what it builds.

### Platform Engineer (SRE)
- Owns `wrangler.jsonc`, `worker/`, `.github/`, `.githooks/`, agent scripts in `scripts/`, `public/_headers`, `public/_redirects`, Cloudflare zone configuration (via API with a token from the author, documented in `docs/infra-current-state.md`), security controls, cutover, incidents, limits monitoring.
- Prepares GitHub repository settings, rulesets, and environments as exact commands or clicks; the author applies them (agents never hold admin rights).

### Upgrade Engineer
- Keeps dependencies, Astro, Node, pnpm, and GitHub Actions versions current, and runs the monthly Retypeset upstream watch (`docs/operations.md`).
- Reads release notes, assesses risk, upgrades, verifies visually, writes the upgrade PR.

### SEO/AEO Engineer
- Audits search and AI readiness monthly, proposes and implements fixes to SEO outputs in collaboration with the Site Engineer's code areas (`src/lib/seo/`, `scripts/seo/`, `tests/seo/`).

### Reviewer
- Independent review of any PR: reads the task's acceptance criteria, checks evidence, runs checks, inspects the preview. Never reviews its own work: it runs in a fresh context (a subagent or another session), never the context that wrote the change. Produces a review with a verdict: approve, request changes, or escalate (`needs-human`).

### Author (Janus)
- Sole owner of `content/` originals (`*.zh-tw.md`, images, `taxonomy/`).
- Sole holder of admin rights: repository settings, rulesets, environments, secrets, collaborators, App installations, merges.

## Write-permission matrix

✅ may change · ⚠️ only when the task file explicitly says so · ❌ never

| Path | Site | Platform | Upgrade | SEO/AEO | Reviewer | Coordinator |
|---|---|---|---|---|---|---|
| `content/**/*.zh-tw.md`, images, `content/taxonomy/` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ (author only) |
| `content/**/*.en.md` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ (author only) |
| `content/_templates/` | ⚠️ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `drafts/` (untracked; never read it either; `drafts/README.md` is the Coordinator's) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ (author only) |
| `src/`, `scripts/`, `tests/` | ✅ | ⚠️ | ✅ | ⚠️ (`seo` paths ✅) | ❌ | ❌ |
| `public/` (except `_headers`, `_redirects`) | ✅ | ⚠️ | ✅ | ⚠️ | ❌ | ❌ |
| `public/_headers`, `public/_redirects` | ⚠️ | ✅ | ⚠️ | ⚠️ | ❌ | ❌ |
| `worker/`, `wrangler.jsonc` | ⚠️ | ✅ | ✅ | ⚠️ | ❌ | ❌ |
| `.github/workflows/` (owned by the author in CODEOWNERS) | ❌ | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| `.github/` (other files), `.githooks/` | ⚠️ | ✅ | ✅ | ❌ | ❌ | ✅ |
| `package.json`, lockfile | ✅ | ✅ | ✅ | ⚠️ | ❌ | ❌ |
| `docs/` (general) | ⚠️ update docs for what you changed | same | same | same | ❌ | ✅ |
| `automation/prompts/` | ❌ | ✅ | ⚠️ | ❌ | ❌ | ✅ |
| `docs/decisions/` | propose (new ADR in PR) | propose | propose | propose | ❌ | ✅ |
| `docs/reports/` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cloudflare zone/account settings | ❌ | ✅ (task-listed, with the author's token) | ❌ | ❌ | ❌ | ❌ |
| GitHub repo settings, rulesets, environments, secrets | ❌ | prepares; the author applies | ❌ | ❌ | ❌ | ❌ |

One-time exception: T10 creates the empty `content/` skeleton (`.gitkeep` files, an empty `taxonomy/tags.yaml`, and `content/_templates/`). After that, the content rows apply without exception.

"Update docs for what you changed" means: any role that changes behavior updates the doc describing that behavior in the same PR.

## Escalate to the human (`needs-human` label) when

- Visible design or typography changes beyond what the task specified.
- Anything touching author content.
- Destructive or irreversible infrastructure operations not listed in the task.
- A new paid service, a new external request, or a change to the AI access policy.
- Security-relevant changes to Access, tokens, rulesets, environments, or CSP that loosen protection.
- Anything that would make private information public (the repository is public).
