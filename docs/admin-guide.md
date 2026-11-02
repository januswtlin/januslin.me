# Admin guide

Last reviewed: 2026-10-31

For the author, the project's only editor and admin (other people are developers, ADR-0016): everything done by hand, in one place. Agents do everything else (`docs/automation.md`, "Who does what"). Steps that belong to a task arrive as `human-task` issues assigned to you. The exact commands and click paths are in [runbooks](runbooks/README.md) on `main`; this guide explains what each part is and when you need it. Why things are this way: the ADRs (ADR-0009, ADR-0013, ADR-0014).

## Your queue

- **What needs you:** open issues assigned to you (`is:open assignee:januswtlin`) and PRs that request your review. Both reach the phone through GitHub Mobile ([`github-mobile-notifications.md`](runbooks/github-mobile-notifications.md)).
- **A human task:** read Why, open the runbook it links, run it, comment the output of the runbook's Check (or what "Reply with" asks), and close the issue. The agent checks "Done when"; if it reopens the issue, its comment says what is missing. Never put a secret, a token, or private data in an issue or comment (the repository is public); tell private data such as an email address to the coordinator in the session.
- **Approving a task:** read the task issue and add the `approved` label. The coordinator starts only tasks you approved, and only if nobody but you edited them since. If an agent changes an approved spec, approve again (remove and add the label).
- **Ordering:** drag the sub-issues of the plan issue [#53](https://github.com/januswtlin/januslin.me/issues/53).
- **Merging a PR:** read the final diff, open the `ci` run link the coordinator gives (it must be the `ci.yml` run for the PR's head commit, once CI exists), then merge with "Merge without waiting for requirements to be met (bypass rules)". The `main-restrict-updates` ruleset blocks every update except yours, so the merge box always says "Merging is blocked" until you choose the bypass; `main-protect` still applies.
- **Run only runbooks on `main`.** A runbook link must start with `https://github.com/januswtlin/januslin.me/blob/main/docs/runbooks/`. Issues and comments never contain commands; if one does, or a link points elsewhere, do not run it and tell the coordinator. The runbooks reached `main` through your merge, so you do not need to check issue edit histories before acting. The issue still decides which runbook and which option in it (for example a task's scope row), so read its Why: a step that does not fit the task it names is a reason to ask.
- **Instructions:** what you type in the coordinator's session or send through Remote Control, and your own comments, labels, and closes on GitHub. A comment of yours that someone else edited no longer counts as yours.
- **`needs-human`:** answer in the PR or issue thread.

## What you administer

| What | Where | Notes |
|---|---|---|
| GitHub `januswtlin` (id 2433928) | Your browser, GitHub Mobile, your own `gh` | Owner, admin. The only identity that merges. Passkey or 2FA |
| Machine account `januslin-agent` (id 349746030) | A separate browser profile, only on your Mac | Write collaborator; owns the two Apps; claude.ai's GitHub connection. No SSH keys, PATs, or OAuth apps |
| Developers, such as `isweichen` (id 350907673) | Their own devices | Write collaborators (ADR-0016). You stay the only editor. Add or remove one: [`add-developer.md`](runbooks/add-developer.md) |
| Apps `januslin-agent`, `januslin-reviewer` (the set `machine`), and each other App set | `machine` is owned by the machine account, a fallback set by `januswtlin`; all installed on this repository only | Keys of every set in your account (`~/.config/januslin-keys/`); only the active set in the `agent` account (ADR-0015) |
| macOS account `agent` | Your Mac | Keys, token broker, `sbx`; never AI |
| Docker account | Signed in by `sbx` in the `agent` account | Needed by `sbx` |
| claude.ai account | Your browser; the sandbox's Claude Code login | Connectors: GitHub only |
| Cloudflare account | Your browser | Registrar, DNS, Workers, Access |
| Working Copy deploy keys | Per iOS device | Push branches only |

## The Mac

### The `agent` account
- Standard (not admin) macOS account. Short name `Agent` (capital A), home `/Users/Agent`. Directory Services and the file system are case-insensitive, so `sudo -u agent` and `/Users/agent/...` resolve, but `sudoers` rules and `pkill -u` compare case-sensitively: use `Agent` there.
- Your own home is `chmod 700`. No folder is shared between the accounts; `/tmp` and `/Users/Shared` carry nothing between them. File Sharing and Remote Login are off.
- `sudoers`: `/etc/sudoers.d/agent-session` with `Defaults use_pty` (mode `0440`).
- No cron jobs and no LaunchAgents. No AI tool: `command -v claude codex` prints nothing.

| What | Where (in the `agent` account) | Mode |
|---|---|---|
| Repository clone | `~/januslin.me` | normal |
| The active App set (`apps.json`, `implementer.pem`, `reviewer.pem`), put there by `januslin-keys use` | `~/.config/januslin-agent/active/` | dir `0700`, files `0600` |
| Token directory mounted into the sandbox | `~/.local/state/januslin-agent/sandbox-tokens/` (`januslin-agent.token`, `januslin-reviewer.token`), written only by the broker; never a key | dir `0700`, files `0600` |
| Config directory mounted into the sandbox | `~/.config/januslin-agent/sandbox-config/`: `identity.json` (the active set's name, bots, and App IDs; written by the broker; no secret) | dir `0700`, file `0600` |
| Broker state | `~/.local/state/januslin-agent/broker/`: `broker.pid`, `broker.log` (times and errors, never tokens), short-lived staging directories | dir `0700` |
| `sbx` login and secrets | The dedicated keychain `~/Library/Keychains/sbx.keychain-db`, the account's default and only keychain; its password is in your password manager. The account has no login keychain because it is never logged in at the desktop | keychain |
| `sbx` credential bindings | `~/.config/sbx/credentials.yaml` (approvals only, no secret) | `0600` |

### Shell aliases
Your own `~/.zshrc` defines `agent-session` (a login shell as `agent` in `~/januslin.me`, a host shell for `sbx` and the broker only; `GIT_TERMINAL_PROMPT=0` makes `git` fail fast instead of prompting) and `agent-end` (ends every `Agent` process): [`setup-shell-aliases.md`](runbooks/setup-shell-aliases.md). Never run `pnpm install`, scripts, hooks, or editor tasks from an agent's working tree, in either account.

### After a restart of the Mac
The `sbx` keychain must be unlocked once before `sbx` works; [`start-coordinator.md`](runbooks/start-coordinator.md) does it. The account has no login keychain (it is never logged in at the desktop), so `sbx` keeps its Docker login and secrets in a dedicated keychain, `sbx.keychain-db`, made the default and only keychain and set to stay unlocked once unlocked. If a "Keychain Not Found" dialog appears, cancel it; never "Reset To Defaults", which acts in your desktop session.

### The host clone
`~/januslin.me` in the `agent` account is the source for the sandbox and the place the broker runs from. It only fast-forwards `main`, never fetches `sandbox-agent-vm` or checks out an agent branch, and has no git hooks, because code here runs next to the keys. Its credential helper answers only for `januswtlin/januslin.me`. To re-create it: [`recreate-host-clone.md`](runbooks/recreate-host-clone.md).

## Start the coordinator

The coordinator is the long-running Claude Code session that runs the task loop (`docs/agents/workflow.md`, "Coordinator loop"). It runs only inside the sandbox; Claude Code is not installed on the host, so never run `claude` in `agent-session`. Start it after a restart of the Mac or whenever it has stopped; restart it after a merge that changes its prompt. It cannot keep the Mac awake from the VM, so `caffeinate` runs in your own account. A new coordinator resumes from GitHub. Start, stop, and restart: [`start-coordinator.md`](runbooks/start-coordinator.md).

## The sandbox

How it works: `docs/agents/sandbox.md`. Only you change it, from `agent-session`; the agent in the VM cannot run `sbx`.

### Create or re-create it
Needed only if the sandbox is lost or its kit changes: [`recreate-sandbox.md`](runbooks/recreate-sandbox.md). Two things to know: `sbx rm agent-vm` deletes the VM's clone and every rule scoped to it (that is why the allowlist is global), and `sandbox/kit` counts to `sbx` as a third-party kit, so `/login` works only with the credential binding the runbook writes ([credential bindings](https://docs.docker.com/ai/sandboxes/configuration/credentials/#credential-bindings)). Settings in force: `ssh.agentForwardingEnabled` false, `claude.remoteControl` true.

### Allow a new host
When an agent asks in a `human-task` issue and you agree: [`allow-sandbox-host.md`](runbooks/allow-sandbox-host.md). The agent adds the row to the allowlist in `docs/agents/sandbox.md` the same day.

### Lend a Cloudflare ops token to the sandbox
For tasks that call the Cloudflare API (T14, T15, T17): a one-day token with the scopes listed per task in the runbook. The proxy injects it for `api.cloudflare.com`; the agent sees only a placeholder. [`lend-cloudflare-token.md`](runbooks/lend-cloudflare-token.md).

### Take back a Cloudflare ops token
At the end of that task, the same day: [`take-back-cloudflare-token.md`](runbooks/take-back-cloudflare-token.md).

### Upgrade `sbx`
Monthly, when the release notes show a new version (`sbx` is early access): [`upgrade-sbx.md`](runbooks/upgrade-sbx.md). Reply with the version so `docs/infra-current-state.md` is updated.

## Keys and tokens

- **App key sets** (ADR-0015): each set is an implementer and a reviewer App with their keys: `machine` (owned by the machine account) and a fallback owned by `januswtlin`. All sets live in your account, `~/.config/januslin-keys/sets/`; the `agent` account holds only the active one. `januslin-keys use <set>` switches within a minute, `januslin-keys off` stops every token, `januslin-keys add <set>` adds a set or rotates its keys: [`app-key-sets.md`](runbooks/app-key-sets.md).
- **The token broker** (`scripts/token-broker.sh start|stop|once|status` in `agent-session`) mints the one-hour tokens the sandbox uses. It runs only while the sandbox is in use, from the host clone on `main`; `scripts/sandbox-session.sh start|restart|stop` starts and stops it together with the sandbox ([`start-coordinator.md`](runbooks/start-coordinator.md)). It is never a cron job or LaunchAgent: started by you, it refreshes nothing while no session runs, and the last tokens expire within the hour (stopping it revokes nothing).

## Tool logins

- **Claude Code** in the sandbox: a full claude.ai login (`/login` in `sbx run --name agent-vm`), needing the credential binding above. claude.ai's GitHub connection is the machine account; its connectors: GitHub only (a few claude.ai built-in servers such as "Claude Docs" are listed but not connected and cannot be removed; `.claude/settings.json` denies their tools). To end it: `/logout` in the sandbox, or remove the `anthropic` secret in `agent-session` (`sbx reset` removes every sandbox secret), and sign out its sessions at claude.ai → Settings.
- **Claude Code cloud** environment `januslin.me`: network access Limited, no variables or secrets, a setup script that installs dependencies once a lockfile exists: [`claude-cloud-environment.md`](runbooks/claude-cloud-environment.md).
  Only you start cloud sessions and scheduled tasks.
- Local agents act on GitHub only through the Apps, whatever the tool login can reach.

## Host managed settings

A root-owned file, `/Library/Application Support/ClaudeCode/managed-settings.json`, applies to every macOS account on the Mac, yours included, but not inside the sandbox. It is a backstop against running Claude Code on the host by mistake: it disables claude.ai connectors, Remote Control, and bypass-permissions mode, and denies the cron and scheduled-task tools. Content and installation: [`install-managed-settings.md`](runbooks/install-managed-settings.md). As `agent`, `touch` on the file must fail.

Verified with Claude Code 2.1.312: `disableBypassPermissionsMode: "disable"` blocks `--permission-mode bypassPermissions` and `--dangerously-skip-permissions`, interactively and with `-p`; the connector deny leaves `/mcp` empty; the cron tools are unavailable. No managed key blocks cloud sessions per device; only you starting them is the rule (ADR-0009). Re-check these after a major Claude Code upgrade.

## Mobile publishing: Working Copy on a new device

When mobile publishing is first needed, then per device: an SSH key generated on the device, added as a deploy key with write access to this repository only (never an account key, never a GitHub login inside Working Copy). [`working-copy-device.md`](runbooks/working-copy-device.md). The first time, tell the coordinator so it records V12 with you.

## Recurring

The calendar is in `docs/operations.md`. Items that need you arrive as `human-task` issues about a month before they are due.
- **Interaction limit**, every six months; GitHub offers no permanent option: [`renew-interaction-limit.md`](runbooks/renew-interaction-limit.md).
- **Quarterly security review:** the checks only you can run: [`quarterly-host-checks.md`](runbooks/quarterly-host-checks.md).
- **Deploy token and Access service token** rotation before expiry, once they exist: the runbooks T14 and T15 add.

## Lost device

Revoke everything the device could use: deploy keys and sessions for a phone; for the laptop also both GitHub accounts' sessions and tokens, the claude.ai login, both App keys, the sandbox secrets, and the Docker session. [`lost-device.md`](runbooks/lost-device.md).

## Planned changes

- **Codex** (T06, [#56](https://github.com/januswtlin/januslin.me/issues/56)): ChatGPT's GitHub connection as the machine account, your ChatGPT login through `sbx`, and a saved sandbox template ([`connect-chatgpt-github.md`](runbooks/connect-chatgpt-github.md), [`codex-login.md`](runbooks/codex-login.md), [`save-sandbox-template.md`](runbooks/save-sandbox-template.md)). T06 then updates [`recreate-sandbox.md`](runbooks/recreate-sandbox.md) and [`lost-device.md`](runbooks/lost-device.md).
- **Cloudflare** (T14, T15, [#60](https://github.com/januswtlin/januslin.me/issues/60), [#62](https://github.com/januswtlin/januslin.me/issues/62)): the deploy token in the `production` and `preview` environments and the Access service token `ci-smoke-test` in `smoke`, with their expiry dates in the calendar ([`enable-zero-trust.md`](runbooks/enable-zero-trust.md), [`store-deploy-token.md`](runbooks/store-deploy-token.md), [`store-smoke-token.md`](runbooks/store-smoke-token.md)).
- **Renovate** (T19, [#68](https://github.com/januswtlin/januslin.me/issues/68)): you merge its PRs; a monthly workflow raises the calendar items as issues.
- **Scheduled tasks** (T20, [#69](https://github.com/januswtlin/januslin.me/issues/69)): created in your claude.ai account from the table T20 provides.
