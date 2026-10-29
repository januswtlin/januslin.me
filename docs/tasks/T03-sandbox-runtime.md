# T03: Sandbox runtime and token broker

- Role: Platform Engineer
- Depends on: T02 · Human steps: T03-H1 to T03-H5
- Identity: app (`januslin-agent[bot]`). This is the last task whose agent runs in the host `agent` shell, because the sandbox does not exist yet; from its merge on, every local agent runs in the sandbox.
- Branch: `agent/platform/T03-sandbox`
- Size: M
- Runs on: the author's Mac. Nothing else runs in parallel.

## Goal
Local AI runs only inside the Docker Sandbox `januslin`: no key can be read from inside it, GitHub tokens are minted by a host broker and reach the sandbox through the proxy or a read-only directory, egress is deny-by-default with the documented allowlist, and `pnpm`, `gh`, and git pushes work from inside (ADR-0013).

## Read first
ADR-0013, ADR-0009, `docs/agents/sandbox.md`, `docs/agents/local-agent-account.md`, `docs/infra-current-state.md` (V15 to V19). Docker Sandboxes docs: install, credentials, local access controls, usage (clone mode), Claude Code and Codex agent pages, security.

## Scope
1. **Install and policy (with T03-H1, T03-H2).** `sbx` in the `agent` account (V15: works from a standard account in a `sudo -iu agent` session, including Keychain-backed secrets). `sbx login`. `sbx policy init deny-all` and the allowlist in `docs/agents/sandbox.md`. Record the `sbx` version.
2. **Broker.** `scripts/token-broker.sh start|stop|once|status`: runs `scripts/agent-token.sh` for `januslin-agent` and `januslin-reviewer`, writes only token files (line 1 token, line 2 expiry, `0600`): `januslin-agent` into `~/.local/state/januslin-agent/proxy-tokens/` (never mounted) and `januslin-reviewer` into `~/.local/state/januslin-agent/sandbox-tokens/` (mounted read-only), both `0700`, refreshes 10 minutes before expiry, never prints a token, and writes nothing else there. It runs in the foreground of a host terminal tab or in the background of `agent-session`; no launchd job (the account has no LaunchAgents).
3. **Sandbox.** The agent (still in the host shell) creates `~/.config/januslin-agent/sandbox-config/` empty (`0700`; T04 fills it), then runs `sbx create --clone --name januslin claude ~/januslin.me ~/.local/state/januslin-agent/sandbox-tokens:ro ~/.config/januslin-agent/sandbox-config:ro`. Inside: set `origin` to the GitHub HTTPS URL, `user.name` and `user.email` to `januslin-agent[bot]`, `core.hooksPath .githooks`, and `AGENT_TOOL=claude` for the trailer hook. Node 24, pnpm (Corepack), and Playwright's Chromium installed (the template, a kit, or a setup script; the docs name a Playwright kit only as an example, so check what exists; record which and why). The repository's `.claude/settings.json` with the deny defaults in `docs/agents/sandbox.md`. Auto mode for Claude Code inside the VM (`docs/agents/sandbox.md`, "Permissions inside the VM"): a kit entrypoint (`claude --permission-mode auto`) or Linux managed settings with `disableBypassPermissionsMode` and `permissions.defaultMode: "auto"`; record which works and how the other behaved (V26), and show `/permissions` reports auto mode.
4. **Credentials.** The `github` secret with `--command` reading the broker's file by absolute path and `--refresh on-demand` (the proxy otherwise caches a resolved secret for 55 minutes, longer than the token's remaining life; [authentication](https://docs.docker.com/ai/sandboxes/workflows/authentication/)) (preferred) and `scripts/agent-gh` / `scripts/agent-git-credential` adapted so that inside the sandbox `januslin-agent` uses the proxy and the other Apps read the mounted token files. If V17 or V18 fails, switch to the fallback in ADR-0013 and say so.
5. **Verifications** (record each in `docs/infra-current-state.md` with output):
   - V16 canary, from inside the VM: reading `/Users/Agent/.config/januslin-agent/` (any `.pem`), `/Users/januslin`, and the host clone for writing all fail; only `/run/sandbox/source`, the token directory, the config directory, and the shared skills store are visible, all read-only, and the implementer token file is not among them (no file under `/Users/Agent/.local/state/januslin-agent/proxy-tokens/` is readable). This also confirms that clone mode accepts the extra `:ro` mounts (the docs show them only with direct mounts).
   - V17: `git push` of `agent/test/T03-probe` and `gh api /repos/januswtlin/januslin.me` work as `januslin-agent[bot]` with only a placeholder visible (`env`, `git config --get-all credential.helper`, a request-header dump against a test endpoint that the proxy does not touch); after the token's expiry the broker's new token is used without restarting the sandbox.
   - V18: `scripts/agent-gh januslin-reviewer api /installation/repositories` and a review comment work as `januslin-reviewer[bot]` while the `github` secret is active (an explicit Authorization header is not overwritten).
   - V19: `pnpm install`, `pnpm exec playwright install chromium`, and `sh tests/scripts/run.sh` succeed; `curl https://example.com` is blocked and appears in `sbx policy approval ls`.
6. **Docs:** `docs/agents/sandbox.md` and `docs/agents/local-agent-account.md` to what was built; `docs/infra-current-state.md` (V15 to V19, the `sbx` version, change log); `AGENTS.md` if a command changed.

## Out of scope
The Claude Code login and Remote Control (T05), Codex (T06), the Slack secret (T04).

## Human steps

Only the author can do these. The agent prepares each one with the exact values before it is needed and waits for the reply. Never paste a secret into a chat.

- **T03-H1, install `sbx` (10 min).** If Homebrew in the `agent` account is not usable (it is a standard account), install `sbx` as the agent's runbook says (V15): either `brew trust docker/tap && brew install docker/tap/sbx` in your own account, then confirm `agent` can run `/opt/homebrew/bin/sbx version`; or the alternative the agent found. Send the `sbx version` output.
- **T03-H2, Docker login and policy (5 min).** In `agent-session`: `sbx login` (finish in your browser with your Docker account; if no browser opens from `agent-session`, open the URL it prints), then run the `sbx policy` commands the agent sends, after reading them. Send `sbx policy ls januslin`.
- **T03-H3, after T03 merges and this task's host session has ended: remove AI from the host and check for leftovers (15 min).** In `agent-session`: uninstall Claude Code the way it was installed (the agent tells you which) and delete `~/.claude` there; revoke the old `setup-token` token at claude.ai, delete `~/.config/januslin-agent/claude-oauth-token`, and drop the `CLAUDE_CODE_OAUTH_TOKEN` export from your `agent-session` alias; in the host clone run `git config --local --unset core.hooksPath`, `git fetch origin && git reset --hard origin/main`, and confirm `git status --porcelain` is empty. Compare `sbx secret ls` and `sbx policy ls januslin --wide` with `docs/agents/sandbox.md`; read `~/.zshrc`, `~/.zprofile`, and `crontab -l` for anything you did not add. Send `command -v claude codex` (must print nothing) and "leftovers checked".
- **T03-H4, rotate both App keys (10 min), right after T03-H3.** AI ran in this account until now, so treat the current keys as exposed: follow `docs/operations.md` → "Rotate the agent App keys" for `januslin-agent` and `januslin-reviewer`, and delete the old keys. Send a screenshot of each App's key list (dates only).
- **T03-H5, start the broker and the sandbox (5 min).** In `agent-session`: `scripts/token-broker.sh start`, then `sbx run --name januslin` (`docs/agents/sandbox.md`). From now on every agent session starts this way. Send "started".

## Acceptance criteria
- [ ] V15 to V19 and V26 resolved with output, or a recorded fallback that keeps "no key in the sandbox".
- [ ] The canary (V16) shows no `.pem` and no host file outside the read-only mounts is readable from the VM (manual).
- [ ] A push and a PR from inside the sandbox show `januslin-agent[bot]`, with an `Agent: claude` trailer.
- [ ] `sbx policy ls januslin --wide` equals the table in `docs/agents/sandbox.md`.
- [ ] The broker refreshes tokens across an expiry (log lines with times, no token values).
- [ ] The App keys used while AI ran on the host are rotated (T03-H4); T04's first step confirms no AI CLI is left on the host (`command -v claude codex`).

## Automated verification
- `tests/scripts/` cases for `token-broker.sh` (fake `agent-token.sh`): writes only token files with `0600`, refreshes before expiry, prints no token, refuses to write outside its directory.
- Manual: everything that needs the VM and the proxy.
