# Infrastructure: current and desired state

Configuration that does **not** live in code: Cloudflare, GitHub, accounts outside the repository. Any agent that changes such a setting updates this file in the same PR, with the date. Identifiers here are public, not secrets.

Cloudflare account ID: `f2f02d203f0d3a3861b811030cb6f37f`. Workers subdomain: `janus-weitang-lin.workers.dev`.

## Current state (2026-10-31)

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
| `januswtlin/januslin` | private | The old Hugo site behind the Pages project. Kept until cutover (T17). |

### GitHub identities and Apps
| Identity | Id | State |
|---|---|---|
| `januswtlin` (author) | 2433928 | Owner. Passkey or 2FA on. |
| Machine account `januslin-agent` | 349746030 | Write collaborator here since 2026-10-30 (T02). Passkey or 2FA on; no SSH keys, personal access tokens, or authorized OAuth Apps (T02, 2026-10-30). Owns the two Apps. The claude.ai account is connected to GitHub as this account. |
| App `januslin-agent` (`januslin-agent[bot]`, bot user id 349177542) | App ID 5506552, installation 176078591 | Public, owned by the machine account since 2026-10-30 (T02). One installation, on `januswtlin` with this repository only. One private key, issued by the machine account on 2026-10-30, `SHA256:OIozXSJ7mTB4RYG60UV1hTVAgxfW1ohTcpwBz8FWS3w=`. |
| App `januslin-reviewer` (`januslin-reviewer[bot]`, bot user id 349179834) | App ID 5506595, installation 176079192 | Same as above; key `SHA256:NpZwHaHKbzi7hdX835OrLHkOqoNCEtZN9Oht/FoyafI=`. |
| App key sets (ADR-0015) | n/a | Active since 2026-11-01: `januswtlin-agent`, owned by `januswtlin` (private Apps, this repository only): implementer `januswtlin-agent` (`januswtlin-agent[bot]`, App 5563779, bot user 350971135), reviewer `januswtlin-reviewer` (`januswtlin-reviewer[bot]`, App 5563788, bot user 350971406). The Apps above become the set `machine` once GitHub stops refusing them ("owner marked as spammy", since 2026-10-31); their keys are out of the `agent` account. |
| App `januslin-platform` (historical) | App ID 5506604, installation 176080447 | Used earlier for workflow changes. Deleted by the author on 2026-10-30 (T02; `GET /apps/januslin-platform` returns 404). |
| Claude GitHub App | n/a | Installed on `januswtlin` with this repository only (T05, 2026-10-30). `januswtlin` does not authorize Claude; claude.ai's GitHub connection is the machine account `januslin-agent` (T05, 2026-10-30; PR #5, opened from Claude Code cloud, has author id 349746030). Permissions below (V6). |
| claude.ai account (Claude Code login in the sandbox, cloud sessions) | n/a | Connectors (claude.ai → Settings → Connectors, the author, 2026-10-30, T05): **GitHub** only; no connector that holds personal data. Separately, Claude Code in the sandbox can list claude.ai built-in MCP servers that are not in the Connectors list and are not connected: "Claude Docs" and five others (the author: built-in defaults that cannot be removed, 2026-10-30), and the `mcp__claude_ai_*` deny in `.claude/settings.json` keeps its tools away from local sessions (V31). |
| Codex / ChatGPT connector | n/a | Not set up for this project (T06). |
| Renovate | n/a | Not installed (T19). |

Permissions of the Apps (checked from installation tokens on this repository, 2026-10-30, T02): `januslin-agent` actions R, checks R, contents RW, issues RW, metadata R, pull requests RW, workflows RW (added and accepted by the installation owner in T02); `januslin-reviewer` actions R, checks R, contents R, issues R, metadata R, pull requests RW; `januslin-platform` (historical) had `januslin-agent`'s set plus workflows RW. None has administration, secrets, variables, environments, or deployments.

Permissions of the Claude GitHub App on this repository (V6; from the author's screenshots of the installation, 2026-10-30, kept by the author): read and write on actions, checks, code (contents), discussions, issues, pull requests, **repository hooks**, and workflows; read on administration, commit statuses, merge queues, and metadata; no secrets and no variables. It acts for the machine account, so the effective ceiling is the intersection with the machine account's Write: workflows write means a cloud session can push branch workflows (V7 probe); repository hooks write is recorded as granted, but managing webhooks needs admin on the repository, which the machine account does not have, so it has no effect while the machine account stays at Write. Discussions are off in the repository settings.

### GitHub settings as applied (T01, 2026-10-30)
- Settings (`gh api repos/januswtlin/januslin.me`, outputs in the T01 PR): public; squash merge only (title from the PR title, message from the PR body); auto-merge off; head branches deleted on merge; wiki, projects, and discussions off; issues on; secret scanning and push protection on; Dependabot security updates off. Actions: default `GITHUB_TOKEN` permissions `read`, Actions may not approve PRs. PR creation limited to collaborators: `pull_request_creation_policy: collaborators_only` (readable with an App token). Issue creation limited to collaborators: set in the UI (T01), confirmed there by the author 2026-10-30; `issue_creation_policy` reads `null` even with the author's admin token, so it is a manual check (quarterly review). Workflow runs from outside contributors need approval: `approval_policy: all_external_contributors`. Dependabot alerts on (`vulnerability-alerts` returns 204). Both need Administration read (403 to App tokens); author's outputs.
- Rulesets (both `active`, target `~DEFAULT_BRANCH`): `main-protect` (id 26176065): pull request with 0 approvals and squash only, block force pushes, restrict deletions, require linear history, no bypass actors, no `ci` check yet (T16). `main-restrict-updates` (id 26176087): restrict updates, bypass: repository admin role (`actor_id` 5) in pull-request-only mode. App token responses omit `bypass_actors`; the author's output shows them. GitHub added `require_extra_approval_for_unattributed_changes: true` to `main-protect` by default. Per GitHub's docs it adds one approval only to PRs Copilot opens under its own identity, and has no effect while the ruleset requires 0 approvals, so it is left as GitHub set it. The author's merge of T01's PR confirmed it: the merge box listed only the `main-restrict-updates` block, and the merge went through.
- The author merges through "Merge without waiting for requirements to be met (bypass rules)": `main-restrict-updates` blocks every update, so the merge box shows "Merging is blocked: Cannot update this protected ref." and `mergeStateStatus` reads `BLOCKED` until the author bypasses it. The bypass covers only that ruleset; `main-protect` still applies.
- Collaborators (direct): the owner `januswtlin` (listed as `admin`) and the machine account `januslin-agent` (`write`), 2026-10-30.
- Environments `production`, `preview`, `smoke`: deployment branch policy "selected branches" with one `branch` rule `main` each, no secrets, no required reviewers.
- Labels: GitHub's defaults plus `needs-human`, `translation-needed`, `incident`, `upgrade`, `maintenance`, `roadmap`, and for work items (ADR-0014) `plan`, `task`, `human-task`, `approved`.
- Interaction limit: `collaborators_only`, set 2026-10-30, API `expires_at` 2027-04-30T01:42:28Z (the UI shows no date). The calendar in `docs/operations.md` records 2027-04-29, one day early on purpose. GitHub offers no permanent option (durations up to six months only, checked in GitHub's docs on 2026-10-30); its docs say the limit also blocks reactions.

### The author's Mac
- macOS account `agent` (short name `Agent`): standard, set up, File Sharing and Remote Login off, `sudoers` rule installed, no cron jobs or LaunchAgents (`docs/admin-guide.md`).
- Clone of this repository at `~/januslin.me`, with its credential helper pointing at `~/januslin.me/scripts/agent-git-credential` and no git hooks (`docs/admin-guide.md`).
- No AI tool in `agent` (removed in T03, with its `setup-token` token and the `claude-oauth-token` file). Claude Code runs only in the sandbox, with a full claude.ai login whose tokens stay in `sbx`'s host secret store (V24). Codex: not installed.
- Current sandbox: `agent-vm`, running Claude Code and Codex (author confirmation, 2026-11-02). The following provisioning record describes the original sandbox, not a fresh verification of the current VM.
- Historical provisioning (2026-10-30): Docker Sandboxes (`sbx`) v0.50.1, installed with Homebrew from the author's account (`/opt/homebrew/bin/sbx`, `docker/tap`), run by `agent`. Signed in to Docker (`sbx login`) in `agent`; login and secrets in the dedicated keychain `~/Library/Keychains/sbx.keychain-db`. Settings: `ssh.agentForwardingEnabled false`. Global policy `deny-all` plus the global allowlist in `docs/agents/sandbox.md`. Sandbox `januslin` created from `sandbox/kit` (template `docker/sandbox-templates:claude-code-docker`, Ubuntu 26.04 arm64, Claude Code 2.1.306 in the image, Node 24.22.2 from nodejs.org, pnpm 12.16.1), with `claude.remoteControl` true. `sbx` secrets: `anthropic` only (global, the Claude login, OAuth). Credential binding for `anthropic` in `~/.config/sbx/credentials.yaml`. Token broker `scripts/token-broker.sh`, started with the sandbox by `scripts/sandbox-session.sh`.
- Claude Code managed settings installed, root-owned, with `disableRemoteControl: true`; kept unchanged as a host backstop (ADR-0013).

### Claude Code cloud
- Environment for this repository, created by the author on 2026-10-30 (T05; screenshot kept private by the author): name `januslin.me`; network access **Limited**; no environment variables and no secrets; setup script as in `docs/admin-guide.md` ("Tool logins"), which runs `corepack enable` and `pnpm install --frozen-lockfile` only once `pnpm-lock.yaml` exists.
- The environment dialog offers only None, Limited, and Full. The docs (code.claude.com/docs/en/cloud-environments, read 2026-10-30) still list None, Trusted, Full, and Custom; Limited is the dialog's name for the default allowlist, which the docs call Trusted. The dialog has no Custom level, so hosts cannot be added one by one: if `pnpm install` needs a host beyond the default allowlist, T07 revisits this, and Full needs the author's decision. T07 (2026-11-04): the lockfile needs only `registry.npmjs.org` (no build scripts, no other download hosts); that the Limited allowlist includes it is confirmed only when a cloud session's setup script first runs `pnpm install --frozen-lockfile`.

### Codex bootstrap preparation (2026-11-01; no live configuration changed)

The author authorized local code/runbook preparation before #55 is completed.
At that time the exception did not make #56 startable or complete. No Codex runtime was
installed, OAuth login performed, host mixin/policy changed, App token accessed,
cloud environment created, or live dispatch run during preparation.

Prepared: VM-only dispatcher, JSON result schema, fake CLI tests, project defaults,
and an uninstalled OpenAI OAuth proxy mixin/config candidate. Official release
metadata identified stable 0.166.0 (2026-10-29); the desktop-bundled alpha is not
the candidate stable runtime. Existing Claude-kit/sbx 0.50.1 compatibility is
unverified, including experimental kit-add support and automatic review through
the proxy provider. Details and evidence fields: `docs/agents/codex.md`.
New host runbook commands wait for their merge to `main`; only preparation and
new bootstrap-branch SSH pushes were authorized in this local session. Runtime
continues to require role Apps and the unchanged T08 approval/dependency gates.

Codex cloud remains unconfigured. Current official docs distinguish the current
published Cloud environments from legacy GitHub-integration environments;
`docs/runbooks/codex-cloud.md` requires recording which actual UI is available.
V8/V10/V22/V28/V29/V30 and reverse cross-tool review remain PENDING; no placeholder
in a config file or passing fake test resolves those rows.
## Main watcher acceptance evidence (T04, 2026-11-02)

The isolated live test for #55 / PR #102 started at the confirmed root `422517b80a52ae51d849080ab01c5b6a60b22b91`. Its first complete check returned exit 3: 13 commits were verified through the API as author merges, and two historical commits returned `no-pr`. Their subjects reference PR #5 and #6, whose endpoints return 404 through the App. They remain API-unverified:

| SHA | Resolution |
|---|---|
| `dbb73f6e3daec0a64156c527f12356ab70436dbe` | Author-confirmed merge; historical acceptance entry (chronology below) |
| `8f47de99b693fa27dfa5b61568486037315a6b95` | Author-confirmed merge; historical acceptance entry (chronology below) |

The author answered the coordinator's exact-SHA question in the session: "I merged both; authorize those two exceptions". The coordinator recorded that direct-session authorization in [#55's evidence comment](https://github.com/januswtlin/januslin.me/issues/55#issuecomment-6569139951). The comment is an audit record; the direct author statement was the authority.

Under that original authorization, the implementer ran `accept` for only those two SHAs in the existing private temporary test state, then `check`. Both accept commands and the final check returned exit 0. The final baseline was `cfb6c3481571101c2e68884ec2bcadb66b729684`; its acceptance journal contained exactly those two SHAs and no pending records. The original failing report is preserved in PR #102 alongside the subsequent successful output. No default coordinator state was initialized or changed, and the script has no hardcoded exceptions.

The author then withdrew the earlier statement: "I need to revert what I said. I can't verify #5 and #6." The [withdrawal record](https://github.com/januswtlin/januslin.me/pull/102#issuecomment-6569673911), posted 2026-11-02T05:17:18Z, superseded the earlier readiness notice. The existing temporary journal was preserved as historical evidence; no new acceptance or permanent-state initialization followed the withdrawal.

Subsequently the author checked the PRs while logged in as machine account `januslin-agent`. The author reports that GitHub spam-blocked that account and that PR #5/#6 are visible there but unavailable when logged in as `januswtlin`; agents did not independently verify this account-visibility explanation or access that account. The author initially said the two PRs were closed, then clarified "merged" when asked whether that meant author-merged. [The subsequent evidence record](https://github.com/januswtlin/januslin.me/issues/55#issuecomment-6569779487) documents this direct merger confirmation. This resolves the author's stated inability to verify those historical merges; it is not a new statement authorizing acceptance commands or initialization.

After that clarification, the implementer ran only `check` against the same private temporary journal: exit 0, no new commit reports, baseline still `cfb6c3481571101c2e68884ec2bcadb66b729684`, and exactly the same two accepted entries. No new `accept` or `init` ran. The two merges are now author-confirmed but remain API-unverified; the original `no-pr` reports, original authorization, withdrawal, and later clarification are all retained as the live evidence adjustment. This successful incremental check does not independently reverify already accepted historical commits.

[Incident #103](https://github.com/januswtlin/januslin.me/issues/103) remains open for the author alone to close. Fresh-state initialization and exception handling remain author-controlled ([startup runbook](runbooks/start-coordinator.md#initialize-a-missing-main-watcher-state)); the historical test journal grants no permission to initialize permanent state or replay acceptance. #70 remains open and independently actionable; #71 becomes actionable after merge, with V27/V33 still pending.

### Current coordinator handoff (2026-11-02)

After the historical test above, the author explicitly authorized permanent
initialization: [#104 initialization evidence](https://github.com/januswtlin/januslin.me/issues/104#issuecomment-6572983471)
records `init` exit 0, then `check` exit 3 with 14 verified and the same two pending
historical SHAs. The author subsequently approved accepting exactly
`dbb73f6e3daec0a64156c527f12356ab70436dbe` and
`8f47de99b693fa27dfa5b61568486037315a6b95`. The coordinator records both accepts
exit 0, final `check` exit 0, baseline
`afae1ebd6d644e8d305fb1031b76e6ee39ece184`, journal mode 0600, exactly those two
acceptance entries, and no pending reports in
[#104's result](https://github.com/januswtlin/januslin.me/issues/104#issuecomment-6573048249)
and [#103's evidence](https://github.com/januswtlin/januslin.me/issues/103#issuecomment-6573048809).
This supersedes the earlier pending initialization state; it preserves every
historical withdrawal and does not independently API-verify the two old merges.
The T06 implementer did not initialize or change watcher state.

At the 2026-11-02 handoff, #55 was completed; #70/#71 and V27/V33 remained
follow-ups. The author then reported ChatGPT connected as `januswtlin`
([#72](https://github.com/januswtlin/januslin.me/issues/72#issuecomment-6573097069)),
so the preparation route withheld live dispatch pending the connection check.
That gate is superseded by the verified 2026-11-04 amendment below: local
in-VM Codex login/dispatch is approved, and connection checks move to #112.
The earlier observation of binary 0.166.0 alone was not acceptance evidence.

## T06 amended local runtime evidence (2026-11-04)

The author amended #56 in an unedited comment created 2026-11-04T05:50:15Z
(numeric author ID 2433928; verified with `work-status.sh author-activity`).
[ADR-0018](decisions/ADR-0018-codex-in-vm-login.md) supersedes Codex's planned
host OpenAI OAuth route: the author approved in-VM login, with GitHub using the
mounted one-hour role-token fallback. The subscription credential may be readable
inside the VM; no authentication-file content was inspected. V22/V28 are resolved
by recording this decision and risk, awaiting the author's human verification.
#73 is no longer needed. This supersedes the old #72 local-dispatch gate above.

The read-only identity mount names set `isweichen`, owner `isweichen`, repository
`januswtlin/januslin.me`, implementer App 5604449 / bot 352218417, reviewer App
5604481 / bot 352219106. Role aliases remain unchanged. The author designates
`isweichen` for the ChatGPT/cloud machine account; connection/connector checks
(criteria 1–2/#72), cloud/V10/#75, phone steering, and template save/#74 move to
#112. No tested cloud connection, new host policy, or template persistence is
claimed here; the earlier identity/provisioning tables are historical snapshots.

Codex 0.166.0 loaded project defaults after #113. V8 measured apps/plugins false,
gateway disabled, successful ordinary feature overrides, absent requirements at
checked paths, and matching start/resume permission metadata. V29 includes the
same UUID on both turns, read-only `.git` metadata, and automatically reviewed
git actions. Full commands, API identities, limitations and remaining evidence:
[acceptance report](reports/T06-sandbox-acceptance.md) and [PR #114](https://github.com/januswtlin/januslin.me/pull/114).
V30/final review/report and reverse-review links are coordinator evidence. The
author must verify the remaining T06 rows before closing; this record does not
close a task or prove identity from a model claim.

## Planned state

Settings that planned tasks change. A row moves into "Current state" when its task merges.

| Setting | Desired | Task |
|---|---|---|
| `main-protect` requires `ci`; environment secrets | As in `docs/security.md` and `docs/deployment.md` | T14, T15, T16 |
| Codex connector App | Installed on `januswtlin` with this repository only; ChatGPT connected to GitHub as the machine account | T06 |
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
| The Slack app `januslin-coordinator` (no longer used, ADR-0014) and its bot token in the `agent` account | Deleted | T04 (#70) |

## Open verifications

Claims the docs rely on that nobody has tested yet. Whoever reaches the "When" step tests it, records the result here (date, evidence), and fixes the docs if the claim was wrong. A row leaves this table only into the change log, with its result.

| ID | Claim to verify | Docs that assume it | When | Status |
|---|---|---|---|---|
| V1 | With PR creation limited to collaborators, the Apps and Renovate can still open PRs | `docs/security.md`, `docs/automation.md`, ADR-0012 | T01 (Apps), T19 (Renovate) | Apps: implementer passed 2026-10-30 (`januslin-agent[bot]` opened T01's PR #1); reviewer passed 2026-10-30 (`januslin-reviewer[bot]` posted a review on PR #1). Renovate: open (T19) |
| V2 | The two `main` rulesets let the author merge PRs, and refuse direct pushes to `main` by the author, the machine account, the Apps, and a deploy key; merges by the machine account and the Apps; the author's merge of a PR whose `ci` is red or pending (after T16); and auto-merge | ADR-0003, `docs/deployment.md`, `docs/security.md` | T01, T02 (machine account), T16 (`ci`), V12 (deploy key) | Partly passed 2026-10-30: `januslin-agent[bot]` push to `main` refused (GH013, "Changes must be made through a pull request", "Cannot update this protected ref"); `gh pr merge` by both Apps refused ("the base branch policy prohibits the merge"); enabling auto-merge refused ("Auto merge is not allowed for this repository"). The author's direct push of an empty commit refused (GH013, same two rules; a first attempt was refused earlier by GH007, private email, which GitHub checks before rulesets). The author's merge of T01's PR succeeded through the bypass (2026-10-30, squash commit 54f5f87, `merged_by` id 2433928). The machine account `januslin-agent` could neither merge T02's PR #2 (merge box: "Merging is blocked: Cannot update this protected ref.", no bypass option) nor commit to `main` in the web editor ("You can't commit to `main` because it is a protected branch"; only a new branch offered) (the author's screenshots, T02, 2026-10-30). Open: `ci` (T16), deploy key (V12) |
| V3 | Environment required reviewers let the repository owner approve their own deployment (with "prevent self-review" off) | `docs/deployment.md` (not used; recorded for the decision) | T16 (#65) | open |
| V4 | With PR and issue creation limited to collaborators and the interaction limit set to collaborators only, a signed-in non-collaborator cannot comment or open issues or PRs (and whether reactions are blocked too), and the Apps, Renovate, and `github-actions[bot]` still work | `docs/security.md`, ADR-0012 | T01 (Renovate and `github-actions[bot]`: T19) | Partly passed 2026-10-30: the limit reads `collaborators_only` (author's API output), and the Apps opened PR #1 with it on. Open: a live test from a non-collaborator account (none available in T01), Renovate and `github-actions[bot]` (T19) |
| V6 | The Claude GitHub App's repository permissions, in particular Workflows, Secrets, and Variables | ADR-0009, `docs/security.md` | T05 | Passed 2026-10-30 (T05, the author's screenshots of the installation, kept by the author): Workflows read and write; no Secrets, no Variables. Also repository hooks read and write (no effect at the machine account's Write; see "GitHub identities and Apps") |
| V7 | A Claude Code cloud session pushes and opens PRs as the machine account (id 349746030), cannot read other repositories of `januswtlin`, is refused on `main` by the ruleset, and which branch names it may push | ADR-0009, `docs/agents/workflow.md` | T05 | Passed 2026-10-30 (T05, environment `januslin.me`), with findings. Repository activity API: `branch_creation` of `agent/test/T05-cloud-probe` (283f760) and `agent/test/T05-cloud-probe-workflow` (561d786) by `januslin-agent`, id 349746030. Probe PR #8 (draft) opened by `januslin-agent`, id 349746030; the author closed it unmerged at 2026-10-30T15:18:23Z and deleted both branches. Reading `januswtlin/januslin`: `git ls-remote` and `git clone` both failed ("could not read Username for 'https://github.com': terminal prompts disabled", exit 128). `git push origin HEAD:main`: refused, GH013 ("Changes must be made through a pull request.", "Cannot update this protected ref."). The branch adding a `workflow_dispatch` workflow was **accepted**, so the Claude App's Workflows write is effective (V6). `agent/test/*` was accepted; no `claude/` prefix is forced on names the session chooses. **Findings:** (1) commit author and committer are `Claude <noreply@anthropic.com>`, signature verified, linked by GitHub to the user `claude` (id 81847), not the machine account; only pushes and PRs are the machine account. The `Agent: claude` trailer was present; the commits also carried a `Claude-Session:` trailer with the session URL. (2) `git push origin --delete` from the session was refused (HTTP 403, "RPC failed"), so the author deletes branches made by cloud sessions |
| V8 | Personal-account config and ordinary override behavior in the VM | ADR-0009, ADR-0018 | T06 (#56) | Evidence recorded 2026-11-04: 0.166.0 project/user defaults, absent requirements at checked paths, disabled apps/plugins/gateway, CLI feature override succeeds; not enforced policy. Report linked above; author verification pending |
| V9 | A `workflow_run` job can use an environment whose deployment branch policy is `main` only | `docs/deployment.md` (preview job) | T16 (#65) | open |
| V10 | Codex cloud push/identity/private-repo/main/workflow probes | ADR-0009, ADR-0018 | Follow-up #112/#75 | Moved out of T06 by verified author amendment, 2026-11-04; no cloud probe performed by this implementer |
| V11 | Claude Code scheduled-task GitHub triggers can filter on PR author (`renovate[bot]`, `januswtlin`, the bots, the machine account) | `docs/automation.md` | T20 (#69) | open |
| V12 | A deploy-key push shows as pushed by `januswtlin`, the key's "last used" date updates, and a deploy-key push to `main` is refused by the ruleset | `docs/admin-guide.md`, `docs/security.md` | First Working Copy setup (`docs/admin-guide.md`) | open |
| V13 | The iOS photo Shortcut's output has no GPS EXIF and is under 1.5 MB | `docs/authoring-guide.md`, `docs/content-model.md` | T12 (#63) | open |
| V14 | The licenses of the theme's bundled fonts and assets allow redistribution in a public repository and on the site | ADR-0019 (formerly ADR-0001), `THIRD_PARTY_NOTICES.md` | T09 (#58) | Passed 2026-11-04 (T09, #58) for Sumi: Sumi's code (MIT), Source Serif 4 and JetBrains Mono including the OG font `src/assets/fonts/jetbrains-mono-latin-400.ttf` (OFL 1.1), Noto Serif TC (OFL 1.1, from `@fontsource-variable/noto-serif-tc`), and KaTeX's fonts (MIT) are verified from primary sources in `THIRD_PARTY_NOTICES.md`; no unverified asset is bundled. Retypeset's assets (Snell Roundhand, sound effects) were never merged (PR #121 closed) |
| V19 | The egress allowlist is enough for `pnpm install`, Playwright's Chromium download, `pnpm verify`, `gh`, and git, and blocks everything else | `docs/agents/sandbox.md` | T07 (#57), T06 (#56) | Partly passed 2026-10-30: `gh`, git push, the npm registry (Node 24, pnpm via Corepack), Playwright's Chromium download and launch (with the Chrome for Testing and Ubuntu mirror rules), `sh tests/scripts/run.sh` on Linux; `curl https://example.com` returns 403 and appears in `sbx policy approval ls`. Claude Code and Remote Control passed (V21). The real project passed 2026-11-04 (T07, #57): in `agent-vm` on Node 24.22.2 and pnpm 12.16.1, `pnpm install --frozen-lockfile` from an empty `node_modules` (177 lockfile packages, all from `registry.npmjs.org`, no build scripts) and `pnpm verify` both exit 0 with no new host. Open: Codex (T06); OpenAI egress inventory reconciled 2026-11-04 from the author's `sbx policy ls agent-vm --wide` listing ([#116](https://github.com/januswtlin/januslin.me/issues/116)): in-VM Codex uses `auth.openai.com:443` and `chatgpt.com:443`, scoped to `agent-vm` (not global), now in the allowlist table |
| V20 | Claude Code subagents with `isolation: "worktree"` work inside the sandbox clone, two at a time without interfering | `docs/agents/workflow.md`, ADR-0010 | T05 | Passed 2026-10-30 (T05, Claude Code 2.1.314): the coordinator ran two worktree subagents at once (the T05 implementer and a probe). `git worktree list` showed the main checkout `/Users/Agent/januslin.me` at 8f47de9 [main] and two locked worktrees under `.claude/worktrees/`; a file the probe created showed as untracked only in its own worktree and was absent from the main checkout; each subagent's git commands were confined to its own worktree by the harness ("a worktree-isolated agent's git operations must target its own worktree"). **Finding:** both worktrees started at a0ca6c8, the commit the coordinator session started on, not at `main`'s 8f47de9; an implementer must branch from `origin/main` itself (`docs/agents/workflow.md`, "Coordinator loop") |
| V21 | Remote Control works from the phone to the sandboxed Claude Code session (`claude.remoteControl` setting), and which hosts it needs | ADR-0013, ADR-0014 | T05 | Passed 2026-10-30 (T05): after `sbx settings set claude.remoteControl true`, the author attached from the phone to the coordinator session in `januslin` and sent the probe instruction. The session pushed an empty commit 61fea25 to `agent/test/T05-rc-probe`; the activity API shows `branch_creation` by `januslin-agent[bot]`, id 349177542, at 2026-10-30T15:21:33Z, so GitHub access from a Remote Control session stays on the App. The session then deleted the branch with the App credential (accepted). No host beyond the allowlist was needed; Remote Control connected without any approval request |
| V22 | Approved Codex authentication route and credential exposure | ADR-0018 supersedes host-OAuth requirement | T06 (#56) | Resolved by recording approved in-VM login, mounted GitHub token fallback and VM-readable subscription-login risk; no sentinel-isolation claim; #73 no longer needed; author verification pending; OpenAI egress inventory reconciled 2026-11-04 from the author's `sbx policy ls agent-vm --wide` listing ([#116](https://github.com/januswtlin/januslin.me/issues/116)): in-VM Codex uses `auth.openai.com:443` and `chatgpt.com:443`, scoped to `agent-vm` (not global), now in the allowlist table |
| V24 | Where the Claude `/login` credential is stored: on the host (proxy) or readable inside the VM; and whether it survives `sbx stop` and `sbx run` | ADR-0013, `docs/agents/sandbox.md` (accepted if readable) | T05 | Passed 2026-10-30 (T21): stored on the host. After `/login`, `sbx secret ls` lists `anthropic` (global, "oauth configured"); the VM's `~/.claude/.credentials.json` has a 26-character sentinel access token, with the claude.ai scopes (`user:inference`, `user:profile`, `user:sessions:claude_code`, among others). The login survived `sbx stop` and `sbx run`. Re-confirmed 2026-10-30 (T05): `~/.credentials.json` in the VM still holds 26-character access and refresh tokens; no `claude-oauth-token` file anywhere in the VM, and no `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_*` credential variable in its environment |
| V25 | wrangler works in the sandbox with a placeholder `CLOUDFLARE_API_TOKEN` that the proxy replaces for `api.cloudflare.com` | `docs/agents/sandbox.md` | T14 (#60) | open |
| V26 | Claude Code inside the sandbox starts in auto mode (a kit entrypoint, or Linux managed settings with `disableBypassPermissionsMode` and `permissions.defaultMode: "auto"`; whether the bypass flag then falls back or refuses to start), shown by `/permissions` | `docs/agents/sandbox.md`, ADR-0013 | T03 | Passed 2026-10-30 (T03, live check in T21, Claude Code v2.1.314): `sandbox/kit` starts Claude Code with `--permission-mode auto` and writes managed settings disabling bypass mode. After the first working `/login`, the interactive session shows `auto mode on`; `claude -p … --output-format stream-json` reports `"permissionMode":"auto"` both without a flag and with `--dangerously-skip-permissions`, so the bypass flag does not refuse to start but falls back to the managed default. `/etc/claude-code/managed-settings.json` in the VM is as written by the kit |
| V27 | Auto mode in long unattended coordinator runs: how often it pauses (3 consecutive or 20 total blocks), and whether the author learns that it waits, while away with Remote Control connected | `docs/agents/sandbox.md` | T04 (#55, #71), then the first weeks of T07 onward | Pending after T04 merges: #71 exercises a harmless scoped permission prompt while the author is away with Remote Control connected; a follow-up docs PR records arrival/delay or failure and the proposed next step. No live notification result yet |
| V28 | Approved in-VM Codex runtime route and risk; template persistence split out | ADR-0018 | T06 (#56); template follow-up #112/#74 | Resolved by recording in-VM login/risk and observed 0.166.0 inference in the existing VM; original proxy/persistence gate superseded. Template save/recreation moved to #112; author verification pending; OpenAI egress inventory reconciled 2026-11-04 from the author's `sbx policy ls agent-vm --wide` listing ([#116](https://github.com/januswtlin/januslin.me/issues/116)): in-VM Codex uses `auth.openai.com:443` and `chatgpt.com:443`, scoped to `agent-vm` (not global), now in the allowlist table |
| V29 | Start and exact-session resume workspace-write/on-request/auto_review, git denial/escalation and API actors | ADR-0018, sandbox guide | T06 (#56) | Start and resume metadata recorded for UUID 01a1a528-db91-7bb0-b671-046b6397a92c; .git write-open refused (errno 30); reviewed start commit/push succeeded as active bot 352218417, old commit author 349177542. Resumed decision commit 9c8cceb and its push verified as actor 352218417; author verification pending |
| V30 | Dispatch, independent cross-tool review, exact-session findings resume, fix and coordinator report | Workflow, ADR-0018 | T06 (#56) | PR #114 and independent Claude review 5764059589 recorded; this exact UUID resumed for findings. Final fix/report/re-review links and reverse-review evidence supplied by coordinator; author verification pending. CI not yet implemented |
| V31 | The repository's `.claude/settings.json` takes effect in the sandbox: a claude.ai connector tool (`mcp__claude_ai_*`) and `CronCreate` are denied, `RemoteTrigger` is the right tool name, and `CLAUDE_CODE_DISABLE_CRON` turns the cron tools off | `docs/agents/sandbox.md` ("Permissions inside the VM") | T05 | Passed 2026-10-30 (T05, Claude Code 2.1.314), with one part not observable: the `init` event of `claude -p … --output-format stream-json --verbose` lists 23 tools in the repository and 29 outside it, the six missing being `RemoteTrigger` (so the name is right and the deny applies) and the five `mcp__mcp-gateway__*` tools, denied since the author's decision of 2026-10-30. In the interactive sessions in the repository, the claude.ai connector "Claude Docs" connects (its server instructions arrive) but none of its `mcp__claude_ai_*` tools is offered. No `Cron*` tool appears in either `-p` run, with or without the repository settings, so the effect of the cron denies and `CLAUDE_CODE_DISABLE_CRON` cannot be told apart in 2.1.314; they stay as defaults. `permissionMode` is `auto` in both |
| V32 | A PR merged by the author records the author as the `ClosedEvent` actor of the issue it closes, so "closed by the author" covers merges | ADR-0014, `docs/agents/workflow.md` | T08 (#54) fixture-tests author vs bot closes; the first task merge after it confirms the live behavior | Passed 2026-11-02 (T04): `scripts/work-status.sh check 54` exits 3 with `issue is not open`. Live GraphQL through the implementer App confirms issue #54 is `CLOSED` / `COMPLETED`; its latest `ClosedEvent` is 2026-11-02T04:15:40Z, actor `januswtlin` database ID 2433928. PR #101 was merged 2026-11-02T04:15:38Z by the same database ID 2433928, merge commit `cfb6c3481571101c2e68884ec2bcadb66b729684` |
| V33 | Assigning an issue to `januswtlin` and requesting the author's review reach the author's phone as GitHub Mobile push notifications | ADR-0014, `docs/admin-guide.md` | T04 (#71) | Pending after T04 merges: #71 tests a throwaway issue assignment; record the phone result in a follow-up docs PR. PR review-request delivery remains a separate observation |

## Change log

| Date | Change | By (task / PR) |
|---|---|---|
| 2026-11-04 | T07: Node project bootstrapped (`package.json`, pnpm 12.16.1, Node ^24.22.2, `pnpm verify`); V19's real-project part passed in `agent-vm` with no new host. | T07 (#57) |
| 2026-11-04 | T06 author-amended in-VM Codex login/risk recorded in ADR-0018; active `isweichen` role identities, V8 defaults/override and same-session V29 evidence recorded in PR #114. Connection/cloud/phone/template work moved to #112; author verification and coordinator evidence still required. | T06 |
| 2026-11-01 | T06 local preparation only: fake-tested dispatcher/schema, candidate VM configuration and runbooks; no live acceptance or external configuration change. #55 dependency and #56 approval remain gates. | #56 bootstrap candidate |
| 2026-11-01 | The work issues re-created by the author, because GitHub hid the machine account's: plan #53, tasks #54 to #69, human tasks #70 to #91, adoption #92 (old #11 to #49 and #51, in order; the originals are closed as not planned). Docs now cite the new numbers; older rows below keep the old ones. App set `januswtlin-agent` active: implementer `januswtlin-agent[bot]` (App 5563779, bot user 350971135), reviewer `januswtlin-reviewer[bot]` (App 5563788, bot user 350971406), owned by `januswtlin`. | Author; this PR |
| 2026-10-31 | Work moved to GitHub issues (ADR-0014): plan #11, tasks #12 to #27, human tasks #28 to #49; labels `plan`, `task`, `human-task`, `approved` created. Slack dropped as the notification channel; V23 (Slack secret) dropped with it; the Slack app's deletion is #28. V32 and V33 added. | Cloud session (this docs PR) |
| 2026-10-30 | T05 (in progress): the author confirmed the connector review, the Claude App scope, and the connection check were done before the T21 login (no personal-data connectors; Claude App on this repository only; claude.ai's GitHub connection is the machine account, `januswtlin` does not authorize Claude), so no new `/login` was needed. **V6 passed**, **V20 passed** (with the worktree-base finding), **V24 re-confirmed**, **V31 passed** (cron part not observable). V27 was moved to T04. T05: the author set `sbx settings set claude.remoteControl true`. T05: the cloud environment `januslin.me` created with network access Limited, no variables or secrets, the specified setup script; the dialog offers only None, Limited, and Full (no Trusted or Custom, unlike the docs). Also seen: the sandbox template configures a user-level MCP server `mcp-gateway` (`http://mcp-gateway.docker.internal/mcp`, `Authorization: Bearer proxy-managed`, in `~/.claude.json`), whose tools include `mcp-add` and `mcp-config-set`; not denied by the repository settings. T05: **V7 passed** (pushes and PRs as the machine account; commits authored by GitHub user `claude`; the session cannot delete branches; branch workflows can be pushed) and **V21 passed** (Remote Control, pushes stay `januslin-agent[bot]`, no new host). T05 names: GitHub only; "Claude Docs" is a built-in claude.ai MCP server, not a listed connector. The author decided to deny `mcp__mcp-gateway__*` (added to `.claude/settings.json`; `init` lists 23 tools in the repository, 29 outside it) and to keep the `Claude-Session:` commit trailer (`docs/agents/workflow.md`, "Cloud sessions"). Observed once in five `claude -p` runs in the repository: the `init` event listed "Claude Docs" and five other claude.ai built-in MCP servers (not connected), all `pending`, with no tools offered; the other runs listed only `mcp-gateway`. Resolved with the author (T05): these are claude.ai built-in defaults that cannot be removed and are not connected; only GitHub is connected; inside the repository `mcp__claude_ai_*` denies their tools. | T05 |
| 2026-10-30 | T21: `/login` in `januslin` failed with 401 because `sbx` refused the inherited Claude OAuth credential for the third-party kit without a binding (`proxy: OAuth refresh denied (no authorizing binding)`; a built-in `claude` sandbox logged in). The author wrote the `anthropic` OAuth binding in the `agent` account's `~/.config/sbx/credentials.yaml`; `/login` then worked. **V24 passed**: the tokens stay on the host. **V26 passed**: auto mode, and the bypass flag falls back to it. | T21 |
| 2026-10-30 | T03: `sbx` v0.50.1 installed; sandbox `januslin` created from `sandbox/kit`; token broker; global deny-all allowlist. **V15 passed** with a change: `sbx` runs from `agent` in a `sudo -iu agent` session, but the account has no login keychain (never logged in at the desktop), so `sbx login` raised "Keychain Not Found"; fixed with a dedicated default keychain `sbx.keychain-db`, unlocked once per restart. **V16 passed**: from the VM, only `/run/sandbox/source`, `sandbox-tokens/`, `sandbox-config/`, `/run/sbx/skills-shared` (all read-only, writes refused even as root) and `/etc/resolv.conf` are host paths; no `.pem` anywhere; the keys, the broker log, the `agent` keychain, and `/Users/januslin` are absent; clone mode accepts the extra `:ro` mounts. **V17 passed, then superseded**: with `sbx secret set github --sandbox januslin --refresh on-demand --command 'sed -n 1p …/proxy-tokens/januslin-agent.token'`, `git push` and `gh` (REST, GraphQL) worked as `januslin-agent[bot]` with only a placeholder in the VM (`GH_TOKEN` `gho_…`, 40 characters). **V18 failed**: with that secret active, the proxy replaced explicit reviewer tokens (`gh`, and `curl` with `Bearer`) with the implementer's; reviews appeared as `januslin-agent[bot]` (probe PR #3). The author chose ADR-0013's fallback: no `github` secret, both tokens in the read-only mount; then V18 passed (`januslin-reviewer[bot]`, id 349179834) and pushes and `gh` as `januslin-agent[bot]` passed through the credential helper and `scripts/agent-gh`. | T03 |
| 2026-10-30 | T02: machine account secured; `januslin-platform` App deleted (404); both Apps made public and transferred to the machine account; new keys issued by it, old keys deleted, one key each; Workflows RW added to `januslin-agent`; the machine account added as Write collaborator; agent scripts ported to `scripts/` with tests. V2 machine-account part passed (T02). V5 passed: before and after the transfer, App IDs 5506552 and 5506595, installation IDs 176078591 and 176079192 (on `januswtlin`, this repository only, checked with unrestricted tokens), and bot user ids 349177542 and 349179834 were unchanged; keys from before the transfer kept working until they were replaced. | T02 |
| 2026-10-30 | T01: repository settings, both `main` rulesets, labels, environments, interaction limit (collaborators only, calendar expiry 2027-04-29), and App installations applied by the author; V1 (Apps), V2, and V4 progress below. | T01 |
| 2026-10-29 | New public repository `januswtlin/januslin.me`; initial state recorded. | Coordinator (initial commit) |
