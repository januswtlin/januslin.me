# T21: Sandbox kit keeps the Claude login working

- Role: Platform Engineer
- Depends on: T03 · Human steps: T21-H1, T21-H2, T21-H3
- Identity: machine account (`januslin-agent`, a cloud session the author started), because the sandbox's Claude Code cannot log in until this task lands
- Branch: the cloud session's branch (the vendor forces its prefix)
- Size: S
- Runs on: a Claude Code cloud session, with the author running the host checks in `agent-session`. Nothing else runs in parallel.

## Goal
`/login` inside the sandbox `januslin` succeeds, while Claude Code there still starts in auto mode with bypass mode disabled (ADR-0013, V26), so T05-H5 can proceed.

## Background (found 2026-10-30, `sbx` v0.50.1, during T05-H5)
- `/login` in `januslin` completes in the browser, then fails in the VM with `OAuth error: Request failed with status code 401`.
- No `sbx` secret is set; the allowlist matches `docs/agents/sandbox.md`; `SBX_CRED_ANTHROPIC_MODE=none` in the VM.
- The `sbx` proxy answers token requests to `platform.claude.com/v1/oauth/token` itself. From `januslin` (built from `sandbox/kit`), a fake `authorization_code` request gets `proxy: OAuth refresh denied (no authorizing binding)`. From a throwaway sandbox of the built-in `claude` agent (`sbx create --name login-test claude <empty dir>`), the same request reaches Anthropic (`invalid_request_error` with an Anthropic `request_id`), and `/login` succeeds there. The difference is the kit: whatever makes the proxy treat a sandbox as Claude Code's is not inherited through `extends: claude` in a `kind: sandbox` kit named `januslin`.

## Read first
`AGENTS.md`, ADR-0013, `docs/agents/sandbox.md`, `sandbox/kit/spec.yaml`, `docs/infra-current-state.md` (V24, V26), T03 and T05 task files. The built-in `claude` kit as `sbx kit inspect` shows it (T21-H1).

## Scope
1. From T21-H1, find what in the built-in `claude` kit lets the proxy broker Claude's OAuth, and change `sandbox/kit/spec.yaml` so `januslin` keeps it. Prefer the smallest change that keeps the auto-mode entrypoint. If that is impossible, move to a mixin kit on the built-in `claude` agent and rely on the managed settings for auto mode; then V26 must show what the template's `--dangerously-skip-permissions` does under `disableBypassPermissionsMode: "disable"`, and the change needs the author's decision before it lands.
2. Docs: `docs/agents/sandbox.md` (kit, Claude login), ADR-0013 ("Outcome of T03" gets the finding and the fix), `docs/infra-current-state.md` (V26 and V24 notes, change log), this task's row and place in `docs/tasks/README.md` and `docs/tasks/plan.md` (T05 now depends on T21).

## Out of scope
The rest of T05 (connectors, cloud probes, Remote Control, where the login is stored beyond what T21-H2 shows).

## Human steps

- **T21-H1, inspect the kits (5 min).** In `agent-session`: `sbx kit inspect claude` and `sbx kit inspect ./sandbox/kit` (from `~/januslin.me`). Send the output.
- **T21-H2, re-create the sandbox from the PR branch's kit and log in (15 min).** In `agent-session`, after checking `sbx exec januslin git status` and `git branch -vv` inside the VM show nothing unpushed: `sbx rm januslin`, then the `sbx create` command in `docs/agents/sandbox.md` with the PR's `sandbox/kit` (fetched into a scratch directory, not the host clone; the agent gives the exact commands). Then `sbx run --name januslin`, `/login`, and `/permissions`. Send: whether the login worked, what `/permissions` shows, and `sbx exec januslin printenv SBX_CRED_ANTHROPIC_MODE`. Re-run the T03 canary afterwards.
- **T21-H3, after merging (10 min).** Re-create `januslin` once more from `main`'s kit the same way, so the sandbox runs only merged code, and log in again. Then continue with T05-H5.

## Acceptance criteria
- [ ] In a sandbox created from the PR's kit, `/login` succeeds and `/permissions` shows auto mode (manual, T21-H2).
- [ ] The fake `authorization_code` request from that sandbox reaches Anthropic instead of being refused by the proxy (manual, command output).
- [ ] `/etc/claude-code/managed-settings.json` in the VM still disables bypass mode (manual, command output).
- [ ] The finding, the fix, and the evidence are in ADR-0013, `docs/agents/sandbox.md`, and `docs/infra-current-state.md`.

## Automated verification
- None: `sbx` runs only on the author's Mac. All criteria are manual with command output in the PR.
