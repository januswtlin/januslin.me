# The local AI sandbox

Last reviewed: 2026-10-30 · Decision: ADR-0013

How local AI runs: macOS (the author's Mac) → the standard macOS account `agent` (keys, broker, `sbx`, no AI) → one Docker Sandbox microVM `januslin` (Claude Code, Codex, the coordinator and its subagents, `pnpm verify`). T03 built and verified it with `sbx` v0.50.1; claims still untested are open verifications in `docs/infra-current-state.md`.

## Layers

| Layer | Holds | Runs | Can reach |
|---|---|---|---|
| The author's macOS account | Own GitHub login, SSH keys, Keychain | The author's tools | Everything the author can |
| macOS account `agent` (host) | `januslin-agent.pem`, `januslin-reviewer.pem`, the Slack bot token, `sbx` and its Keychain secrets, the token broker | `sbx`, `scripts/token-broker.sh`, `git` for the host clone. **Never an AI tool.** | GitHub as the Apps (through the broker), Docker login |
| Sandbox `januslin` (microVM, Linux) | A private clone of the repository; the one-hour tokens of both Apps and the non-secret coordinator config in read-only directories; never a key | Claude Code, Codex, the coordinator and subagents, `pnpm`, Playwright | Only the hosts on the allowlist below; credentials injected by the host proxy |

The sandbox never sees a `.pem`, the author's files, or the `agent` account's home outside its mounts. The host runs only reviewed code from `main` (the broker and the other host scripts are CODEOWNERS paths, `.github/CODEOWNERS`), never a branch the sandbox pushed.

## Starting it

In `agent-session` (the host shell of the `agent` account; `docs/agents/local-agent-account.md`), from `~/januslin.me` on `main`:

```
security unlock-keychain ~/Library/Keychains/sbx.keychain-db   # after each restart of the Mac
scripts/token-broker.sh start            # mints both Apps' tokens now, then refreshes each with under 10 minutes left
sbx run --name januslin                  # Claude Code in auto mode (see "Permissions inside the VM")
```

- The sandbox is created once, from the kit in this repository (`sandbox/kit/spec.yaml`, a CODEOWNERS path):
  ```
  sbx create --clone --name januslin ./sandbox/kit ~/januslin.me ~/.local/state/januslin-agent/sandbox-tokens:ro ~/.config/januslin-agent/sandbox-config:ro
  ```
  The kit extends the built-in `claude` agent (template `docker/sandbox-templates:claude-code-docker`) and, at creation: starts Claude Code with `--permission-mode auto`; writes the managed settings in `/etc/claude-code/`; installs Node 24 into `/opt/node24` from the official release on nodejs.org at a pinned version, checked against that release's `SHASUMS256.txt` (the template has Node 22), and enables pnpm through Node's bundled Corepack; installs Chromium's system libraries with `playwright install-deps chromium` from Ubuntu's mirror, after disabling the template's Docker and GitHub CLI apt sources (not allowed, tools already installed); sets `PATH`, `AGENT_TOOL=claude`, `JANUSLIN_AGENT_STATE_DIR`, and the telemetry switches in `/etc/sandbox-persistent.sh` (sourced by every shell through `BASH_ENV`); and sets git's `core.hooksPath` and the credential helper in the system git config. Creation needs the allowlist below.
- `sbx rm januslin` deletes its clone (push every branch first) **and every policy rule scoped to it**; that is why the allowlist is global. After re-creating, re-run the T03 canary. To re-create from the template saved in T06 (T06-H7): `sbx create -t januslin:codex-<date> --clone --name januslin ./sandbox/kit …` (V28 confirms `-t` with a kit).
- Clone mode copies the host's `origin` (`https://github.com/januswtlin/januslin.me.git`) into the VM, so branches are pushed to GitHub. The host clone gets a `sandbox-januslin` remote served by a git daemon on `127.0.0.1`; the host never fetches it.
- Docker also writes a generic agent guide into the VM (`/Users/Agent/CLAUDE.md`, loaded by Claude Code as a parent-directory `CLAUDE.md`). Its advice on GitHub tokens, `"**"` network rules, and `git add -A` conflicts with this project; `AGENTS.md` ("Identity") says which wins.
- Codex runs in the same sandbox: T06 installs the Codex CLI into `januslin` and the author saves the result with `sbx template save` ("Codex in the sandbox" below).
- Stop with `sbx stop januslin`. The broker keeps running only while the sandbox is in use (`scripts/token-broker.sh stop`).

## Credentials

| Credential | Where it lives | How the sandbox uses it |
|---|---|---|
| `januslin-agent` installation token | Minted by the broker into `/Users/Agent/.local/state/januslin-agent/sandbox-tokens/januslin-agent.token` (mounted read-only) | `scripts/agent-git-credential` (system git config in the VM) and `scripts/agent-gh januslin-agent` read it; `JANUSLIN_AGENT_STATE_DIR` points them at the mount. This is ADR-0013's fallback: the preferred `sbx secret set github --command …` worked for the implementer (V17) but the proxy then replaces **every** Authorization header to GitHub, the reviewer's included (V18 failed, 2026-10-30), so it is not used. The VM's `GH_TOKEN` is a placeholder that GitHub rejects, so plain `gh` fails; always use `scripts/agent-gh` |
| `januslin-reviewer` token | `sandbox-tokens/januslin-reviewer.token` (mounted read-only) | `scripts/agent-gh januslin-reviewer` passes it to one `gh` process (V18 passed with no `github` secret) |
| Claude subscription login | `/login` inside the sandbox. The docs do not say where the resulting credential is kept; on Linux it is probably in the VM's `~/.claude`, readable by the agent (V24) | If readable in the VM, the claude.ai login (connectors, chat history) could be copied out over an allowed host; the author accepts this ("Permissions inside the VM") |
| Codex ChatGPT login | `sbx secret set openai --oauth`, on the host, in the `agent` account's keychain (`sbx.keychain-db`; V22). `sbx` v0.50.1's help says `--oauth` is "openai/global only", so it cannot be scoped to `januslin` | Injected by the proxy |
| Slack bot token | `/Users/Agent/.config/januslin-agent/slack-bot-token` on the host | The author runs `sbx secret set-custom --sandbox januslin --host slack.com --env SLACK_BOT_TOKEN --command 'cat /Users/Agent/.config/januslin-agent/slack-bot-token'` (T04-H2, V23). Fallback: the author copies the token into `/Users/Agent/.config/januslin-agent/sandbox-config/` (read-only in the VM) |
| Cloudflare ops token (T14, T15, T17 only) | Written by the author into `/Users/Agent/.local/state/januslin-agent/cloudflare-ops.token` on the host | The author runs `sbx secret set-custom --sandbox januslin --host api.cloudflare.com --env CLOUDFLARE_API_TOKEN --command 'cat /Users/Agent/.local/state/januslin-agent/cloudflare-ops.token'` and `sbx policy allow network --sandbox januslin api.cloudflare.com` at the start (T14-H1), and removes both at the end (T14-H3). V25: wrangler works with the placeholder |

The App keys are never mounted, and the token-only directory never holds a key. `sbx` keeps its Docker login and secrets in the `agent` account's dedicated keychain `~/Library/Keychains/sbx.keychain-db`, because that account has no login keychain (it is never logged in at the desktop; V15). `sbx secret set --command` stores the command, not the value, and the daemon replays it from a fresh temporary directory on the host, so commands use absolute paths; the command only reads a file, so no secret appears in its text. The agent inside the VM cannot run `sbx`; every `sbx secret` and `sbx policy` change is the author's, in `agent-session`.

**What an agent can still leak.** Anything readable in the VM (the one-hour tokens of both Apps, the Claude login if V24 finds it there) can be sent out over an allowed host: pushed to a public branch, posted in an issue or on Slack. A pushed branch workflow is a second way out: it runs networked code on GitHub's runners, outside this allowlist (with no secrets; `docs/security.md`). The limits are the one-hour token lifetime, GitHub secret scanning with push protection, and the Write ceiling of each identity; no key and no long-lived GitHub credential is ever readable.

## Egress allowlist

Policy: `sbx policy init deny-all`, then these rules **global** (no `--sandbox`): removing a sandbox deletes its scoped rules, and the kit needs the network while the sandbox is created. Only `januslin` exists, so global and scoped are the same in effect. Each host is limited to port 443 (or 80 for Ubuntu's mirror). Kits add their own per-sandbox rules; `sbx policy ls januslin --wide` must show exactly this table.

| Host | Rule | Why |
|---|---|---|
| `github.com`, `api.github.com`, `codeload.github.com`, `objects.githubusercontent.com`, `raw.githubusercontent.com` | `:443` | Git, `gh`, release assets, the Retypeset upstream check |
| `registry.npmjs.org` | `:443` | `pnpm install`, Corepack's pnpm download |
| `nodejs.org` | `:443`, HTTP `GET,HEAD`, path `/dist/**` | Node 24 for the kit: the release tarball and its `SHASUMS256.txt` |
| `cdn.playwright.dev`, `playwright.download.prss.microsoft.com` | `:443` | `pnpm exec playwright install chromium` (Mermaid at build time, tests) |
| `storage.googleapis.com` | `:443`, HTTP `GET,HEAD`, path `/chrome-for-testing-public/**` | `cdn.playwright.dev` redirects Chromium downloads to Google's Chrome for Testing bucket; other paths and methods are refused (403, checked) |
| `ports.ubuntu.com` | `:80`, HTTP `GET,HEAD`, path `/ubuntu-ports/**` | Chromium's system libraries, installed by the kit; `apt` verifies Ubuntu's signatures |
| `api.anthropic.com`, `bridge.claudeusercontent.com`, `claude.com`, `code.claude.com`, `downloads.claude.ai`, `mcp-proxy.anthropic.com`, `platform.claude.com` | `:443`, added by the Claude Code kit (inherited by `sandbox/kit`) | Claude Code; whatever Remote Control needs beyond these is V21 |
| OpenAI hosts | added in T06 | Codex |
| `slack.com` | `:443`, added in T04 | `scripts/coordinator-channel.sh` |
| `api.cloudflare.com` | `:443` | Only during T14, T15, T17; the author adds the rule at the start (T14-H1) and removes it at the end (T14-H3) |

`WRANGLER_SEND_METRICS=false` and `ASTRO_TELEMETRY_DISABLED=1` are set in the sandbox so no telemetry host is needed.

`sbx` v0.50.1 stops listing the `default-deny-all` rule once other local rules exist, though the default deny still applies (`sbx diagnose`: "Global network policy — initialized"). Check the deny by behavior: `curl https://example.com` in the VM returns 403 "Approval required" and appears in `sbx policy approval ls`. The template's own start-up requests to `cli.github.com` and `download.docker.com` (its package sources, which the kit disables) can also appear there; dismiss them. The default filesystem rules (`read`/`write` allow `**`) govern which host paths `sbx` may mount; only the `agent` account runs `sbx create`, with the mounts above.

### Adding a host
1. The agent reports the blocked host (`sbx policy approval ls` on the host shows it) and why it is needed, through the coordinator.
2. The author decides. If yes, in `agent-session`: `sbx policy allow network <host>:443` (narrower with `--method` and `--path` where possible).
3. The same day, a docs PR adds the row to the table above. A rule without a row is a finding in the quarterly review.

Never use `allow-all` or `**`.

## Permissions inside the VM

**Claude Code runs in auto mode, not bypass mode** (decided by the author, 2026-10-30). Anthropic's [permission modes](https://code.claude.com/docs/en/permission-modes) doc says bypass mode "offers no protection against prompt injection or unintended actions" and is meant for isolated environments "without internet access". This VM has allowlisted internet, and what matters most is on GitHub, reachable with the one-hour App tokens in the read-only mount, which the VM boundary does not protect. Auto mode runs a classifier on every action, subagents included; by default it blocks, among others, sending sensitive data to external endpoints, force pushes, `git reset --hard` and similar, downloading and running code, and printing a live credential.

How it is set: the templates launch `claude --dangerously-skip-permissions`. A mixin kit cannot change the launch, so `sandbox/kit` is a full sandbox kit that extends `claude` with `sandbox.entrypoint: [claude, "--permission-mode", "auto"]`, and also writes Claude Code's Linux managed settings (`/etc/claude-code/managed-settings.json`: `permissions.disableBypassPermissionsMode: "disable"`, `permissions.defaultMode: "auto"`) as a backstop for any other launch. Claude Code checks its login before its permission mode, so the live check (`/permissions` shows auto mode, and what the bypass flag does under these settings) happens at the first `/login` in T05 (V26). Inside the VM the agent is root, so these settings are defaults, not a control against a determined agent; the classifier is the check against injected instructions.

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
