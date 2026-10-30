# T05: Claude Code in the sandbox and in the cloud

- Role: Platform Engineer
- Depends on: T03, T21 · Human steps: T05-H1 to T05-H7
- Identity: app (`januslin-agent[bot]`) for this task's PR; the cloud probes run as the machine account
- Branch: `agent/platform/T05-claude-code`
- Size: M
- Runs on: the sandbox `januslin` (ADR-0013), started from the `agent` account, with the author on the phone for the cloud and Remote Control checks. Nothing else runs in parallel.

## Goal
Claude Code works locally inside the sandbox with a full claude.ai login and Remote Control, its coordinator can run worktree subagents there, and in Claude Code cloud on this repository, with the machine account `januslin-agent` as the only GitHub identity the claude.ai account can use (ADR-0009).

## Read first
ADR-0009, ADR-0011, ADR-0013, `docs/agents/sandbox.md`, `docs/agents/local-agent-account.md` ("Tool logins"), `docs/agents/workflow.md` ("Cloud sessions"), `docs/automation.md`, `docs/infra-current-state.md` (V6, V7, V20, V21, V24). Docker Sandboxes docs: Claude Code agent page (`/login`, `claude.remoteControl`). Claude Code docs: Claude Code on the web (environments, network access, GitHub proxy), Remote Control, authentication, managed settings.

## Scope
- Prepare T05-H1 to T05-H7 with exact values, in this order: connectors review; Claude App installation limited to this repository; check that the claude.ai GitHub connection is the machine account (V6 screenshot); only then the login in the sandbox. Never start the full login while the connection could still be `januswtlin`.
- Login in the sandbox: `/login` inside `sbx run --name januslin` (it needs the credential binding from T21). **The login already exists:** the author logged in during T21 (2026-10-30), so T05-H5 is done out of order. Before using that login for anything, confirm T05-H1 to T05-H3 with the author (above all V6, that claude.ai's GitHub connection is `januslin-agent`); if any of them was not done before the T21 login, have the author do it now and then `/logout` and `/login` again. T21 already recorded V24 (the tokens stay on the host); re-confirm it rather than repeat it. Otherwise, find where the credential is stored (a file under `~/.claude` in the VM, or only on the host behind the proxy) and whether it survives `sbx stop` and `sbx run` (V24). If it is readable in the VM, record that next to the author's acceptance in `docs/agents/sandbox.md`. The old `setup-token` token was revoked in T03-H3; confirm no `claude-oauth-token` file is left. The host macOS managed settings stay unchanged (ADR-0013).
- In-VM defaults: the repository's `.claude/settings.json` denies the claude.ai connector tools and the cron and scheduled-task tools (T03 created it; confirm it loads, `/permissions`).
- Auto mode (V26 from T03) for the coordinator and its subagents; a Claude Code `Notification` hook in the sandbox that runs `scripts/coordinator-channel.sh post` when Claude Code waits for input, so a paused auto mode reaches the author on Slack (V27, first observations; this task may add that hook and its test).
- V20: the coordinator prompt's Agent-tool subagents with `isolation: "worktree"` work in the sandbox clone; two run at once without touching each other's files.
- Cloud environment for this repository: network level Trusted (or Custom listing each host if `pnpm install` needs more), no environment variables or secrets, a setup script that installs dependencies once a Node project exists. Record its settings.
- Probes (V7), from a cloud session the author starts on the phone with a probe prompt the agent writes:
  - A docs-only commit on `agent/test/T05-cloud-probe`, pushed, and a PR opened. Record push actor, commit author, and PR author from the API (expect the machine account, id 349746030). The author closes the PR and deletes the branch.
  - Reading another private repository of `januswtlin` that the author names fails.
  - `git push origin HEAD:main` is refused by the ruleset (do not look for a workaround).
  - A branch adding a harmless workflow (`workflow_dispatch` only, no secrets) is accepted or refused: record which (it tells whether the Claude App has Workflows write). Delete the branch either way.
  - Which branch names the session may push.
- Remote Control (V21): `sbx settings set claude.remoteControl true` on the host (T05-H4), then from the phone to the sandboxed session: run a harmless command, and show that a push from that session still appears as `januslin-agent[bot]`. Record any host Remote Control needs that the allowlist lacked.
- Docs: `docs/agents/sandbox.md` and `docs/agents/local-agent-account.md` (login, Remote Control; drop the `setup-token` parts), `docs/agents/workflow.md` ("Cloud sessions", the branch-name rule), `docs/security.md`, `docs/operations.md` ("Lost device", quarterly review), `docs/infra-current-state.md` (V6, V7, V20, V21, V24, V27, environment, change log), the human steps below (done, with the date).

## Out of scope
Codex (T06). Scheduled tasks (T20).

## Human steps

Only the author can do these. The agent prepares each one with the exact values before it is needed and waits for the reply. Never paste a secret into a chat; where a secret is involved, the step stores it directly.

Do them in this order; never do T05-H5 before T05-H3 is confirmed.

- **T05-H1, connectors (10 min).** claude.ai → Settings → Connectors: send the agent the list of names. For each one that holds personal data (mail, files, calendar), remove it or reply "keep <name>".
- **T05-H2, limit the Claude App (2 min).** As `januswtlin`: GitHub → Settings → Applications → Installed GitHub Apps → Claude → Configure → "Only select repositories" → `januswtlin/januslin.me` only → Save.
- **T05-H3, check the GitHub connection (5 min).** In the `januslin-agent` browser profile, open Claude Code on the web and confirm the GitHub connection is `januslin-agent`. Screenshot the Claude App's permission list and send it (V6).
- **T05-H4, allow Remote Control in the sandbox (1 min).** In `agent-session`: `sbx settings set claude.remoteControl true`. Send "T05-H4 done".
- **T05-H5, log in inside the sandbox (10 min; done early in T21, 2026-10-30, see Scope).** In `agent-session`: `sbx run --name januslin`, then `/login` in Claude Code and finish in your browser with your claude.ai account.
- **T05-H6, cloud environment (5 min).** At claude.ai → Claude Code → Environments, create the environment exactly as the agent specifies (name, network level, setup script, no variables). Send a screenshot.
- **T05-H7, phone checks (15 min).** From the phone, start a cloud session with the probe prompt the agent sends, and later start Remote Control to the local session the agent names. Send the agent the session links.

## Acceptance criteria
- [ ] V6 resolved: the Claude App's permission list (screenshot) with a one-line note on Workflows, Secrets, and Variables.
- [ ] The Claude App is installed on `januswtlin` with this repository only; claude.ai's GitHub connection is the machine account; `januswtlin` does not authorize Claude (screenshots).
- [ ] Connectors recorded (names only) with the author's decision for each.
- [ ] V20 and V24 resolved: worktree subagents work in the sandbox; where the Claude login is stored is recorded.
- [ ] No `setup-token` token or file remains (revoked in T03-H3; the author confirms).
- [ ] V7 resolved with API output for each probe.
- [ ] V21: Remote Control works from the phone to the sandboxed session, and a push from that session shows `januslin-agent[bot]`.

## Automated verification
- None expected: account settings and docs.
- Manual: T05's human steps, the probes, Remote Control.
