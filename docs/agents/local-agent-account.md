# The `agent` macOS account (host)

Last reviewed: 2026-10-29

The host side of local agents (ADR-0009, ADR-0013): the macOS account that holds the App keys and the Slack token, runs the token broker and `sbx`, and starts the sandbox. **From T03 on, no AI tool runs in this account**; Claude Code and Codex run only inside the sandbox (`docs/agents/sandbox.md`). T01 to T03 still run their agent in this account's shell, because the sandbox does not exist yet. Procedures only; the reasoning is in the ADRs.

The account exists and was set up during the first attempt (`januswtlin/januslin.me-archive`, its T16 and T17). Sections marked **Changes in Txx** describe the target state that task builds; until then the current state is as noted.

## Account

- Standard (not admin) macOS account. Short name `Agent` (capital A), home `/Users/Agent`. Directory Services and the file system are case-insensitive, so `sudo -u agent` and `/Users/agent/...` resolve, but `sudoers` rules and `pkill -u` compare case-sensitively: use `Agent` there.
- The author's home is `chmod 700`. No folder is shared between the accounts; `/tmp` and `/Users/Shared` carry nothing between them. File Sharing and Remote Login are off.
- `sudoers`: `/etc/sudoers.d/agent-session` with `Defaults use_pty` (mode `0440`).
- No cron jobs and no LaunchAgents.

## Layout

| What | Where (in the `agent` account) | Mode |
|---|---|---|
| Repo clone | `~/januslin.me` (HTTPS remote `https://github.com/januswtlin/januslin.me.git`) | normal |
| App keys (`januslin-agent.pem`, `januslin-reviewer.pem`) | `~/.config/januslin-agent/` | dir `0700`, files `0600` |
| Slack bot token | `~/.config/januslin-agent/slack-bot-token` | `0600` |
| Coordinator channel config (channel ID, author Slack ID) | `~/.config/januslin-agent/sandbox-config/coordinator-channel.conf`, mounted read-only into the sandbox (not a secret, but kept out of the public repository) | dir `0700`, file `0600` |
| Installation tokens (T01, T02, until T03) | `~/.local/state/januslin-agent/<app>.token` (line 1 token, line 2 expiry) | dir `0700`, files `0600` |
| Proxy token directory (from T03) | `~/.local/state/januslin-agent/proxy-tokens/januslin-agent.token`, written by the broker and read only by the `github` sandbox secret's command. **Not** mounted into the sandbox | dir `0700`, files `0600` |
| Mounted token directory (from T03) | `~/.local/state/januslin-agent/sandbox-tokens/januslin-reviewer.token`, written by the broker. Never a key, never the implementer token (except in the V17/V18 fallback). Mounted read-only into the sandbox | dir `0700`, files `0600` |
| `sbx` secrets (from T03) | The `agent` account's Keychain, managed with `sbx secret` | Keychain |
| Cloudflare ops token, only during T14, T15, T17 | `~/.local/state/januslin-agent/cloudflare-ops.token` (written by the author, T14-H1; deleted at the end, T14-H3). Injected by the sandbox proxy for `api.cloudflare.com` while the task runs (`docs/agents/sandbox.md`); never copied into the sandbox | `0600` |


**Changes in T01:** the old clone of the archived repository moves to `~/januslin.me-archive` (kept read-only for reference, its credential helper removed) and a fresh clone of the new public repository takes `~/januslin.me`. **Changes in T04:** the Slack IDs move from the repository into `coordinator-channel.conf` above.

## Setting up the clone (T01)

The repository is public, so cloning needs no credential:

```
git clone https://github.com/januswtlin/januslin.me.git ~/januslin.me
cd ~/januslin.me
git config --local credential.helper ''
git config --local --add credential.helper "!$HOME/januslin.me/scripts/agent-git-credential"
git config --local credential.useHttpPath true
git config --local user.name 'januslin-agent[bot]'
git config --local user.email '349177542+januslin-agent[bot]@users.noreply.github.com'
git config --local core.hooksPath .githooks
```

- The empty `credential.helper` resets the list first (the system gitconfig sets `osxkeychain`). `useHttpPath` makes the helper answer only for `januswtlin/januslin.me`.
- `core.hooksPath .githooks` enables `prepare-commit-msg`, which adds the `Agent:` trailer. The author's own clone does not set it.
- **From T03** this host clone is only the source for the sandbox and the place the broker runs from: `core.hooksPath` is unset (T03-H3), it only fast-forwards `main`, and it never fetches `sandbox-januslin` or checks out an agent branch, because code here runs next to the keys.
- Until T02 lands the scripts in the new repository, use the copies in the archive clone (`~/januslin.me-archive/scripts/`); they restrict tokens to a repository named `januslin.me`, which is the new one after the rename.

## Opening and ending a session

Aliases in the **author's** `~/.zshrc` (not in the repo):

```
alias agent-session='sudo -iu agent env AGENT_TOOL=claude GIT_TERMINAL_PROMPT=0 sh -c '\''export CLAUDE_CODE_OAUTH_TOKEN="$(cat ~/.config/januslin-agent/claude-oauth-token)"; cd ~/januslin.me && exec zsh -l'\'''
alias agent-end='sudo pkill -u Agent'
```

- `AGENT_TOOL=claude` (or `codex`) makes `prepare-commit-msg` add the matching trailer.
- `GIT_TERMINAL_PROMPT=0` makes `git` fail fast instead of prompting if the helper returns nothing.
- **Changes in T03:** `agent-session` becomes a host shell for `sbx` and the broker only; the AI starts with `sbx run --name januslin` (`docs/agents/sandbox.md`), and `AGENT_TOOL` is set inside the sandbox. The `CLAUDE_CODE_OAUTH_TOKEN` export and the `claude-oauth-token` file go away in T03-H3, together with Claude Code on the host.
- End the session with `agent-end` (after `sbx stop januslin` and `scripts/token-broker.sh stop`). Until T03, do not leave the author's own dev servers running while a session is open; loopback is shared. From T03, agent servers live in the VM.
- The author never runs `pnpm install`, scripts, hooks, or editor tasks from the agent's working tree.

## Keys

The author hands a key to the account as that user, so it is never readable by anyone else:

```
sudo -u Agent sh -c 'umask 077; mkdir -p /Users/Agent/.config/januslin-agent'
sudo -u Agent sh -c 'umask 077; cat > /Users/Agent/.config/januslin-agent/<app>.pem' < <downloaded file>
```

Then delete the downloaded file. Keys are generated in the App settings of the machine account `januslin-agent`, which owns the Apps from T02.

## Tokens and `gh`

Scripts ported from the archive in T02 (from T03, the broker runs `agent-token.sh` on the host and the sandbox never runs it; `docs/agents/sandbox.md`):

- `scripts/agent-token.sh <januslin-agent|januslin-reviewer>` mints a one-hour installation token restricted to this repository and prints the permissions GitHub granted (compare with ADR-0009).
- `scripts/agent-token.sh --revoke <app>` revokes it and deletes the file.
- `scripts/agent-gh <app> <gh args…>` runs `gh` with that token for one process, for example `scripts/agent-gh januslin-agent pr create --draft …` or `scripts/agent-gh januslin-reviewer pr review <n> --approve`.
- Git pushes use the credential helper, which reads the `januslin-agent` token file.
- Installation tokens last one hour. Until T03, rerun `agent-token.sh` before the hour is over (`agent-gh` reports "expired"; a stale token shows up as a failed push). From T03 the broker does it.
- Never run `gh auth login` in this account, never run `scripts/agent-gh <app> auth token` (it prints the token), and never put a GitHub token in an environment variable or argv.
- `prepare-commit-msg` does not run on rebase picks; check the trailer if you ever rebase a local, unpushed branch.

## Slack control channel (ADR-0011)

Script ported in T04: `scripts/coordinator-channel.sh`.

- `post <text> [--thread <ts>]` prints the message `ts`; `react <ts>` adds `eyes`; `wait [--interval 120] [--max 14400]` prints one JSON object `{messages, merges, main_head}` and exits 0, or exits 2 after `--max` with nothing new.
- It runs inside the sandbox. The bot token stays on the host in `slack-bot-token`; the script sends the `SLACK_BOT_TOKEN` placeholder that the proxy replaces (V23), or, as the fallback, reads a copy the author put in the read-only `sandbox-config/` directory and gives it to `curl` on stdin, never argv or output. It reads the channel ID and the author's Slack ID from the mounted `coordinator-channel.conf` (`CHANNEL_ID=…`, `AUTHOR_USER_ID=…`, parsed, not sourced). The author's GitHub id (2433928) and the repository are constants in the script.
- State: `~/.local/state/januslin-agent/coordinator-channel.state` inside the VM (`0600`): last verified `main` head and last Slack check. Delete it to start fresh.
- Test by hand: `post "test"`, reply in that thread from the phone, `wait --max 300 --interval 20` prints the reply, `react <ts>` on it, `wait --max 0` exits 2.
- Rotation: api.slack.com/apps → `januslin-coordinator` → reinstall or rotate the token, then store the new one as the author did originally: `( umask 077; read -rs 'T?Slack bot token: '; printf '%s' "$T" > ~/.config/januslin-agent/slack-bot-token ); echo` in `agent-session`.

## Tool logins

- **Current (until T03):** Claude Code in this account uses `claude setup-token` only; the token sits in `~/.config/januslin-agent/claude-oauth-token` (`0600`) and the session alias exports it. Codex is not installed.
- **T03:** Claude Code is removed from this account (T03-H3), and the App keys are rotated (T03-H4).
- **T05:** a full claude.ai login inside the sandbox (`/login`; where the credential is stored is V24), Remote Control with `sbx settings set claude.remoteControl true`. The claude.ai account's GitHub identity is the machine account.
- **T06:** Codex with the author's ChatGPT login through `sbx secret set openai --oauth`, run in this account's host shell; the tokens stay in its Keychain (V22).
- Local agents still act on GitHub only through the Apps, whatever the tool login can reach.

## Claude Code managed settings

Root-owned file at `/Library/Application Support/ClaudeCode/managed-settings.json` (`root:wheel`, `0644`). It applies to every macOS account on the Mac, the author's included, but not inside the sandbox VM (ADR-0013 explains what replaces it there). From T03 it is only a backstop against running Claude Code on the host by mistake, so it stays as it is. Content:

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

To change it, the author installs a reviewed copy with `sudo`:

```
sudo tee "/Library/Application Support/ClaudeCode/managed-settings.json" < <reviewed-copy>.json >/dev/null
sudo chown root:wheel "/Library/Application Support/ClaudeCode/managed-settings.json"
sudo chmod 644 "/Library/Application Support/ClaudeCode/managed-settings.json"
```

As `agent`, `touch` on the file must fail.

Verified in the first attempt (Claude Code 2.1.312): `disableBypassPermissionsMode: "disable"` blocks `--permission-mode bypassPermissions` and `--dangerously-skip-permissions`, interactively and with `-p`; the connector deny leaves `/mcp` empty; the cron tools are unavailable. No managed key blocks cloud sessions per device; only the author starting them is the rule (ADR-0009). Re-check these after a major Claude Code upgrade.

## Checks

The quarterly review in `docs/operations.md` covers this account.
