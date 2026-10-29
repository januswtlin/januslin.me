# The local AI sandbox

Last reviewed: 2026-10-29 · Decision: ADR-0013

How local AI runs: macOS (the author's Mac) → the standard macOS account `agent` (keys, broker, `sbx`, no AI) → one Docker Sandbox microVM `januslin` (Claude Code, Codex, the coordinator and its subagents, `pnpm verify`). T03 builds and verifies it; until then this is the target design, and every claim not yet tested is an open verification in `docs/infra-current-state.md` (V15 to V30).

## Layers

| Layer | Holds | Runs | Can reach |
|---|---|---|---|
| The author's macOS account | Own GitHub login, SSH keys, Keychain | The author's tools | Everything the author can |
| macOS account `agent` (host) | `januslin-agent.pem`, `januslin-reviewer.pem`, the Slack bot token, `sbx` and its Keychain secrets, the token broker | `sbx`, `scripts/token-broker.sh`, `git` for the host clone. **Never an AI tool.** | GitHub as the Apps (through the broker), Docker login |
| Sandbox `januslin` (microVM, Linux) | A private clone of the repository; the one-hour reviewer token and the non-secret coordinator config in read-only directories; never a key, and never the implementer token (except in the V17/V18 fallback) | Claude Code, Codex, the coordinator and subagents, `pnpm`, Playwright | Only the hosts on the allowlist below; credentials injected by the host proxy |

The sandbox never sees a `.pem`, the author's files, or the `agent` account's home outside its mounts. The host runs only reviewed code from `main` (the broker and the other host scripts are CODEOWNERS paths, `.github/CODEOWNERS`), never a branch the sandbox pushed.

## Starting it

In `agent-session` (the host shell of the `agent` account; `docs/agents/local-agent-account.md`):

```
scripts/token-broker.sh start            # mints januslin-agent and januslin-reviewer tokens now and every 50 minutes
sbx create --clone --name januslin claude ~/januslin.me ~/.local/state/januslin-agent/sandbox-tokens:ro ~/.config/januslin-agent/sandbox-config:ro
sbx run --name januslin                  # Claude Code in auto mode (see "Permissions inside the VM")
```

- `sbx create` runs once; later sessions only need `sbx run --name januslin`. To re-create the sandbox from the saved template (T06-H7): `sbx create -t januslin:codex-<date> --clone --name januslin claude ~/januslin.me ~/.local/state/januslin-agent/sandbox-tokens:ro ~/.config/januslin-agent/sandbox-config:ro` (the docs show `-t` with `sbx run`; V28 confirms it with `create`), then re-run the T03 canary. Removing the sandbox (`sbx rm januslin`) deletes its clone, so every branch must be pushed first.
- Inside the VM, the clone's `origin` is set to `https://github.com/januswtlin/januslin.me.git` (T03 records the exact step), so branches are pushed to GitHub, not only to the host's `sandbox-januslin` remote.
- Codex runs in the same sandbox: T06 installs the Codex CLI into `januslin` and the author saves the result with `sbx template save` ("Codex in the sandbox" below).
- Stop with `sbx stop januslin`. The broker keeps running only while the sandbox is in use (`scripts/token-broker.sh stop`).

## Credentials

| Credential | Where it lives | How the sandbox uses it |
|---|---|---|
| `januslin-agent` installation token | Minted by the broker into `/Users/Agent/.local/state/januslin-agent/proxy-tokens/januslin-agent.token`, a directory that is **not** mounted into the sandbox | Preferred: `sbx secret set github --sandbox januslin --refresh on-demand --command 'sed -n 1p /Users/Agent/.local/state/januslin-agent/proxy-tokens/januslin-agent.token'` (`--refresh on-demand` re-reads the file on each use; without it the proxy caches the value for 55 minutes, longer than the token may live); `git` and `gh` see only a placeholder (V17). Fallback (only if V17 or V18 fails): the broker writes it into the mounted `sandbox-tokens/` instead, where `scripts/agent-gh` and the credential helper read it |
| `januslin-reviewer` token | `sandbox-tokens/januslin-reviewer.token` (mounted read-only) | Read-only mount; `scripts/agent-gh januslin-reviewer` passes it to one `gh` process (V18) |
| Claude subscription login | `/login` inside the sandbox. The docs do not say where the resulting credential is kept; on Linux it is probably in the VM's `~/.claude`, readable by the agent (V24) | If readable in the VM, the claude.ai login (connectors, chat history) could be copied out over an allowed host; the author accepts this ("Permissions inside the VM") |
| Codex ChatGPT login | `sbx secret set openai --oauth`, on the host, in the `agent` account's Keychain (V22) | Injected by the proxy |
| Slack bot token | `/Users/Agent/.config/januslin-agent/slack-bot-token` on the host | The author runs `sbx secret set-custom --sandbox januslin --host slack.com --env SLACK_BOT_TOKEN --command 'cat /Users/Agent/.config/januslin-agent/slack-bot-token'` (T04-H2, V23). Fallback: the author copies the token into `/Users/Agent/.config/januslin-agent/sandbox-config/` (read-only in the VM) |
| Cloudflare ops token (T14, T15, T17 only) | Written by the author into `/Users/Agent/.local/state/januslin-agent/cloudflare-ops.token` on the host | The author runs `sbx secret set-custom --sandbox januslin --host api.cloudflare.com --env CLOUDFLARE_API_TOKEN --command 'cat /Users/Agent/.local/state/januslin-agent/cloudflare-ops.token'` and `sbx policy allow network --sandbox januslin api.cloudflare.com` at the start (T14-H1), and removes both at the end (T14-H3). V25: wrangler works with the placeholder |

The App keys are never mounted, and the token-only directory never holds a key. `sbx secret set --command` stores the command, not the value, and the daemon replays it from a fresh temporary directory on the host, so commands use absolute paths; the command only reads a file, so no secret appears in its text. The agent inside the VM cannot run `sbx`; every `sbx secret` and `sbx policy` change is the author's, in `agent-session`.

**What an agent can still leak.** Anything readable in the VM (the one-hour reviewer token, the Claude login if V24 finds it there) can be sent out over an allowed host: pushed to a public branch, posted in an issue or on Slack. A pushed branch workflow is a second way out: it runs networked code on GitHub's runners, outside this allowlist (with no secrets; `docs/security.md`). The limits are the one-hour token lifetime, GitHub secret scanning with push protection, and the Write ceiling of each identity; no key and no long-lived GitHub credential is ever readable.

## Egress allowlist

Policy: `sbx policy init deny-all`, then these rules with `--sandbox januslin`. Kits for Claude Code and Codex may add their own provider rules; T03 lists what `sbx policy ls januslin --wide` shows and keeps this table equal to it.

| Host | Why |
|---|---|
| `github.com`, `api.github.com`, `codeload.github.com`, `objects.githubusercontent.com`, `raw.githubusercontent.com` | Git, `gh`, release assets, the Retypeset upstream check |
| `registry.npmjs.org` | `pnpm install`, Corepack's pnpm download |
| `cdn.playwright.dev`, `playwright.download.prss.microsoft.com` | `pnpm exec playwright install chromium` (Mermaid at build time, tests) |
| Anthropic hosts added by the Claude Code kit, plus any Remote Control needs (V21) | Claude Code and Remote Control |
| OpenAI hosts added by the Codex kit | Codex |
| `slack.com` | `scripts/coordinator-channel.sh` |
| `api.cloudflare.com` | Only during T14, T15, T17; the author adds the rule at the start (T14-H1) and removes it at the end (T14-H3) |

`WRANGLER_SEND_METRICS=false` and `ASTRO_TELEMETRY_DISABLED=1` are set in the sandbox so no telemetry host is needed.

### Adding a host
1. The agent reports the blocked host (`sbx policy approval ls` on the host shows it) and why it is needed, through the coordinator.
2. The author decides. If yes, in `agent-session`: `sbx policy allow network --sandbox januslin <host>`.
3. The same day, a docs PR adds the row to the table above. A rule without a row is a finding in the quarterly review.

Never use `allow-all` or `**`.

## Permissions inside the VM

**Claude Code runs in auto mode, not bypass mode** (decided by the author, 2026-10-30). Anthropic's [permission modes](https://code.claude.com/docs/en/permission-modes) doc says bypass mode "offers no protection against prompt injection or unintended actions" and is meant for isolated environments "without internet access". This VM has allowlisted internet, and what matters most is on GitHub, reachable through the proxy-injected token, which the VM boundary does not protect. Auto mode runs a classifier on every action, subagents included; by default it blocks, among others, sending sensitive data to external endpoints, force pushes, `git reset --hard` and similar, downloading and running code, and printing a live credential.

How it is set: the sandbox templates launch `claude --dangerously-skip-permissions` by default, so T03 must replace that launch. The likely route is a kit entrypoint (`sandbox.entrypoint: [claude, "--permission-mode", "auto"]`, the form the kit docs show for another mode). The alternative to test is `permissions.disableBypassPermissionsMode: "disable"` with `permissions.defaultMode: "auto"` in Claude Code's Linux managed settings (`/etc/claude-code/managed-settings.json`); whether the bypass flag then falls back to auto or the session refuses to start is not documented (CLI flags take precedence over `defaultMode`). V26 records which works. Inside the VM the agent is root, so these settings are defaults, not a control against a determined agent; the classifier is the check against injected instructions.

Behavior to know:
- After 3 consecutive or 20 total blocks, auto mode pauses and asks. In the interactive coordinator session that means the loop waits until someone answers; the author can answer through Remote Control. A `Notification` hook posts a Slack message when Claude Code waits for input (T05), so the author learns about it. V27 records how this goes in long unattended runs.
- Subagents (implementers and reviewers started with the Agent tool) are checked by the same classifier before they start, while they run, and when they finish; a block inside a subagent surfaces in the coordinator's session and counts toward the pause. Implementers report blocked actions in their handoff.
- Blocked actions are listed in `/permissions` → Recently denied.

**Codex:** `codex exec --sandbox workspace-write --approve-for-me` (and in config, `approval_policy = "on-request"`, `approvals_reviewer = "auto_review"`, `[sandbox_workspace_write] network_access = true`), not `--dangerously-bypass-approvals-and-sandbox`. Codex's own sandbox keeps edits to the workspace and asks before leaving it; automatic review routes those requests through a reviewer agent that "checks for data exfiltration, credential probing, persistent security weakening" and fails closed ([approvals and security](https://learn.chatgpt.com/docs/agent-approvals-security), [non-interactive mode](https://learn.chatgpt.com/docs/non-interactive-mode)). Network inside Codex's sandbox is on because `sbx` already limits egress to the allowlist. V29 checks that Codex's Linux sandbox and automatic review work inside the microVM; Under `workspace-write`, `.git` is read-only, so every commit and push escalates to automatic review; V29 includes them. If the Codex sandbox cannot run in the VM, the only fallback is `--sandbox danger-full-access`, where almost nothing escalates, so automatic review would check nearly nothing: that fallback is an author decision, asked in T06.

Codex's actions are not seen by Claude's classifier: auto mode sees only the `codex exec ...` command the coordinator runs (and might block it, V30). Inside a Codex run, only Codex's sandbox and automatic review check its actions.

The repository's `.claude/settings.json` denies the claude.ai connector tools and the cron and scheduled-task tools as defaults, and the Codex project config does the same where it can.

**Claude login readable in the VM (decided, 2026-10-30):** if V24 finds the `/login` credential readable inside the VM, the author accepts it. Reasons: connectors that hold personal data are removed (T05-H1), egress is allowlisted, and Remote Control needs the full login. T05 records V24's result next to this decision.

**Workflows permission on every implementer token (decided, 2026-10-30):** every `januslin-agent` token keeps Workflows write (option A), and before merging, the coordinator and the author confirm `ci` from the `ci.yml` run for the exact head commit. **Trigger to change:** T16 tests whether a workflow pushed to another branch can post a passing check or status named `ci` on a PR's head commit. If it can, switch to option B in a follow-up PR: the broker mints the everyday token without `workflows`, and the author enables it for a workflow task with one host command (`scripts/token-broker.sh workflows on|off`). The result and the switch are recorded in ADR-0009.

## Codex in the sandbox

The coordinator (Claude Code) dispatches tasks to Codex inside the same VM (T06):
- **Runtime:** the Codex CLI is installed in the `januslin` sandbox (from the Claude template), and the author saves it with `sbx template save` so a re-created sandbox keeps it. A saved template captures the whole container filesystem, including anything stored in it and anything the root agent changed (`/etc` settings, binaries, git config), so it is not a clean slate: save only right after a reviewed install, keep it in the local image store (never push it to a registry), and re-check the canary after re-creating. User-level config under `/home/agent` (the Claude `Notification` hook, `~/.codex`) may not survive; V28 checks, and anything that must survive lives in the repository or in `/etc`. This needs no Docker Desktop: building a custom template with a Dockerfile does ([kits v2](https://docs.docker.com/ai/sandboxes/customize/kits-v2/)), saving a configured sandbox does not ([usage](https://docs.docker.com/ai/sandboxes/usage/)). Codex's ChatGPT login is the host-side `sbx secret set openai --oauth` (the docs do not show `--oauth` with `--sandbox`; V22 records whether scoping works) (V28: Codex in a Claude-template sandbox uses the injected credential).
- **Mechanism:** `codex exec` with `--json`, `--output-schema` for the result, `-o` for the final message, and `codex exec resume <SESSION_ID>` for review fixes in the same session. The official `codex-plugin-cc` plugin (`/codex:rescue`, `/codex:status`, `/codex:result`, background jobs) wraps the same CLI but is built for a person at the keyboard and does not document sandbox or approval flags, so the loop uses `codex exec`; the plugin may be used ad hoc.
- **Fallback** if V28 or V29 fails: a host-side launcher (`scripts/codex-launch.sh`, a CODEOWNERS path, run from `main` only) runs Codex in a second sandbox from the `codex` template, which needs its own `github` secret and network policy. It is fed through a narrow read-write dispatch directory that it treats as data: it accepts only file names that match a task-ID pattern, never follows symlinks, never writes into that directory, and builds the prompt itself. T06 records which one is in use.

## Tests in the sandbox

`pnpm verify`, Playwright, and visual snapshots run on Linux in the VM, the same platform as CI, so one set of baselines serves both. Dev servers started by agents bind inside the VM; publish a port with `sbx ports januslin --publish <port>` only when the author asks to see something.

## Checks

The canary and the other verifications are in T03. The quarterly review (`docs/operations.md`) re-runs the canary and compares `sbx policy ls januslin` with the table above.
