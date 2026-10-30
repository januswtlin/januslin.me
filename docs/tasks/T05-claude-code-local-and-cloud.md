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

- **T05-H1, connectors (10 min). Done 2026-10-30, before the T21 login:** no connector that holds personal data is connected. Names still to send: the full list.
  claude.ai → Settings → Connectors: send the agent the list of names. For each one that holds personal data (mail, files, calendar), remove it or reply "keep <name>".
- **T05-H2, limit the Claude App (2 min). Done 2026-10-30, before the T21 login.**
  As `januswtlin`: GitHub → Settings → Applications → Installed GitHub Apps → Claude → Configure → "Only select repositories" → `januswtlin/januslin.me` only → Save.
- **T05-H3, check the GitHub connection (5 min). Done 2026-10-30, before the T21 login:** the connection is `januslin-agent`; `januswtlin` does not authorize Claude; permissions recorded as V6 (screenshots kept by the author, not posted).
  In the `januslin-agent` browser profile, open Claude Code on the web and confirm the GitHub connection is `januslin-agent`. Screenshot the Claude App's permission list and send it (V6).
- **T05-H4, allow Remote Control in the sandbox (1 min).** In `agent-session`: `sbx settings set claude.remoteControl true`. Send "T05-H4 done". If `/remote-control` in the running session then says it is disabled, the setting applies from the next start: exit Claude Code, `sbx run --name januslin` again, and retry.
- **T05-H5, log in inside the sandbox (10 min). Done early in T21, 2026-10-30;** H1 to H3 came first, so no `/logout` and `/login` again.
  In `agent-session`: `sbx run --name januslin`, then `/login` in Claude Code and finish in your browser with your claude.ai account.
- **T05-H6, cloud environment (5 min).** At claude.ai → Claude Code → Environments (in the browser profile whose claude.ai GitHub connection is `januslin-agent`), create:
  - Name: `januslin.me`
  - Network access: **Trusted** (no Custom hosts for now; revisit in T07 if `pnpm install` needs more)
  - Environment variables: **none**. Secrets: **none**.
  - Setup script (installs dependencies only once a Node project exists; does nothing before T07):
    ```
    #!/bin/bash
    set -euo pipefail
    if [ -f pnpm-lock.yaml ]; then
      corepack enable
      pnpm install --frozen-lockfile
    fi
    ```
  Send a screenshot of the saved settings (not public; the agent records the values).
- **T05-H7, phone checks (15 min).** From the phone, start a Claude Code cloud session on `januswtlin/januslin.me` in the `januslin.me` environment with the probe prompt below, and later start Remote Control to the local session the agent names. Send the agent the session links, and the name of a private `januswtlin` repository to use in step 4 if not `januswtlin/januslin`.
  Probe prompt (V7):
  ````
  **Probe agent:** you are a probe session for januslin.me (task T05, check V7). Do only the steps below, in order. Report every command with its full output, refusals included. Do not retry a refused step another way, do not look for a workaround to any refusal, do not open any other PR, and do not change anything else.

  1. Run: `git config user.name; git config user.email; git remote -v; git branch --show-current; git log -1 --format=%H origin/main`
  2. `git fetch origin main`, then `git switch -c agent/test/T05-cloud-probe origin/main`. Create `docs/reports/T05-cloud-probe.md` containing one line: `Cloud probe for T05 (V7), 2026-10-30. The author closes this PR without merging.` Commit it with the subject `docs: T05 cloud probe (do not merge)` and the body lines `Task: T05` and `Agent: claude`. Run `git push -u origin agent/test/T05-cloud-probe`. If the push is refused because of the branch name, report the error, then push the same commit to the branch name this session is allowed to push and report that name.
  3. Open a draft PR from that branch to `main`, title `T05 cloud probe (do not merge)`, body `**Probe agent:** cloud probe for T05 (V7). The author closes it without merging.` Report the PR URL.
  4. Run `git ls-remote https://github.com/januswtlin/januslin.git` and `git clone --depth 1 https://github.com/januswtlin/januslin.git /tmp/other-repo`. Both are expected to fail; report the output. Do not try any other way to read that repository.
  5. On the probe branch, run `git push origin HEAD:main`. It is expected to be refused by the repository ruleset. Report the output and do not try again in any other way.
  6. `git switch -c agent/test/T05-cloud-probe-workflow origin/main`. Create `.github/workflows/t05-probe.yml` with exactly:
     ```
     name: t05-probe
     on: workflow_dispatch
     permissions: {}
     jobs:
       noop:
         runs-on: ubuntu-latest
         steps:
           - run: echo probe
     ```
     Commit it with the subject `ci: T05 workflow-permission probe (do not merge)` and the body lines `Task: T05` and `Agent: claude`, then `git push -u origin agent/test/T05-cloud-probe-workflow`. Report whether the push was accepted or refused, with the output. If it was accepted, delete it at once: `git push origin --delete agent/test/T05-cloud-probe-workflow`, and report that output. Do not run the workflow.
  7. Finish with a short table: each branch name you pushed or tried to push, and accepted or refused.
  ````
  Then close the probe PR without merging and delete `agent/test/T05-cloud-probe` (or the name the session used). The agent reads push actor, commit author, and PR author from the API.
  Remote Control (V21), after T05-H4: in the sandboxed coordinator session's terminal, type `/remote-control`, open the link on the phone, and send: `Run: git -C /Users/Agent/januslin.me status --short --branch. Then create branch agent/test/T05-rc-probe from origin/main with an empty commit (subject "chore: T05 Remote Control probe", body "Task: T05"), push it, report the commit SHA, and delete the remote branch again.` Send "T05-H7 RC done" with the session link; the agent reads the push actor from the API. If Remote Control fails to connect, send `sbx policy approval ls` output from `agent-session` (host names only).

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
