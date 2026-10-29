# T06: Codex in the sandbox and in the cloud

- Role: Platform Engineer
- Depends on: T05 · Human steps: T06-H1 to T06-H7
- Identity: app (`januslin-agent[bot]`) for this task's PR; the cloud probes run as the machine account
- Branch: `agent/platform/T06-codex`
- Size: M
- Runs on: the sandbox (ADR-0013), started from the `agent` account, with the author on the phone for the cloud checks. Nothing else runs in parallel.

## Goal
Codex works inside the sandbox on the author's ChatGPT subscription and in Codex cloud on this repository, follows the same rules as Claude Code, and uses the machine account as the only GitHub identity the ChatGPT account can use (ADR-0009). **Deliverable:** the Claude coordinator can dispatch a task to Codex, get the result back, have it reviewed, send the findings to the same Codex session, and report to the author, end to end.

## Read first
ADR-0009, T05's PR and its changes to `docs/agents/local-agent-account.md` and `docs/agents/workflow.md`, `docs/agents/sandbox.md`, `docs/infra-current-state.md` (V8, V10, V22, V28 to V30). Docker Sandboxes docs: usage ("Saving a sandbox as a template"), kits v2 (custom templates need Docker Desktop), Codex agent page (`sbx secret set openai --oauth`, template `docker/sandbox-templates:codex`, default flags). Codex docs: [non-interactive mode](https://learn.chatgpt.com/docs/non-interactive-mode) (`codex exec`, `--json`, `--output-schema`, `-o`, `codex exec resume <SESSION_ID>`, `--approve-for-me`), [approvals and security](https://learn.chatgpt.com/docs/agent-approvals-security) (`approvals_reviewer = "auto_review"`, sandbox modes), the [`codex-plugin-cc`](https://github.com/openai/codex-plugin-cc) README, authentication, configuration and admin-enforced requirements, sandbox and approval modes, cloud environments (setup scripts, internet access, secrets), GitHub integration.

## Scope
- Prepare T06-H1 to T06-H6 with exact values, in this order: connectors review; revoke ChatGPT's GitHub authorization on `januswtlin` and limit the Codex connector's installation to this repository; connect GitHub as the machine account (permission screenshot); only then the ChatGPT login through `sbx`.
- **Runtime (decided in `docs/agents/sandbox.md`, "Codex in the sandbox"):** install the Codex CLI in the `januslin` sandbox (Claude template), so the coordinator can call it directly; the coordinator inside the VM cannot start another sandbox (`sbx` runs only on the host). Custom templates built from a Dockerfile need Docker Desktop, so instead the author saves the configured sandbox with `sbx template save` (T06-H7), which does not. Log in with `sbx secret set openai --oauth` in the host shell (T06-H4; add `--sandbox januslin` if V22 shows `--oauth` accepts it), so the OAuth tokens stay in the `agent` account's Keychain and only a placeholder reaches the VM (V22, V28). If V28 or V29 fails, build the fallback instead: the host-side launcher described in `docs/agents/sandbox.md` (task-ID pattern only, no symlinks, run from `main`, its own sandbox secret and policy); record the choice and why.
- **Permissions:** `--sandbox workspace-write` with `approval_policy = "on-request"`, `approvals_reviewer = "auto_review"`, and `[sandbox_workspace_write] network_access = true` in the project's Codex config; `codex exec ... --approve-for-me` in dispatched runs. Not `--dangerously-bypass-approvals-and-sandbox` (`docs/agents/sandbox.md`, "Permissions inside the VM"). V29 checks that Codex's sandbox and automatic review work in the microVM, including commits and pushes (`.git` is read-only under `workspace-write`, so they escalate to automatic review). If the Codex sandbox cannot run there, ask the author before using `danger-full-access` (`docs/agents/sandbox.md`).
- Codex reads `AGENTS.md`; it reaches GitHub through the proxy (`januslin-agent[bot]`) and, for reviews, `scripts/agent-gh januslin-reviewer`; commits carry `Agent: codex` (`AGENT_TOOL=codex` in its environment).
- **Dispatch mechanism:** `codex exec` from the coordinator, not `codex-plugin-cc`. Compare both against their current docs and record the comparison. Expected reasons: `codex exec` takes explicit sandbox and approval flags, emits a JSONL event stream (`--json`), returns a final answer that matches a JSON Schema (`--output-schema`) with the PR link, the `pnpm verify` summary, the handoff report, and blockers, and resumes a session by ID (`codex exec resume <SESSION_ID>`). The plugin wraps the same CLI and app server, adds `/codex:rescue`, `/codex:status`, `/codex:result`, `/codex:cancel`, and background jobs, but is built around slash commands for a person and documents no sandbox or approval flags. Add `scripts/codex-dispatch.sh` (start: task ID and role in, session ID and result JSON out; resume: session ID and findings in) and its result schema, with tests using a fake `codex`.
- **Routing rule** in `docs/agents/workflow.md`: cross-tool by default (Codex implements, a Claude subagent reviews; a Claude subagent implements, Codex reviews with `codex exec` and the review prompt as `januslin-reviewer[bot]`). When Claude's quota runs low (rate-limit errors in subagents, or the author says so), implementers go to Codex. Identity does not change with the tool.
- **Failure and recovery:** an interrupted `codex exec` (non-zero exit, no result) is reported and resumed by session ID, or restarted from the PR and branch; an expired login stops dispatch to Codex and asks the author for T06-H4 again; an exhausted Codex quota routes back to Claude or waits. No double dispatch: before starting, the coordinator checks for an existing branch or PR as for Claude subagents, and records the Codex session ID in the PR's handoff report and its own report.
- **End to end (V30):** the coordinator dispatches one small real task (or a throwaway docs change) to Codex, receives the JSON result (and records whether auto mode blocked the dispatch command), starts a separate reviewer, sends the findings to the same Codex session with `codex exec resume`, gets the fix, and reports to the author with the PR link and the `ci` run link.
- V8: test what a personal ChatGPT account can enforce on Codex (requirements or managed config: connectors in particular). Inside the VM such config is a default, not a control (the agent is root there); record what took effect.
- Mobile: record which ways of steering Codex from the phone work here (Codex cloud from the ChatGPT app; a local session through a host app). Remote Login stays off.
- Codex cloud environment for this repository: setup script for dependencies once a Node project exists; agent internet access off, or an allowlist naming each host; no secrets or credential variables.
- Probes (V10), from a cloud task the author starts on the phone: whether the agent can push a branch itself or only the author's "Create PR" click does; push actor, commit author, and PR author from the API (expect the machine account); another private repository of `januswtlin` is unreachable; `git push origin HEAD:main` is refused by the ruleset; the harmless workflow-file push, as in T05.
- One cross-tool review the other way: Codex in the sandbox reviews a Claude PR as `januslin-reviewer[bot]` with the review prompt, dispatched by the coordinator.
- Docs: `docs/agents/sandbox.md` and `docs/agents/local-agent-account.md` (login, config, how Codex starts), `docs/agents/workflow.md` (Codex sessions, the routing rule, the dispatch steps in the coordinator loop), `docs/security.md`, `docs/operations.md` ("Lost device", quarterly), `docs/infra-current-state.md` (V8, V10, V22, V28 to V30, environment, change log), the human steps below (done, with the date).

## Out of scope
Scheduled automation on Codex.

## Human steps

Only the author can do these. The agent prepares each one with the exact values before it is needed and waits for the reply. Never paste a secret into a chat; where a secret is involved, the step stores it directly.

Do them in this order; never do T06-H4 before T06-H3 is confirmed.

- **T06-H1, connectors (10 min).** ChatGPT → Settings → Apps / Connectors: send the agent the list of names; remove those holding personal data, or reply "keep <name>".
- **T06-H2, revoke and limit (5 min).** As `januswtlin`: GitHub → Settings → Applications → Authorized GitHub Apps → ChatGPT / Codex → Revoke. Then Installed GitHub Apps → the Codex connector → Configure → only `januswtlin/januslin.me` (install it there if missing; only the repository owner can).
- **T06-H3, connect as the machine account (5 min).** In the `januslin-agent` browser profile, connect GitHub in ChatGPT / Codex and approve. Screenshot the permission list and send it.
- **T06-H4, Codex login through `sbx` (10 min).** In `agent-session` (the host shell): `sbx secret set openai --oauth` and finish the ChatGPT sign-in in your browser (if none opens from `agent-session`, open the URL it prints). Codex itself is never installed on the host.
- **T06-H5, Codex cloud environment (5 min).** Create it exactly as the agent specifies; send a screenshot.
- **T06-H6, phone checks (15 min).** From the ChatGPT app, start a Codex cloud task with the probe prompt the agent sends; send the task link.
- **T06-H7, save the sandbox as a template (5 min), after the agent has installed Codex in it.** In `agent-session`: `sbx stop januslin`, then `sbx template save januslin januslin:codex-<yyyy-mm-dd>`; send the output of `sbx template ls`. Future re-creations use the command in `docs/agents/sandbox.md` ("Starting it"). Save only right after the reviewed install, and never push the template to a registry: it captures the whole VM filesystem.

## Acceptance criteria
- [ ] ChatGPT's GitHub connection is the machine account; `januswtlin` no longer authorizes ChatGPT; the connector's permissions are recorded with a note on Workflows, Secrets, and Variables (screenshots).
- [ ] Connectors recorded (names only) with the author's decision for each.
- [ ] V22 resolved. Codex in the sandbox pushes a test branch that shows `januslin-agent[bot]` and a commit with `Agent: codex`.
- [ ] V8 resolved with evidence.
- [ ] V10 resolved with API output for each probe.
- [ ] The cross-tool review is posted as `januslin-reviewer[bot]` (link).
- [ ] V28 and V29 resolved (or the fallback built and recorded).
- [ ] V30: the end-to-end dispatch, review, resume, and report ran once (links to the PR, the review, the fix commit, and the coordinator's report).

## Automated verification
- Tests for `scripts/codex-dispatch.sh` with a fake `codex` on `PATH`: the result schema is validated, a non-zero exit is reported as interrupted, resume passes the session ID, no token or prompt secret reaches argv or output.
- Manual: T06's human steps, the login, V8, the probes, V30.
