# The local AI sandbox

Last reviewed: 2026-10-31 · Decision: ADR-0013

How local AI runs, for agents and reviewers. The author's procedures (creating the sandbox, starting it, changing its policy and secrets) are runbooks in `docs/runbooks/`, explained in `docs/admin-guide.md`.

macOS (the author's Mac) → the standard macOS account `agent` (keys, token broker, `sbx`, no AI) → one Docker Sandbox microVM, `januslin` (Claude Code, the coordinator and its subagents, `pnpm verify`). `sbx` version and the open questions about it: `docs/infra-current-state.md`.

## Layers

| Layer | Holds | Runs | Can reach |
|---|---|---|---|
| The author's macOS account | Own GitHub login, SSH keys, Keychain | The author's tools | Everything the author can |
| macOS account `agent` (host) | The active App set's keys (`~/.config/januslin-agent/active/`, put there by the author, ADR-0015), `sbx` and its keychain secrets, the token broker | `sbx`, `scripts/sandbox-session.sh`, `scripts/token-broker.sh`, `git` for the host clone. **Never an AI tool.** | GitHub as the Apps (through the broker), Docker login |
| Sandbox `januslin` (microVM, Linux) | A private clone of the repository; the one-hour tokens of both Apps in a read-only directory; never a key | Claude Code, the coordinator and subagents, `pnpm`, Playwright | Only the hosts on the allowlist below; credentials injected by the host proxy |

The sandbox never sees a `.pem`, the author's files, or the `agent` account's home outside its mounts. The host runs only reviewed code from `main` (the broker and the other host scripts are CODEOWNERS paths, `.github/CODEOWNERS`), never a branch the sandbox pushed.

## Inside the VM

The sandbox is created from the kit in this repository, `sandbox/kit/spec.yaml` (a CODEOWNERS path), which extends the built-in `claude` agent (template `docker/sandbox-templates:claude-code-docker`). At creation the kit:
- starts Claude Code with `--permission-mode auto` (see "Permissions inside the VM");
- writes Claude Code's Linux managed settings in `/etc/claude-code/`;
- installs Node 24 into `/opt/node24` from the official nodejs.org release at a pinned version, checked against `SHASUMS256.txt` (the template has Node 22), and enables pnpm through Node's bundled Corepack;
- installs Chromium's system libraries with `playwright install-deps chromium` from Ubuntu's mirror, after disabling the template's Docker and GitHub CLI apt sources;
- sets `PATH`, `AGENT_TOOL=claude`, `JANUSLIN_AGENT_STATE_DIR`, and the telemetry switches in `/etc/sandbox-persistent.sh` (sourced by every shell through `BASH_ENV`);
- sets git's `core.hooksPath` and the credential helper in the system git config.

Mounts (read-only, writes refused even as root): the host clone at `/run/sandbox/source`, the token directory `sandbox-tokens/`, and `sandbox-config/` (non-secret configuration: `identity.json`, the active App set's name, owner, and each role's App ID, bot slug, and bot user ID, written by the broker).

Clone mode gives the VM its own clone, with the host's `origin` (`https://github.com/januswtlin/januslin.me.git`), so branches are pushed to GitHub. The host clone has a `sandbox-januslin` remote served by a git daemon on `127.0.0.1`; the host never fetches it.

Docker also writes a generic agent guide into the VM (`/Users/Agent/CLAUDE.md`, loaded by Claude Code as a parent-directory `CLAUDE.md`). Its advice on GitHub tokens, `"**"` network rules, and `git add -A` conflicts with this project; `AGENTS.md` ("Identity") wins.

Remote Control is allowed for this sandbox (`claude.remoteControl`). The author starts it with `/remote-control` in the session; the coordinator never does. GitHub access from a Remote Control session stays on the Apps, and Remote Control needs no host beyond the allowlist.

## GitHub tokens

- The host broker (`scripts/token-broker.sh`) mints one-hour installation tokens for both Apps with `scripts/agent-token.sh`, which runs only on the host, and moves each finished token file into `sandbox-tokens/` (`januslin-agent.token`, `januslin-reviewer.token`). It refreshes a token with under 10 minutes left, checked every minute. The directory never holds a key.
- Which Apps the tokens belong to is the author's choice of App set (ADR-0015, `docs/runbooks/app-key-sets.md`). The file names stay the role names whatever set is active. When the author switches sets, the broker revokes the old tokens and mints from the new set within a minute; when the author turns the set off, both tokens are revoked and none is minted. Never assume the bot names `januslin-agent[bot]` and `januslin-reviewer[bot]`: read the active ones from `sandbox-config/identity.json` (for example `jq -r .apps.reviewer.slug`). A failed call right after a switch is retried, not worked around.
- In the VM, `JANUSLIN_AGENT_STATE_DIR` points the scripts at that mount:
  - `scripts/agent-gh <januslin-agent|januslin-reviewer> <gh args…>` runs `gh` with that App's token for one process, for example `scripts/agent-gh januslin-agent pr create --draft …` or `scripts/agent-gh januslin-reviewer pr review <n> --approve`.
  - Git pushes use `scripts/agent-git-credential` (in the system git config), which reads the `januslin-agent` token and answers only for `januswtlin/januslin.me`.
- The VM's `GH_TOKEN` is a placeholder that GitHub rejects, so plain `gh` fails; always use `scripts/agent-gh`.
- Never run `gh auth login`, never run `scripts/agent-gh <app> auth token` (it prints the token), and never put a GitHub token in an environment variable or argv.
- A push or `gh` call that fails with an expired token means the broker stopped: report it, do not work around it.
- `prepare-commit-msg` adds the `Agent:` trailer but does not run on rebase picks; check the trailer if you ever rebase a local, unpushed branch.

Why tokens are files and not proxy-injected: an `sbx` `github` secret makes the proxy replace every Authorization header to GitHub, the reviewer's included, so reviews would post as the implementer (ADR-0013, "Outcome of T03").

## Credentials

| Credential | Where it lives | How the sandbox uses it |
|---|---|---|
| `januslin-agent` installation token | `sandbox-tokens/januslin-agent.token`, written by the broker on the host, mounted read-only | `scripts/agent-git-credential` and `scripts/agent-gh januslin-agent` |
| `januslin-reviewer` installation token | `sandbox-tokens/januslin-reviewer.token`, the same way | `scripts/agent-gh januslin-reviewer` |
| Claude subscription login | `sbx`'s secret store on the host (`sbx secret ls`: `anthropic`, global, "oauth configured"). The VM's `~/.claude/.credentials.json` holds 26-character sentinels only. It survives `sbx stop` and `sbx run` | Injected by the proxy on Claude's hosts. The agent can use the login through the proxy but cannot read or copy the token |

The App keys are never mounted. The agent inside the VM cannot run `sbx`; every `sbx secret` and `sbx policy` change is the author's, in the host shell. If a later `sbx` or kit change made the Claude login readable in the VM, the author has accepted that in advance (2026-10-30): no connector holding personal data is connected, egress is allowlisted, and Remote Control needs the full login.

**What an agent can still leak.** Anything readable in the VM (the one-hour tokens of both Apps) can be sent out over an allowed host: pushed to a public branch, or posted in an issue. A pushed branch workflow is a second way out: it runs networked code on GitHub's runners, outside this allowlist (with no secrets; `docs/security.md`). The limits are the one-hour token lifetime, GitHub secret scanning with push protection, and the Write ceiling of each identity; no key and no long-lived GitHub credential is ever readable.

## Egress allowlist

Policy: `sbx policy init deny-all`, then these rules **global** (no `--sandbox`): removing a sandbox deletes its scoped rules, and the kit needs the network while the sandbox is created. Only `januslin` exists, so global and scoped are the same in effect. Each host is limited to port 443 (or 80 for Ubuntu's mirror). `sbx policy ls januslin --wide` must show exactly this table.

| Host | Rule | Why |
|---|---|---|
| `github.com`, `api.github.com`, `codeload.github.com`, `objects.githubusercontent.com`, `raw.githubusercontent.com` | `:443` | Git, `gh`, release assets, the Retypeset upstream check |
| `registry.npmjs.org` | `:443` | `pnpm install`, Corepack's pnpm download |
| `nodejs.org` | `:443`, HTTP `GET,HEAD`, path `/dist/**` | Node 24 for the kit: the release tarball and its `SHASUMS256.txt` |
| `cdn.playwright.dev`, `playwright.download.prss.microsoft.com` | `:443` | `pnpm exec playwright install chromium` (Mermaid at build time, tests) |
| `storage.googleapis.com` | `:443`, HTTP `GET,HEAD`, path `/chrome-for-testing-public/**` | `cdn.playwright.dev` redirects Chromium downloads to Google's Chrome for Testing bucket; other paths and methods are refused (403) |
| `ports.ubuntu.com` | `:80`, HTTP `GET,HEAD`, path `/ubuntu-ports/**` | Chromium's system libraries, installed by the kit; `apt` verifies Ubuntu's signatures |
| `api.anthropic.com`, `bridge.claudeusercontent.com`, `claude.com`, `code.claude.com`, `downloads.claude.ai`, `mcp-proxy.anthropic.com`, `platform.claude.com` | `:443`, added by the Claude Code kit (inherited by `sandbox/kit`) | Claude Code, including Remote Control |

`WRANGLER_SEND_METRICS=false` and `ASTRO_TELEMETRY_DISABLED=1` are set in the sandbox so no telemetry host is needed.

`sbx` stops listing the `default-deny-all` rule once other local rules exist, though the default deny still applies (`sbx diagnose`: "Global network policy — initialized"). Check the deny by behavior: `curl https://example.com` in the VM returns 403 "Approval required" and appears in `sbx policy approval ls`. The template's own start-up requests to `cli.github.com` and `download.docker.com` (its package sources, which the kit disables) can also appear there; dismiss them. The default filesystem rules (`read`/`write` allow `**`) govern which host paths `sbx` may mount; only the `agent` account runs `sbx create`, with the mounts above.

**Adding a host:** the agent raises a `human-task` issue naming the blocked host (`sbx policy approval ls` on the host shows it) and why it is needed. The author decides and adds the rule (`docs/runbooks/allow-sandbox-host.md`); the same day a docs PR adds the row above. A rule without a row is a finding in the quarterly review. Never `allow-all` or `**`.

## Permissions inside the VM

**Claude Code runs in auto mode, not bypass mode** (the author, 2026-10-30). Anthropic's [permission modes](https://code.claude.com/docs/en/permission-modes) doc says bypass mode "offers no protection against prompt injection or unintended actions" and is meant for isolated environments "without internet access". This VM has allowlisted internet, and what matters most is on GitHub, reachable with the one-hour App tokens, which the VM boundary does not protect. Auto mode runs a classifier on every action, subagents included; by default it blocks, among others, sending sensitive data to external endpoints, force pushes, `git reset --hard` and similar, downloading and running code, and printing a live credential.

How it is set: the templates launch `claude --dangerously-skip-permissions`, and a mixin kit cannot change the launch, so `sandbox/kit` is a full kit with `sandbox.entrypoint: [claude, "--permission-mode", "auto"]`. Its managed settings (`/etc/claude-code/managed-settings.json`: `permissions.disableBypassPermissionsMode: "disable"`, `permissions.defaultMode: "auto"`) back that up: the session shows `auto mode on`, and `claude --dangerously-skip-permissions` starts but runs in auto mode. Inside the VM the agent is root, so these settings are defaults, not a control against a determined agent; the classifier is the check against injected instructions.

Behavior to know:
- After 3 consecutive or 20 total blocks, auto mode pauses and asks. In the interactive coordinator session the loop then waits until someone answers; the author can answer through Remote Control.
- Subagents (implementers and reviewers started with the Agent tool) are checked by the same classifier before they start, while they run, and when they finish; a block inside a subagent surfaces in the coordinator's session and counts toward the pause. Implementers report blocked actions in their handoff.
- Blocked actions are listed in `/permissions` → Recently denied.

The repository's `.claude/settings.json` denies the claude.ai connector tools (`mcp__claude_ai_*`) and the cron and scheduled-task tools (`CronCreate`, `CronList`, `CronDelete`, `RemoteTrigger`) as defaults. Check it with `/permissions`, or without a prompt: `claude -p ok --output-format stream-json --verbose --max-turns 1 | head -1 | jq '.tools'` (23 tools in the repository, 29 outside it).

**Docker's MCP gateway is denied** (the author, 2026-10-30). The sandbox template wires a user-level MCP server, `mcp-gateway` (`http://mcp-gateway.docker.internal/mcp` in `~/.claude.json`, its credential managed by the proxy). Its tools (`mcp-find`, `mcp-add`, `mcp-config-set`, `mcp-exec`, `code-mode`) would let an agent add and run unreviewed tools at runtime, so `.claude/settings.json` denies `mcp__mcp-gateway__*`. The server still connects; only its tools are withheld. A future MCP server comes in through a PR that changes this file (a CODEOWNERS path).

**Workflows permission on the implementer token** (the author, 2026-10-30): every `januslin-agent` token has Workflows write, and before merging, the coordinator and the author confirm `ci` from the `ci.yml` run for the exact head commit (ADR-0009, risk 5).

## Tests in the sandbox

`pnpm verify`, Playwright, and visual snapshots run on Linux in the VM, the same platform as CI, so one set of baselines serves both. Dev servers started by agents bind inside the VM; a port is published to the host (`sbx ports januslin --publish <port>`) only when the author asks to see something.

## Checks

The quarterly review (`docs/operations.md`) re-runs the canary (no key or host file outside the read-only mounts is readable from the VM) and compares `sbx policy ls januslin --wide` with the allowlist above.

## Planned changes

- **Codex** (T06, [#14](https://github.com/januswtlin/januslin.me/issues/14)): the Codex CLI installed in this sandbox and saved as a template; its ChatGPT login through `sbx secret set openai --oauth`, kept on the host; `codex exec --sandbox workspace-write --approve-for-me` with automatic review, never full bypass; OpenAI hosts added to the allowlist. The issue holds the design and the fallback.
- **Cloudflare ops token** (T14, [#18](https://github.com/januswtlin/januslin.me/issues/18); also T15, T17): while a Cloudflare task runs, the author lends a short-lived token that the proxy injects for `api.cloudflare.com` as `CLOUDFLARE_API_TOKEN`, with a temporary rule for that host (`docs/runbooks/lend-cloudflare-token.md`). V25 checks that wrangler works with the placeholder.
- **Narrow implementer token** (decided trigger, T16, [#23](https://github.com/januswtlin/januslin.me/issues/23)): if a branch workflow can post a passing `ci` check on another PR's head commit, the broker mints the everyday token without `workflows`, and the author enables it per workflow task with `scripts/token-broker.sh workflows on|off`.
- **`main` watch** (T04, [#13](https://github.com/januswtlin/januslin.me/issues/13)): `scripts/main-watch.sh` keeps its state in `~/.local/state/januslin-agent/main-watch.state` in the VM.
