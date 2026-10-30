# Operations

Last reviewed: 2026-10-29

Runbooks and the recurring maintenance calendar. Each item names the role that does it. Until the scheduled tasks exist (T20), the coordinator session raises the calendar items to the author.

## Maintenance calendar

| Cadence | What | Role |
|---|---|---|
| Weekly | Renovate PRs reviewed by the Upgrade review task; the author merges (`docs/automation.md`) | Upgrade Engineer (automated) + author |
| Weekly | No `incident` issue was closed, edited, or relabelled by a bot or the machine account; reopen and investigate if so | Upgrade Engineer (automated) |
| Monthly | Retypeset upstream watch (below) | Upgrade Engineer |
| Monthly | Astro, wrangler, and Node release notes; plan majors as tasks | Upgrade Engineer |
| Monthly | SEO/AEO audit (`docs/seo-aeo.md` → Periodic audit) | SEO/AEO Engineer (automated) |
| Monthly | Limits: Workers script requests, asset file count, repository size | Platform Engineer |
| Monthly | `sbx` release notes (early access): upgrade in the `agent` account, then re-run T03's verifications that the release touches | Platform Engineer + author |
| Monthly | Roadmap review (`docs/roadmap.md`) | Coordinator, author decides |
| Quarterly | Security review (below) | Platform Engineer + author |
| Before expiry | Renew the repository interaction limit (collaborators only, six months; the author, Settings → Moderation options → Interaction limits). Current expiry: **2027-04-29** (set 2026-10-30, T01-H1; GitHub shows no date, so this is six months minus one day); every renewal updates it. No workflow can read the limit (it needs Administration read), so the monthly maintenance issue copies this date and the coordinator reminds the author a month ahead | Author |
| Before expiry | Rotate the deploy token and the Access service token `ci-smoke-test` (author creates and stores; agent updates docs) | Author + Platform Engineer |

### Retypeset upstream watch (monthly)
We vendor Retypeset and never merge upstream (ADR-0001). Once a month:
1. Compare `https://github.com/radishzzz/astro-theme-retypeset` `master` with the last reviewed upstream commit below (`git log <last>..origin/master` in a scratch clone outside the repo).
2. For each change, decide: port (bug fix, security fix, accessibility fix, Astro compatibility), or skip (feature or design change we do not want). Ports become tasks or Upgrade PRs; record skips with one line each in the PR or report.
3. Update the line below in the same PR, even when nothing was ported.

Last reviewed upstream commit: `a636b6d393be714cab52d3fc4baddd3f3905f701` (2026-04-12), the vendoring base.

### Quarterly security review
The author does the checks no App can read, in the browser; the agent prepares the list and records the results in a report.
- Interaction limit set to collaborators only, with its expiry more than a month away.
- Both `main` rulesets unchanged (`gh api repos/januswtlin/januslin.me/rulesets` and the ruleset history); repository settings as in `docs/security.md`, auto-merge off.
- Collaborators: only the machine account `januslin-agent`, Write. Deploy keys: one per device in use. Environments: secrets and branch policies as in `docs/deployment.md`; no repository secrets or variables.
- Each of the two Apps has exactly one installation (`GET /app/installations` with the App's JWT) on `januswtlin`, with this repository only, and one private key. The Claude and Codex connector Apps are installed on this repository only; claude.ai and ChatGPT connectors as recorded in T05 and T06.
- The machine account: no SSH keys, PATs, or OAuth apps; passkey or 2FA on; recent sessions only from the author's browser.
- The sandbox: re-run the V16 canary from T03 (no key or host file outside the read-only mounts is readable from the VM); `sbx policy ls januslin` equals the allowlist in `docs/agents/sandbox.md`; `sbx secret ls` lists only the expected secrets; `sbx version` recorded.
- The `agent` macOS account: still standard, no AI tool on its `PATH` (`command -v claude codex` prints nothing), no cron jobs or LaunchAgents, File Sharing and Remote Login off, no `cloudflare-ops.token` file left in its state directory, managed settings match `docs/agents/local-agent-account.md`, the author's home is `chmod 700`.
- Tokens near expiry (deploy token, `ci-smoke-test`). CSP unchanged. Access policies unchanged.

## Author's recurring steps

Steps only the author can do that belong to no task. Steps for a task are in that task's "Human steps" section, and `docs/tasks/plan.md` shows them in order.

- **Read and merge PRs** when the coordinator reports one ready (Slack or the terminal), after reading the final diff and opening the `ci` run link the coordinator gives (it must be the `ci.yml` run for the PR's head commit). Answer `needs-human` items in the PR thread or on Slack.
- **Working Copy on a new device** (15 min, when mobile publishing is first needed, then per device):
  1. In Working Copy: Settings → SSH Keys → generate a new key. Then add a repository by cloning `git@github.com:januswtlin/januslin.me.git` (the SSH URL; a deploy key does not work over HTTPS) and pick that key. Never connect a GitHub account inside Working Copy.
  2. Copy the public key. On GitHub as `januswtlin`: repo Settings → Deploy keys → Add deploy key, title `working-copy-<device>-<yyyy-mm>`, "Allow write access" on. Never add it as an account SSH key.
  3. Sign in to the GitHub mobile app as `januswtlin`. Turn the device lock on. Install the photo Shortcut (`docs/authoring-guide.md`).
  4. The first time, tell an agent "Working Copy set up" so it can record V12 with you (a test push of a branch, and a refused push to `main`).
- **Renew the interaction limit** and **rotate tokens** before expiry (calendar above).

## Runbooks

### Publish (author)
`docs/authoring-guide.md`.

### Roll back production (Platform Engineer)
1. From the author's account with a short-lived Cloudflare token (never in the `agent` account): `npx wrangler@<pinned version> versions list --name januslin-me`, find the last good version.
2. `npx wrangler@<pinned version> rollback <version-id> --name januslin-me --message "<reason>"`.
3. Open an issue labelled `incident`; fix forward with a PR, and say in it that production was rolled back.

### Lost device (author)
1. Phone or tablet: repo Settings → Deploy keys → delete the device's key. GitHub → Settings → Sessions: sign out its GitHub mobile session.
2. Laptop: revoke the author's `gh` token and SSH keys, sign out its browser sessions (GitHub → Settings → Sessions), for both `januswtlin` and the machine account; change the machine account's password. Revoke the claude.ai and ChatGPT logins of both macOS accounts. Rotate the private keys of both Apps ("Rotate the agent App keys"). Revoke the Slack bot token (reinstall the app or rotate the token). In the `agent` account, `sbx reset` removes the sandbox secrets (the Codex OAuth tokens, the Slack and GitHub secret commands); sign out of the Docker account used by `sbx`.
3. If the device may have been unlocked: rotate the deploy token and `ci-smoke-test`.
4. Optional: Cloudflare Zero Trust → revoke the device's Access sessions.
5. Review recent pushes, PRs, and Actions runs on all branches ("Suspicious commit or PR").

### Suspicious commit or PR (Platform Engineer, author approves)
`main` cannot change without the author's merge, so this is about branches, PRs, issues, and comments.
1. Identify the actor from the push event or the timeline: `januslin-agent[bot]` and the other Apps (local agents), the machine account `januslin-agent` (cloud sessions, scheduled tasks, tool logins), `januswtlin` (the author, or a phone's deploy key: compare each key's "last used" date), or someone else.
2. Close the PR or delete the branch; do not merge it. If something did reach production, roll back first.
3. Revoke or rotate the credential involved (author).
4. Write an incident note in `docs/reports/incident-YYYY-MM-DD.md`.

### Rotate deploy token (author + Platform Engineer)
1. The author creates a new token with the same scopes (`docs/security.md`), updates `CLOUDFLARE_API_TOKEN` in both environments, and revokes the old token.
2. The Platform Engineer asks the author to run `ci` with `workflow_dispatch` on `main`; the deploy job redeploys the current version with the new token.

### Rotate the agent App keys (author)
For each of `januslin-agent` and `januslin-reviewer`, signed in as the machine account `januslin-agent` (the owner):
1. GitHub → Settings → Developer settings → GitHub Apps → the App → Private keys: generate a new key. Put it where ADR-0009 says: `januslin-agent` and `januslin-reviewer` as `0600` files in the `agent` account (`docs/agents/local-agent-account.md`, "Keys"). Delete the downloaded file.
2. Delete the old key on the same page.
3. In the `agent` account, `scripts/agent-token.sh <app>` and `scripts/agent-gh <app> api /installation/repositories` confirm the new key works.

### Dependency upgrade (Upgrade Engineer)
1. Read release notes and migration guides for the version range.
2. Branch `agent/upgrade/<package>-<version>`; upgrade; run `pnpm verify`.
3. Compare the preview with production: home, a topic hub, a post with math and Mermaid, a photo-heavy post, a tag page, both locales, mobile and desktop, light and dark.
4. PR with a release-note summary, a risk assessment, and screenshots. Majors that change visible output get `needs-human`.

### Limits approaching (Platform Engineer)
- Asset file count over 15,000 or repository over 1 GB: evaluate roadmap R06 (images to R2).
- Workers script requests over 50% of the daily free limit on any day: review `run_worker_first` and the traffic source.
