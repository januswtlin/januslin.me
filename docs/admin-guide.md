# Admin guide

Last reviewed: 2026-10-31

For the author, the only human in this project: everything done by hand, in one place. Agents do everything else (`docs/automation.md`, "Who does what"). Steps that belong to a task arrive as `human-task` issues assigned to you; they link here for procedures shared by several issues. Why things are this way: the ADRs (ADR-0009, ADR-0013, ADR-0014).

## Your queue

- **What needs you:** open issues assigned to you (`is:open assignee:januswtlin`) and PRs that request your review. Both reach the phone through GitHub Mobile: Profile → Settings → Notifications, push on for **Assigned**, **Review requested**, and **Mentioned**.
- **A human task:** read Why and Steps, do them in the place named under Where, comment with what "Reply with" asks, and close the issue. The agent checks "Done when"; if it reopens the issue, its comment says what is missing. Never put a secret, a token, or private data in an issue or comment (the repository is public); tell private data such as an email address to the coordinator in the session.
- **Approving a task:** read the task issue and add the `approved` label. The coordinator starts only tasks you approved, and only if nobody but you edited them since. If an agent changes an approved spec, approve again (remove and add the label).
- **Ordering:** drag the sub-issues of the plan issue [#11](https://github.com/januswtlin/januslin.me/issues/11).
- **Merging a PR:** read the final diff, open the `ci` run link the coordinator gives (it must be the `ci.yml` run for the PR's head commit, once CI exists), then merge with "Merge without waiting for requirements to be met (bypass rules)". The `main-restrict-updates` ruleset blocks every update except yours, so the merge box always says "Merging is blocked" until you choose the bypass; `main-protect` still applies.
- **Before you run a command from an issue:** issue bodies and comments can be edited by any Write identity (the agents included), and GitHub marks edits with "edited" (click it for the history). Run a command only if it is in the issue body or in a comment by an agent identity (`januslin-agent[bot]` or the machine account) that nobody else edited since. Commands for `agent-session` or for your admin `gh` must also match a procedure in this guide on `main`, or appear in a reviewed PR (the task's PR); read-only listings (`ls`, `sbx secret ls`, `gh secret list`) are fine. Anything else: ask for it in a PR first.
- **Instructions:** what you type in the coordinator's session or send through Remote Control, and your own comments, labels, and closes on GitHub. A comment of yours that someone else edited no longer counts as yours.
- **`needs-human`:** answer in the PR or issue thread.

## What you administer

| What | Where | Notes |
|---|---|---|
| GitHub `januswtlin` (id 2433928) | Your browser, GitHub Mobile, your own `gh` | Owner, admin. The only identity that merges. Passkey or 2FA |
| Machine account `januslin-agent` (id 349746030) | A separate browser profile, only on your Mac | Write collaborator; owns the two Apps; claude.ai's GitHub connection. No SSH keys, PATs, or OAuth apps |
| Apps `januslin-agent`, `januslin-reviewer` | Owned by the machine account, installed by `januswtlin` on this repository only | Keys in the `agent` macOS account |
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
| App keys (`januslin-agent.pem`, `januslin-reviewer.pem`) | `~/.config/januslin-agent/` | dir `0700`, files `0600` |
| Token directory mounted into the sandbox | `~/.local/state/januslin-agent/sandbox-tokens/` (`januslin-agent.token`, `januslin-reviewer.token`), written only by the broker; never a key | dir `0700`, files `0600` |
| Config directory mounted into the sandbox | `~/.config/januslin-agent/sandbox-config/`, empty | dir `0700` |
| Broker state | `~/.local/state/januslin-agent/broker/`: `broker.pid`, `broker.log` (times and errors, never tokens), short-lived staging directories | dir `0700` |
| `sbx` login and secrets | The dedicated keychain `~/Library/Keychains/sbx.keychain-db`, the account's default and only keychain; its password is in your password manager. The account has no login keychain because it is never logged in at the desktop | keychain |
| `sbx` credential bindings | `~/.config/sbx/credentials.yaml` (approvals only, no secret) | `0600` |

### Shell aliases
In your own `~/.zshrc` (not in the repository):

```
alias agent-session='sudo -iu agent env GIT_TERMINAL_PROMPT=0 sh -c '\''cd ~/januslin.me && exec zsh -l'\'''
alias agent-end='sudo pkill -u Agent'
```

`agent-session` is a host shell for `sbx` and the broker only. `GIT_TERMINAL_PROMPT=0` makes `git` fail fast instead of prompting. Never run `pnpm install`, scripts, hooks, or editor tasks from an agent's working tree, in either account.

### After a restart of the Mac
Unlock the `sbx` keychain once in `agent-session` before using `sbx`:

```
security unlock-keychain ~/Library/Keychains/sbx.keychain-db
```

Without it, `sbx login` shows a macOS "Keychain Not Found" dialog: cancel it, never "Reset To Defaults" (which acts in your desktop session). The keychain was made with `security create-keychain`, set as the default and only keychain with `security list-keychains -d user -s …` and `security default-keychain -d user -s …`, and set to stay unlocked with `security set-keychain-settings` (no timeout).

### The host clone
The host clone is the source for the sandbox and the place the broker runs from. It only fast-forwards `main`, never fetches `sandbox-januslin` or checks out an agent branch, and has no git hooks, because code here runs next to the keys. To re-create it in `agent-session`:

```
git clone https://github.com/januswtlin/januslin.me.git ~/januslin.me
cd ~/januslin.me
git config --local credential.helper ''
git config --local --add credential.helper "!$HOME/januslin.me/scripts/agent-git-credential"
git config --local credential.useHttpPath true
git config --local user.name 'januslin-agent[bot]'
git config --local user.email '349177542+januslin-agent[bot]@users.noreply.github.com'
```

The empty `credential.helper` resets the list first (the system gitconfig sets `osxkeychain`); `useHttpPath` makes the helper answer only for `januswtlin/januslin.me`. `core.hooksPath` stays unset on the host.

## Start the coordinator

The coordinator is the long-running Claude Code session that runs the task loop (`docs/agents/workflow.md`, "Coordinator loop"). It runs only inside the sandbox; Claude Code is not installed on the host, so never run `claude` in `agent-session`.

1. In your own Terminal: `agent-session`.
2. Only after a restart of the Mac: unlock the keychain (above).
3. Update the host clone: `cd ~/januslin.me && git checkout main && git fetch origin && git merge --ff-only origin/main`.
4. Start the token broker: `scripts/token-broker.sh start`, then `scripts/token-broker.sh status` (both Apps about an hour ahead).
5. In a second Terminal, in your own account, keep the Mac awake: `caffeinate -ims` (Ctrl-C when you stop). The coordinator cannot do this from the VM.
6. Back in `agent-session`: `sbx run --name januslin`. The status line must say `auto mode on`.
7. Paste the coordinator prompt verbatim from [`docs/agents/workflow.md`](agents/workflow.md#coordinator-loop-adr-0010).
8. To follow it from the phone: type `/remote-control` and open the link.

To stop: tell it to stop, `/exit`, then in `agent-session` run `sbx stop januslin` and `scripts/token-broker.sh stop`, leave it, and run `agent-end` in your own Terminal. Ctrl-C the `caffeinate`. A new coordinator started the same way resumes from GitHub.

## The sandbox

How it works: `docs/agents/sandbox.md`. Only you change it, from `agent-session`; the agent in the VM cannot run `sbx`.

### Create or re-create it
1. The credential bindings file must approve Claude Code's OAuth for the kit. To `sbx`, `sandbox/kit` is a third-party kit, and a third-party kit that extends a built-in agent may use the inherited credentials only with an approved binding ([credential bindings](https://docs.docker.com/ai/sandboxes/configuration/credentials/#credential-bindings)); without it `/login` fails with `proxy: OAuth refresh denied (no authorizing binding)`. The command refuses to overwrite an existing file; then add the `anthropic` entry by hand under `bindings:`.
   ```
   f=~/.config/sbx/credentials.yaml; if [ -e "$f" ]; then echo "$f exists: merge by hand"; else mkdir -p ~/.config/sbx && ( umask 077; cat > "$f" <<'EOF'
   bindings:
     anthropic:
       oauth:
         domains: [platform.claude.com, api.anthropic.com]
   EOF
   ); fi
   ```
   If `sbx` later asks to approve more domains for `anthropic`, approve only Claude's hosts and update this block.
2. Push every branch first: `sbx rm januslin` deletes the VM's clone and every policy rule scoped to it (the allowlist is global for that reason).
3. Create it from the kit:
   ```
   sbx create --clone --name januslin ./sandbox/kit ~/januslin.me ~/.local/state/januslin-agent/sandbox-tokens:ro ~/.config/januslin-agent/sandbox-config:ro
   ```
   Creation needs the allowlist in `docs/agents/sandbox.md`.
4. `sbx run --name januslin`, then `/login` with your claude.ai account. The tokens stay in `sbx`'s secret store on the host.
5. Ask an agent to re-run the canary (no key or host file outside the read-only mounts is readable from the VM) and record the result.

Settings in force: `sbx settings get ssh.agentForwardingEnabled` is `false`; `claude.remoteControl` is `true` (set with `sbx settings set claude.remoteControl true`).

### Allow a new host
When an agent asks in a `human-task` issue: decide; if yes, `sbx policy allow network <host>:443` (narrower with `--method` and `--path` where possible). The agent adds the row to the allowlist in `docs/agents/sandbox.md` the same day. Never `allow-all` or `**`.

### Lend a Cloudflare ops token to the sandbox
For tasks that call the Cloudflare API (T14, T15, T17). The agent's issue gives the scopes.
1. Cloudflare dashboard → My Profile → API Tokens → Create token → Custom: the scopes from the issue, TTL one day, client IP filter off. Copy it.
2. In your own Terminal (paste, then Enter; nothing is echoed):
   ```
   sudo -u Agent sh -c 'umask 077; read -rs T; printf %s "$T" > /Users/Agent/.local/state/januslin-agent/cloudflare-ops.token'
   ```
3. In `agent-session`:
   ```
   sbx secret set-custom --sandbox januslin --host api.cloudflare.com --env CLOUDFLARE_API_TOKEN --command 'cat /Users/Agent/.local/state/januslin-agent/cloudflare-ops.token'
   sbx policy allow network --sandbox januslin api.cloudflare.com
   ```
   `sbx secret set --command` stores the command, not the value, and replays it from a temporary directory on the host, so the path is absolute. The proxy injects the token; the agent sees only a placeholder.

### Take back a Cloudflare ops token
1. Cloudflare dashboard → My Profile → API Tokens → delete the token.
2. In your own Terminal: `sudo -u Agent rm -f /Users/Agent/.local/state/januslin-agent/cloudflare-ops.token`.
3. In `agent-session`: `sbx secret ls --sandbox januslin` shows the custom secret's name; remove it with `sbx secret rm` (check the syntax with `sbx secret rm --help`). Then `sbx policy rm network --sandbox januslin --resource api.cloudflare.com`.

### Upgrade `sbx`
Monthly, when the release notes show a new version: `brew upgrade docker/tap/sbx` in your own account, then ask an agent to re-run the sandbox checks the release touches (canary, allowlist, login). Record the version in `docs/infra-current-state.md`.

## Keys and tokens

### Hand a key to the `agent` account
As that user, so it is never readable by anyone else:

```
cd /
sudo -u Agent sh -c 'umask 077; mkdir -p /Users/Agent/.config/januslin-agent'
sudo -u Agent sh -c 'umask 077; cat > /Users/Agent/.config/januslin-agent/<app>.pem' < <downloaded file>
```

Then delete the downloaded file. `cd /` avoids `getcwd` warnings from `sudo` when your current directory is your own home, which `Agent` cannot enter.

### Check key fingerprints
Prints a public fingerprint, never the key; compare with the App's settings page. In `agent-session`:

```
for a in januslin-agent januslin-reviewer; do printf '%s SHA256:' "$a"; openssl rsa -in ~/.config/januslin-agent/$a.pem -pubout -outform DER 2>/dev/null | openssl dgst -sha256 -binary | openssl base64 -A; echo; done
```

### Rotate the App keys
For each of `januslin-agent` and `januslin-reviewer`, signed in as the machine account `januslin-agent` (the owner):
1. GitHub → Settings → Developer settings → GitHub Apps → the App → Private keys: generate a new key. Hand it to the `agent` account (above). Delete the downloaded file.
2. In `agent-session`, `scripts/agent-token.sh <app>` confirms the new key mints a token and prints the permissions GitHub granted (compare with ADR-0009). Revoke that test token with `scripts/agent-token.sh --revoke <app>`.
3. Only then delete the old key on the same page, so the App always has a working key.
4. Check fingerprints (above): the file matches the one key left on the page.

### The token broker
`scripts/token-broker.sh start|stop|once|status` in `agent-session`. It runs only while the sandbox is in use, from the host clone on `main`.

## Tool logins

- **Claude Code** in the sandbox: a full claude.ai login (`/login` in `sbx run --name januslin`), needing the credential binding above. claude.ai's GitHub connection is the machine account; its connectors: GitHub only (a few claude.ai built-in servers such as "Claude Docs" are listed but not connected and cannot be removed; `.claude/settings.json` denies their tools). To end it: `/logout` in the sandbox, or remove the `anthropic` secret in `agent-session` (`sbx reset` removes every sandbox secret), and sign out its sessions at claude.ai → Settings.
- **Claude Code cloud** environment `januslin.me` (claude.ai → Claude Code → Environments, in the browser profile whose claude.ai GitHub connection is `januslin-agent`): network access **Limited** (the dialog offers only None, Limited, and Full; Full needs a decision), no environment variables, no secrets, and this setup script:
  ```
  #!/bin/bash
  set -euo pipefail
  if [ -f pnpm-lock.yaml ]; then
    corepack enable
    pnpm install --frozen-lockfile
  fi
  ```
  Only you start cloud sessions and scheduled tasks.
- Local agents act on GitHub only through the Apps, whatever the tool login can reach.

## Host managed settings

A root-owned file, `/Library/Application Support/ClaudeCode/managed-settings.json` (`root:wheel`, `0644`), applies to every macOS account on the Mac, yours included, but not inside the sandbox. It is a backstop against running Claude Code on the host by mistake:

```json
{
  "disableClaudeAiConnectors": true,
  "disableRemoteControl": true,
  "permissions": {
    "disableBypassPermissionsMode": "disable",
    "deny": ["mcp__claude_ai_*", "CronCreate", "CronList", "CronDelete", "RemoteTrigger"]
  },
  "env": { "CLAUDE_CODE_DISABLE_CRON": "1" }
}
```

To change it, install a reviewed copy:

```
sudo tee "/Library/Application Support/ClaudeCode/managed-settings.json" < <reviewed-copy>.json >/dev/null
sudo chown root:wheel "/Library/Application Support/ClaudeCode/managed-settings.json"
sudo chmod 644 "/Library/Application Support/ClaudeCode/managed-settings.json"
```

As `agent`, `touch` on the file must fail.

Verified with Claude Code 2.1.312: `disableBypassPermissionsMode: "disable"` blocks `--permission-mode bypassPermissions` and `--dangerously-skip-permissions`, interactively and with `-p`; the connector deny leaves `/mcp` empty; the cron tools are unavailable. No managed key blocks cloud sessions per device; only you starting them is the rule (ADR-0009). Re-check these after a major Claude Code upgrade.

## Mobile publishing: Working Copy on a new device

About 15 minutes per device, when mobile publishing is first needed.
1. In Working Copy: Settings → SSH Keys → generate a new key. Add a repository by cloning `git@github.com:januswtlin/januslin.me.git` (the SSH URL; a deploy key does not work over HTTPS) and pick that key. Never connect a GitHub account inside Working Copy.
2. Copy the public key. On GitHub as `januswtlin`: repository Settings → Deploy keys → Add deploy key, title `working-copy-<device>-<yyyy-mm>`, "Allow write access" on. Never add it as an account SSH key.
3. Sign in to GitHub Mobile as `januswtlin`. Turn the device lock on. Install the photo Shortcut (`docs/authoring-guide.md`).
4. The first time, tell the coordinator "Working Copy set up" so it can record V12 with you (a test push of a branch, and a refused push to `main`).

## Recurring

The calendar is in `docs/operations.md`. Items that need you arrive as `human-task` issues about a month before they are due.
- **Renew the interaction limit** (every six months): repository Settings → Moderation options → Interaction limits → "Limit to repository collaborators", six months. Comment the new expiry on the issue. GitHub offers no permanent option.
- **Rotate the deploy token and the Access service token** before they expire (once they exist): create the new one with the same scopes, replace the environment secret, revoke the old one.
- **Quarterly security review:** the checks only you can do are listed in `docs/operations.md` ("Quarterly security review"); the agent prepares the issue.

## Lost device

1. Phone or tablet: repository Settings → Deploy keys → delete the device's key. GitHub → Settings → Sessions: sign out its GitHub Mobile session.
2. Laptop: revoke your `gh` token and SSH keys, and sign out browser sessions (GitHub → Settings → Sessions) for both `januswtlin` and the machine account; change the machine account's password. Sign out the claude.ai login everywhere (claude.ai → Settings; this also ends Remote Control and cloud sessions). Rotate both App keys (above). In the `agent` account, `sbx reset` removes the sandbox secrets (the Claude login among them); sign out of the Docker account used by `sbx`.
3. If the device may have been unlocked: rotate the deploy token and the Access service token, once they exist.
4. Optional: Cloudflare Zero Trust → revoke the device's Access sessions.
5. Ask the coordinator to review recent pushes, PRs, issues, and Actions runs on all branches (`docs/operations.md`, "Suspicious commit or PR").

## Planned changes

- **Codex** (T06, [#14](https://github.com/januswtlin/januslin.me/issues/14)): your ChatGPT login through `sbx secret set openai --oauth` in `agent-session`; a saved sandbox template (`sbx template save`), after which re-creating the sandbox uses `sbx create -t januslin:codex-<date> --clone --name januslin ./sandbox/kit …`; ChatGPT's GitHub connection as the machine account. "Lost device" then also signs out ChatGPT.
- **Cloudflare** (T14, T15, [#18](https://github.com/januswtlin/januslin.me/issues/18), [#20](https://github.com/januswtlin/januslin.me/issues/20)): the deploy token in the `production` and `preview` environments and the Access service token `ci-smoke-test` in `smoke`, with their expiry dates in the calendar.
- **Renovate** (T19, [#26](https://github.com/januswtlin/januslin.me/issues/26)): you merge its PRs; a monthly workflow raises the calendar items as issues.
- **Scheduled tasks** (T20, [#27](https://github.com/januswtlin/januslin.me/issues/27)): created in your claude.ai account from the table T20 provides.
