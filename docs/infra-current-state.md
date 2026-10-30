# Infrastructure: current and desired state

Configuration that does **not** live in code: Cloudflare, GitHub, accounts outside the repository. Any agent that changes such a setting updates this file in the same PR, with the date. Identifiers here are public, not secrets. Slack IDs are deliberately not recorded here (they live in the `agent` account, `docs/agents/local-agent-account.md`).

Cloudflare account ID: `f2f02d203f0d3a3861b811030cb6f37f`. Workers subdomain: `janus-weitang-lin.workers.dev`.

## Current state (2026-10-30; carried over from the first attempt, updated by T01)

### Domain and Cloudflare
- `januslin.me` at Cloudflare Registrar, auto-renew on, expires 2027-10-11. Zone on the Free plan.
- DNS: `@` CNAME `januslin.pages.dev` (proxied); `www` CNAME `januswtlin.github.io` (DNS only; probably dangling, removed in T17). No MX, SPF, DKIM, or DMARC.
- Pages project `januslin`, Git-connected to `januswtlin/januslin` (the old Hugo site), custom domain `januslin.me`. It serves the live site until cutover (T17).
- No Workers. No Access applications; Zero Trust not set up. Web Analytics not set up.
- AI Crawl Control: Search, Agent, Training all Allow; Bot Preference Sync off. Bot Fight Mode, AI Labyrinth, Email Obfuscation: not confirmed (T17 checks).

### GitHub repositories
| Repository | Visibility | State |
|---|---|---|
| `januswtlin/januslin.me` | public | This repository. Created by the author on 2026-10-29. Settings, rulesets, labels, environments, and interaction limit applied 2026-10-30 (T01); see "GitHub settings as applied" below. |
| `januswtlin/januslin.me-archive` | private | The first attempt (renamed from `januswtlin/januslin.me`). Reference only; to be archived. |
| `januswtlin/januslin` | private | The old Hugo site behind the Pages project. Archived in T17 after cutover. |

### GitHub identities and Apps
| Identity | Id | State |
|---|---|---|
| `januswtlin` (author) | 2433928 | Owner. Passkey or 2FA on. |
| Machine account `januslin-agent` | 349746030 | Exists. The claude.ai account is connected to GitHub as this account. Not yet a collaborator here (T02). |
| App `januslin-agent` (`januslin-agent[bot]`, bot user id 349177542) | App ID 5506552, installation 176078591 | Owned by `januswtlin`, private, installed on the archive only. Installed here (this repository only) on 2026-10-30 (T01-H3), transferred to the machine account in T02. |
| App `januslin-reviewer` | App ID 5506595, installation 176079192 | Same as above. |
| App `januslin-platform` (historical) | App ID 5506604, installation 176080447 | Used in the first attempt for workflow changes. Not installed here; deleted in T02-H2 (ADR-0009). |
| Claude GitHub App | n/a | Installed on `januswtlin` with a repository selection (the archive); the author's own authorization of Claude on `januswtlin` is revoked. Selection moves to this repository in T05. |
| Codex / ChatGPT connector | n/a | Not set up for this project (T06). |
| Renovate | n/a | Not installed (T19-H1). |

Permissions of the Apps (checked from installation tokens on this repository, 2026-10-30, T01; T02 adds workflows RW to `januslin-agent`): `januslin-agent` actions R, checks R, contents RW, issues RW, metadata R, pull requests RW; `januslin-reviewer` actions R, checks R, contents R, issues R, metadata R, pull requests RW; `januslin-platform` (historical) had `januslin-agent`'s set plus workflows RW. None has administration, secrets, variables, environments, or deployments.

### GitHub settings as applied (T01, 2026-10-30)
- Settings (`gh api repos/januswtlin/januslin.me`, outputs in the T01 PR): public; squash merge only (title from the PR title, message from the PR body); auto-merge off; head branches deleted on merge; wiki, projects, and discussions off; issues on; secret scanning and push protection on; Dependabot security updates off. Actions: default `GITHUB_TOKEN` permissions `read`, Actions may not approve PRs. PR creation limited to collaborators: `pull_request_creation_policy: collaborators_only` (readable with an App token). Issue creation limited to collaborators: set in the UI (T01-H1), confirmed there by the author 2026-10-30; `issue_creation_policy` reads `null` even with the author's admin token, so it is a manual check (quarterly review). Workflow runs from outside contributors need approval: `approval_policy: all_external_contributors`. Dependabot alerts on (`vulnerability-alerts` returns 204). Both need Administration read (403 to App tokens); author's outputs.
- Rulesets (both `active`, target `~DEFAULT_BRANCH`): `main-protect` (id 26176065): pull request with 0 approvals and squash only, block force pushes, restrict deletions, require linear history, no bypass actors, no `ci` check yet (T16). `main-restrict-updates` (id 26176087): restrict updates, bypass: repository admin role (`actor_id` 5) in pull-request-only mode. App token responses omit `bypass_actors`; the author's output shows them. GitHub added `require_extra_approval_for_unattributed_changes: true` to `main-protect` by default. Per GitHub's docs it adds one approval only to PRs Copilot opens under its own identity, and has no effect while the ruleset requires 0 approvals, so it is left as GitHub set it (the author's merge in V2 confirms).
- Environments `production`, `preview`, `smoke`: deployment branch policy "selected branches" with one `branch` rule `main` each, no secrets, no required reviewers.
- Labels: GitHub's defaults plus `needs-human`, `translation-needed`, `incident`, `upgrade`, `maintenance`, `roadmap`.
- Interaction limit: `collaborators_only`, set 2026-10-30, API `expires_at` 2027-04-30T01:42:28Z (the UI shows no date). The calendar in `docs/operations.md` records 2027-04-29, one day early on purpose. GitHub offers no permanent option (durations up to six months only, checked in GitHub's docs on 2026-10-30); its docs say the limit also blocks reactions.

### The author's Mac
- macOS account `agent` (short name `Agent`): standard, set up, File Sharing and Remote Login off, `sudoers` rule installed, no cron jobs or LaunchAgents (`docs/agents/local-agent-account.md`).
- Clone of the archive at `~/januslin.me-archive` (origin `januslin.me-archive`, no credential helper); fresh clone of this repository at `~/januslin.me`, with its credential helper pointing at the archive's `scripts/agent-git-credential` until T02 ports the scripts.
- Claude Code in `agent`: `setup-token` login only, running directly in the account (until T03). Codex: not installed.
- Docker Sandboxes (`sbx`): not installed (T03).
- Claude Code managed settings installed, root-owned, with `disableRemoteControl: true`; kept unchanged as a host backstop (ADR-0013).

### Slack
- Workspace `januswtlin`, private channel `#januslin-me` (the author and the bot only). App `januslin-coordinator` with bot scopes `chat:write`, `groups:history`, `reactions:write`; no events, slash commands, or request URL. Bot token in the `agent` account.

## Desired state

| Setting | Desired | Task |
|---|---|---|
| Repository settings, the two `main` rulesets, the interaction limit (collaborators only), labels, environments | As in `docs/security.md` and `docs/deployment.md` | T01, T16 |
| Collaborators | Machine account `januslin-agent` only, Write | T02 |
| The two Apps (`januslin-agent` with Workflows RW, `januslin-reviewer`) | Owned by the machine account, public, one installation each (`januswtlin`, this repository only), one key each issued by the machine account | T02 |
| Local AI runtime | Docker Sandbox `januslin` in the `agent` account, deny-all policy plus the allowlist in `docs/agents/sandbox.md`, no AI tool on the host | T03 |
| Claude and Codex connector Apps | Installed on `januswtlin` with this repository only; claude.ai and ChatGPT connected to GitHub as the machine account | T05, T06 |
| DNS `@` | Worker custom domain `januslin.me` | T17 |
| DNS `www` | Worker custom domain or proxied record; Single Redirect `www.januslin.me/*` → `https://januslin.me/$1` (301, keep query) | T17 |
| Pages project `januslin` | Deleted 48 h after cutover | T17 |
| Worker | `januslin-me`, deployed from GitHub Actions | T14, T16 |
| Access | Worker-level "Previews only" on `januslin-me`; Service Auth for `ci-smoke-test` until T17 | T15 |
| AI Crawl Control | Search, Agent, Training = Allow; Bot Preference Sync off | T17 |
| Crawler Hints, Web Analytics | On | T17 |
| Bot Fight Mode, AI Labyrinth, Email Obfuscation, Rocket Loader | Off unless an ADR says otherwise | T17 |
| Email DNS hardening | Null MX, `v=spf1 -all`, DMARC `p=reject` (optional, the author approves) | T17 |
| Search Console, Bing Webmaster Tools | Verified by DNS TXT, sitemap submitted | T17 |
| The archive repository | Apps uninstalled from it (T01); archived, read-only (T02) | T01, T02 |

## Open verifications

Claims the docs rely on that nobody has tested yet. Whoever reaches the "When" step tests it, records the result here (date, evidence), and fixes the docs if the claim was wrong. A row leaves this table only into the change log, with its result.

| ID | Claim to verify | Docs that assume it | When | Status |
|---|---|---|---|---|
| V1 | With PR creation limited to collaborators, the Apps and Renovate can still open PRs | `docs/security.md`, `docs/automation.md`, ADR-0012 | T01 (Apps), T19 (Renovate) | Apps: implementer passed 2026-10-30 (`januslin-agent[bot]` opened T01's PR #1); reviewer passed 2026-10-30 (`januslin-reviewer[bot]` posted a review on PR #1). Renovate: open (T19) |
| V2 | The two `main` rulesets let the author merge PRs, and refuse direct pushes to `main` by the author, the machine account, the Apps, and a deploy key; merges by the machine account and the Apps; the author's merge of a PR whose `ci` is red or pending (after T16); and auto-merge | ADR-0003, `docs/deployment.md`, `docs/security.md` | T01, T02 (machine account), T16 (`ci`), V12 (deploy key) | Partly passed 2026-10-30: `januslin-agent[bot]` push to `main` refused (GH013, "Changes must be made through a pull request", "Cannot update this protected ref"); `gh pr merge` by both Apps refused ("the base branch policy prohibits the merge"); enabling auto-merge refused ("Auto merge is not allowed for this repository"). The author's direct push of an empty commit refused (GH013, same two rules; a first attempt was refused earlier by GH007, private email, which GitHub checks before rulesets). Open: the author's merge (T01-H4), machine account (T02), `ci` (T16), deploy key (V12) |
| V3 | Environment required reviewers let the repository owner approve their own deployment (with "prevent self-review" off) | `docs/deployment.md` (not used; recorded for the decision) | T16 | open |
| V4 | With PR and issue creation limited to collaborators and the interaction limit set to collaborators only, a signed-in non-collaborator cannot comment or open issues or PRs (and whether reactions are blocked too), and the Apps, Renovate, and `github-actions[bot]` still work | `docs/security.md`, ADR-0012 | T01 (Renovate and `github-actions[bot]`: T19) | Partly passed 2026-10-30: the limit reads `collaborators_only` (author's API output), and the Apps opened PR #1 with it on. Open: a live test from a non-collaborator account (none available in T01), Renovate and `github-actions[bot]` (T19) |
| V5 | Transferring the two Apps to the machine account (after making them public) keeps their App IDs, installation IDs, and bot user ids | ADR-0009, `docs/agents/local-agent-account.md` | T02 | open |
| V6 | The Claude GitHub App's repository permissions, in particular Workflows, Secrets, and Variables | ADR-0009, `docs/security.md` | T05 | open |
| V7 | A Claude Code cloud session pushes and opens PRs as the machine account (id 349746030), cannot read other repositories of `januswtlin`, is refused on `main` by the ruleset, and which branch names it may push | ADR-0009, `docs/agents/workflow.md` | T05 | open |
| V8 | What Codex configuration a personal ChatGPT account can apply inside the sandbox VM (connectors in particular); there it is a default, not a control, because the agent is root in the VM | ADR-0009 | T06 | open |
| V9 | A `workflow_run` job can use an environment whose deployment branch policy is `main` only | `docs/deployment.md` (preview job) | T16 | open |
| V10 | The same as V7 for Codex cloud, plus whether the agent can push by itself or only the author's "Create PR" click does | ADR-0009 | T06 | open |
| V11 | Claude Code scheduled-task GitHub triggers can filter on PR author (`renovate[bot]`, `januswtlin`, the bots, the machine account) | `docs/automation.md` | T20 | open |
| V12 | A deploy-key push shows as pushed by `januswtlin`, the key's "last used" date updates, and a deploy-key push to `main` is refused by the ruleset | `docs/operations.md`, `docs/security.md` | First Working Copy setup (`docs/operations.md`) | open |
| V13 | The iOS photo Shortcut's output has no GPS EXIF and is under 1.5 MB | `docs/authoring-guide.md`, `docs/content-model.md` | T12 | open |
| V14 | The licenses of Retypeset's bundled fonts (including Snell Roundhand) and UI sound effects allow redistribution in a public repository and on the site | ADR-0001, `THIRD_PARTY_NOTICES.md` | T09 | open |
| V15 | `sbx` installs and runs from the standard `agent` macOS account in a `sudo -iu agent` session, including Keychain-backed secrets and the browser sign-ins (`sbx login`, `--oauth`) | ADR-0013, `docs/agents/sandbox.md` | T03 | open |
| V16 | Canary: from inside the sandbox, no `.pem`, no file of the author's account, and nothing of the `agent` account outside the read-only mounts is readable; the host clone is not writable | ADR-0013, `docs/security.md` | T03, then quarterly | open |
| V17 | The `github` secret with `--command` lets `git push` (HTTPS) and `gh` (REST and GraphQL) act as `januslin-agent[bot]` with only a placeholder in the VM, and picks up the broker's refreshed token after expiry without restarting the sandbox | ADR-0013, `docs/agents/sandbox.md` | T03 | open |
| V18 | With the `github` secret active, a request carrying an explicit Authorization header (the reviewer token) is not overwritten by the proxy | ADR-0013, `docs/agents/sandbox.md` | T03 | open |
| V19 | The egress allowlist is enough for `pnpm install`, Playwright's Chromium download, `pnpm verify`, `gh`, and git, and blocks everything else | `docs/agents/sandbox.md` | T03 (Claude, Codex, Slack parts: T04 to T06) | open |
| V20 | Claude Code subagents with `isolation: "worktree"` work inside the sandbox clone, two at a time without interfering | `docs/agents/workflow.md`, ADR-0010 | T05 | open |
| V21 | Remote Control works from the phone to the sandboxed Claude Code session (`claude.remoteControl` setting), and which hosts it needs | ADR-0011, ADR-0013 | T05 | open |
| V22 | `sbx secret set openai --oauth` works with the author's ChatGPT subscription and keeps the tokens on the host, unreadable in the VM; and whether `--oauth` can be scoped with `--sandbox januslin` | ADR-0013 | T06 | open |
| V23 | The custom secret for `slack.com` works with `scripts/coordinator-channel.sh` (Authorization header), resolving on demand without a `--refresh` flag | ADR-0011, ADR-0013 | T04 | open |
| V24 | Where the Claude `/login` credential is stored: on the host (proxy) or readable inside the VM; and whether it survives `sbx stop` and `sbx run` | ADR-0013, `docs/agents/sandbox.md` (accepted if readable) | T05 | open |
| V25 | wrangler works in the sandbox with a placeholder `CLOUDFLARE_API_TOKEN` that the proxy replaces for `api.cloudflare.com` | `docs/agents/sandbox.md` | T14 | open |
| V26 | Claude Code inside the sandbox starts in auto mode (a kit entrypoint, or Linux managed settings with `disableBypassPermissionsMode` and `permissions.defaultMode: "auto"`; whether the bypass flag then falls back or refuses to start), shown by `/permissions` | `docs/agents/sandbox.md`, ADR-0013 | T03 | open |
| V27 | Auto mode in long unattended coordinator runs: how often it pauses (3 consecutive or 20 total blocks), and whether the `Notification` hook reaches the author on Slack while it waits | `docs/agents/sandbox.md` | T05, then the first weeks of T07 onward | open |
| V28 | The Codex CLI installed in the Claude-template sandbox uses the proxy-injected `openai` OAuth secret, and stays installed after `sbx template save` and re-creating the sandbox (`sbx create -t`); which user-level config (the `Notification` hook, `~/.codex`) survives | `docs/agents/sandbox.md` | T06 | open |
| V29 | Codex's Linux sandbox (`workspace-write`) and automatic review (`--approve-for-me`) work inside the microVM, including commits and pushes, which escalate because `.git` is read-only | `docs/agents/sandbox.md` | T06 | open |
| V30 | End to end: the Claude coordinator dispatches a task to Codex with `codex exec`, gets the PR link, `pnpm verify` result, and blockers back as JSON, has a separate reviewer review it, resumes the same Codex session to fix findings, and reports; and whether auto mode blocks the dispatch command | `docs/agents/workflow.md` | T06 | open |

## Change log

| Date | Change | By (task / PR) |
|---|---|---|
| 2026-10-30 | T01: repository settings, both `main` rulesets, labels, environments, interaction limit (collaborators only, calendar expiry 2027-04-29), and App installations applied by the author (T01-H1 to T01-H3); V1 (Apps), V2, and V4 progress below. | T01 |
| 2026-10-29 | Fresh start: new public repository `januswtlin/januslin.me`; the first attempt renamed to `januswtlin/januslin.me-archive`. State above carried over from the archive's `docs/infra-current-state.md`. | Coordinator (initial commit) |
