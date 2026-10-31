# Operations

Last reviewed: 2026-10-31

The recurring maintenance calendar and the agents' runbooks. The author's own procedures are runbooks in `docs/runbooks/`, explained in `docs/admin-guide.md`.

## Maintenance calendar

Every item that needs the author is raised as a `human-task` issue assigned to the author about a month before it is due (ADR-0014). Today the coordinator raises them; once T19 ([#26](https://github.com/januswtlin/januslin.me/issues/26)) merges, a monthly workflow does.

| Cadence | What | Who |
|---|---|---|
| Monthly | `sbx` release notes (early access): the author upgrades in the `agent` account (`docs/runbooks/upgrade-sbx.md`), an agent re-runs the sandbox checks the release touches | Platform Engineer + author |
| Monthly | Roadmap review (`docs/roadmap.md`) | Coordinator; the author decides |
| Quarterly | Security review (below) | Platform Engineer + author |
| Before expiry | Renew the repository interaction limit (collaborators only, six months). Current expiry: **2027-04-29** (the API's `expires_at` is 2027-04-30T01:42:28Z, recorded one day early on purpose; the UI shows no date); every renewal updates it. No App or workflow can read the limit (it needs Administration read), so this date is the source | Author (human-task issue) |

Added by planned tasks, with the same rule for anything that needs the author:

| Cadence | What | Who | From |
|---|---|---|---|
| Weekly | Renovate PRs reviewed by the Upgrade review task; the author merges (`docs/automation.md`) | Upgrade Engineer (automated) + author | T19, T20 |
| Weekly | No `incident` issue was closed, edited, or relabelled by a bot or the machine account; reopen and investigate if so | Upgrade Engineer (automated) | T20 |
| Monthly | Retypeset upstream watch (below) | Upgrade Engineer | T09 |
| Monthly | Astro, wrangler, and Node release notes; plan majors as task issues | Upgrade Engineer | T09 |
| Monthly | SEO/AEO audit (`docs/seo-aeo.md` → Periodic audit) | SEO/AEO Engineer (automated) | T20 |
| Monthly | Limits: Workers script requests, asset file count, repository size | Platform Engineer | T16 |
| Before expiry | Rotate the deploy token and the Access service token `ci-smoke-test` (the author creates and stores; an agent updates docs) | Author + Platform Engineer | T14, T15 |

### Retypeset upstream watch (monthly, once T09 has vendored the theme)
We vendor Retypeset and never merge upstream (ADR-0001). Once a month:
1. Compare `https://github.com/radishzzz/astro-theme-retypeset` `master` with the last reviewed upstream commit below (`git log <last>..origin/master` in a scratch clone outside the repository).
2. For each change, decide: port (bug fix, security fix, accessibility fix, Astro compatibility), or skip (feature or design change we do not want). Ports become task issues or Upgrade PRs; record skips with one line each in the PR or report.
3. Update the line below in the same PR, even when nothing was ported.

Last reviewed upstream commit: `a636b6d393be714cab52d3fc4baddd3f3905f701` (2026-04-12), the vendoring base.

### Quarterly security review
The agent opens a `human-task` issue linking `docs/runbooks/quarterly-host-checks.md` for the checks only the author can run (admin rights, the host shell, the browser profiles), runs the rest itself, and records all results in `docs/reports/`.
- Interaction limit set to collaborators only, with its expiry more than a month away (author).
- Both `main` rulesets unchanged (`gh api repos/januswtlin/januslin.me/rulesets` and the ruleset history); repository settings as in `docs/security.md`, auto-merge off; issue creation limited to collaborators (author, in the UI: the API returns `null` for it).
- Collaborators (`GET /repos/januswtlin/januslin.me/collaborators?affiliation=direct`): the owner `januswtlin` (listed as `admin`) and the machine account `januslin-agent`, `write`; nobody else. Deploy keys: one per device in use. Environments: secrets and branch policies as in `docs/deployment.md`; no repository secrets or variables (author).
- Each of the two Apps has exactly one installation (`GET /app/installations` with the App's JWT) on `januswtlin`, with this repository only, and one private key (author: the Check in `docs/runbooks/rotate-app-keys.md`). The Claude GitHub App is installed on this repository only, with the permissions recorded in `docs/infra-current-state.md`; claude.ai is connected to GitHub as the machine account and `januswtlin` does not authorize it; claude.ai connectors unchanged (GitHub only). The Claude Code cloud environment unchanged (`docs/runbooks/claude-cloud-environment.md`). In the sandbox, `/permissions` still lists the repository denies.
- The machine account: no SSH keys, PATs, or OAuth apps; passkey or 2FA on; recent sessions only from the author's browser (author).
- The sandbox: re-run the canary (no key or host file outside the read-only mounts is readable from the VM); `sbx policy ls januslin --wide` equals the allowlist in `docs/agents/sandbox.md`, and `curl https://example.com` from the VM returns 403; `sbx settings get ssh.agentForwardingEnabled` is `false`; `sbx secret ls` lists only the expected secrets; `sbx version` recorded (author, in `agent-session`, for the `sbx` commands).
- The `agent` macOS account: still standard, no AI tool on its `PATH` (`command -v claude codex` prints nothing), no cron jobs or LaunchAgents, File Sharing and Remote Login off, no `cloudflare-ops.token` file left in its state directory, managed settings match `docs/runbooks/install-managed-settings.md`, the author's home is `chmod 700` (author).
- ADR-0014's rules on the real issues: approved tasks were labelled by the author and not edited since; closed human tasks were closed by the author.
- Once they exist: tokens near expiry (deploy token, `ci-smoke-test`), CSP unchanged, Access policies unchanged.

## Runbooks

### Publish (author)
`docs/authoring-guide.md`.

### Suspicious commit or PR (Platform Engineer, author approves)
`main` cannot change without the author's merge, so this is about branches, PRs, issues, and comments.
1. Identify the actor from the push event or the timeline: `januslin-agent[bot]` and `januslin-reviewer[bot]` (local agents), the machine account `januslin-agent` (cloud sessions and scheduled tasks; their commits are authored by `Claude <noreply@anthropic.com>`, GitHub user `claude`, so go by the push actor, not the commit author), `januswtlin` (the author, or a phone's deploy key: compare each key's "last used" date), or someone else.
2. Close the PR or delete the branch; do not merge it. If something did reach production, roll back first. If an issue or comment was edited, read its edit history (`docs/agents/workflow.md`, "Work items") and treat the issue as unapproved.
3. Ask the author, in a `human-task` issue, to revoke or rotate the credential involved.
4. Write an incident note in `docs/reports/incident-YYYY-MM-DD.md`.

### Roll back production (Platform Engineer, once T16 has deployed)
1. Automatic rollback runs in the deploy job when the smoke test fails.
2. A manual rollback is the author's, with a short-lived Cloudflare token in the author's own account (never the `agent` account): the runbook `docs/runbooks/rollback-production.md`, which T16 adds. The agent names the version to roll back to in a `human-task` issue; the runbook lists versions so the author picks it from Cloudflare's own output.
3. Open an issue labelled `incident`; fix forward with a PR, and say in it that production was rolled back.

### Rotate deploy token (author + Platform Engineer, once T14 has created it)
1. The author runs `docs/runbooks/rotate-deploy-token.md` (T14 adds it): a new token with the same scopes, stored in both environments, the old one revoked.
2. The Platform Engineer asks the author to run `ci` with `workflow_dispatch` on `main`; the deploy job redeploys the current version with the new token.

### Dependency upgrade (Upgrade Engineer)
1. Read release notes and migration guides for the version range.
2. Branch `agent/upgrade/<package>-<version>`; upgrade; run `pnpm verify`.
3. Compare the preview with production: home, a topic hub, a post with math and Mermaid, a photo-heavy post, a tag page, both locales, mobile and desktop, light and dark.
4. PR with a release-note summary, a risk assessment, and screenshots. Majors that change visible output get `needs-human`.

### Limits approaching (Platform Engineer)
- Asset file count over 15,000 or repository over 1 GB: evaluate roadmap R06 (images to R2).
- Workers script requests over 50% of the daily free limit on any day: review `run_worker_first` and the traffic source.
