# T21: Claude login in the sandbox (credential binding)

- Role: Platform Engineer
- Depends on: T03 · Human steps: T21-H1, T21-H2
- Identity: machine account (`januslin-agent`, a cloud session the author started), because the sandbox's Claude Code could not log in until this was found
- Branch: the cloud session's branch (the vendor forces its prefix)
- Size: S
- Runs on: a Claude Code cloud session, with the author running the host checks in `agent-session`. Nothing else runs in parallel.

## Goal
`/login` inside the sandbox `januslin` succeeds, the way to make it succeed is documented for every later re-creation of the sandbox, and V24 (where the login is stored) and V26 (auto mode) are recorded from the first working login.

## Background (found 2026-10-30, `sbx` v0.50.1, during T05-H5)
- `/login` in `januslin` completed in the browser, then failed in the VM with `OAuth error: Request failed with status code 401`.
- No `sbx` secret was set, the allowlist matched `docs/agents/sandbox.md`, and `SBX_CRED_ANTHROPIC_MODE=none` in the VM.
- The `sbx` proxy answers token requests to `platform.claude.com/v1/oauth/token` itself. From `januslin`, a fake `authorization_code` request got `proxy: OAuth refresh denied (no authorizing binding)`. From a throwaway sandbox of the built-in `claude` agent, the same request reached Anthropic (`invalid_request_error`), and `/login` succeeded there. `sbx ls` showed the agent of `januslin` as `januslin`, not `claude`.
- Docker's [credential bindings](https://docs.docker.com/ai/sandboxes/configuration/credentials/#credential-bindings) explain it: a third-party kit that extends a built-in agent may use the inherited credentials only with an approved binding in `~/.config/sbx/credentials.yaml`; `sbx` asks for it on the first interactive run, and without one the credential is withheld. T03 created the sandbox without that prompt.

## Read first
`AGENTS.md`, ADR-0013, `docs/agents/sandbox.md`, `sandbox/kit/spec.yaml`, `docs/infra-current-state.md` (V24, V26), the T03 and T05 task files.

## Scope
1. Confirm the cause and the fix with the author's host checks (T21-H1, T21-H2). The kit stays as it is.
2. Docs: `docs/agents/sandbox.md` (the binding as a step before creating the sandbox; the Claude login row; V24's result next to the author's acceptance), ADR-0013 ("Outcome of T03" and Consequences), `docs/agents/local-agent-account.md` ("Tool logins"), `docs/infra-current-state.md` (V24, V26, change log), and this task's row and place in `docs/tasks/README.md` and `docs/tasks/plan.md`. T05 now depends on T21.

## Out of scope
The rest of T05 (connectors, cloud probes, Remote Control, worktree subagents). Changing the kit.

## Human steps

- **T21-H1, inspect the kit (5 min, done 2026-10-30).** In `agent-session`: `sbx kit inspect ./sandbox/kit`, `sbx ls`. Result: kit `januslin`, kind `sandbox`, binary `claude`, run options `--permission-mode auto`; the sandbox's agent is `januslin`.
- **T21-H2, write the binding and log in (15 min, done 2026-10-30).** In `agent-session`: write `~/.config/sbx/credentials.yaml` as in `docs/agents/sandbox.md` ("Starting it"), repeat the fake token request (it now reaches Anthropic), `sbx run --name januslin`, `/login`, then the V24 and V26 checks the agent gives (no token values in any output).

## Acceptance criteria
- [ ] The fake `authorization_code` request from `januslin` reaches Anthropic instead of being refused by the proxy (manual, command output).
- [ ] `/login` in `januslin` succeeds (manual, T21-H2).
- [ ] V24 recorded: where the tokens live, from `sbx secret ls` and the length of the VM's access token (manual).
- [ ] V26 recorded: the mode Claude Code shows in `januslin`, and `/etc/claude-code/managed-settings.json` in the VM (manual).
- [ ] The binding step, the finding, and the evidence are in `docs/agents/sandbox.md`, ADR-0013, and `docs/infra-current-state.md`.

## Automated verification
- None: `sbx` runs only on the author's Mac. All criteria are manual with command output in the PR.
