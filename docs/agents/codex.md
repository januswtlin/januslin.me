# Codex dispatch and pending sandbox acceptance

Updated: 2026-11-04 · Task: [#56](https://github.com/januswtlin/januslin.me/issues/56)

The author's verified 2026-11-04 comment on #56 amends the original body:
Codex logs in inside the existing VM; GitHub uses the mounted role-token fallback;
role bot names come from `identity.json`. [ADR-0018](../decisions/ADR-0018-codex-in-vm-login.md)
records that decision and the risk of a VM-readable subscription credential.
#72 no longer gates local dispatch. Criteria 1–2/#72, cloud/V10/#75, phone
steering, and template save/#74 belong to follow-up #112; #73 is no longer needed.

T06 closes only after the author's human verification of V8, V22/V28, V29,
V30, and the reverse review using the PR evidence. The current evidence and its
limits are in [the acceptance report](../reports/T06-sandbox-acceptance.md).
The coordinator supplies V30/reverse-review links and arranges independent
review of the final head. Reports and fake tests do not authorize closing #56.

## Runtime candidate and sources

The installed runtime is Codex 0.166.0 in the existing Claude-template VM,
`agent-vm`. The coordinator calls it there; no AI binary or login runs in the host
`agent` shell. The host only uses `sbx` and the reviewed token-broker scripts.
Python 3.11 or later is a dispatcher/test prerequisite (stdlib only), along with
git and the existing `agent-gh`/T08 scripts. Check it before installation.

Historical source comparison (rechecked 2026-11-02; release metadata retains
its preparation date). The host-proxy candidate below is superseded by ADR-0018:

- [Official non-interactive mode](https://learn.chatgpt.com/docs/non-interactive-mode)
  documents stdin prompts, JSONL, schema output, and exact-session resume.
  [CLI flags](https://learn.chatgpt.com/docs/developer-commands#codex-exec) say
  `--approve-for-me` selects workspace-write, on-request approvals, and automatic
  review. It conflicts with `--sandbox`. The issue's combined example is stale;
  the dispatcher uses `codex exec --approve-for-me` without `--sandbox` or bypass.
  The same outer exec option precedes `resume`; V29 must verify the stable CLI's
  effective permissions on both paths. No model or reasoning override is passed.
- [Managed configuration](https://learn.chatgpt.com/docs/enterprise/managed-configuration#admin-enforced-requirements-requirementstoml)
  distinguishes local requirements from ordinary defaults. Personal ChatGPT
  access does not establish enterprise cloud-managed policy. V8 must show which
  local requirements take effect. VM root can change them, so they are defaults
  against accidents and injection, not a boundary against a determined agent.
- [Official release 0.166.0](https://github.com/openai/codex/releases/tag/rust-v0.166.0)
  is the latest stable returned by the unauthenticated releases API at preparation
  time (published 2026-10-29). Pin the candidate install to it; recheck stable
  releases when executing the runbook. The desktop-bundled
  `0.166.0-alpha.5.1` is not this stable runtime and was not installed or used.
- [Docker Codex](https://docs.docker.com/ai/sandboxes/agents/codex/) documents host
  OAuth and a separate Codex template whose default entrypoint bypasses approvals.
  This project does not invoke that default. Docker's
  [v2 kit schema](https://docs.docker.com/ai/sandboxes/customize/kits-v2/) and
  [credential bindings](https://docs.docker.com/ai/sandboxes/configuration/credentials/#credential-bindings)
  permit declaring OAuth in a mixin. The independently written candidate
  `sandbox/codex-proxy/spec.yaml` declares only `auth.openai.com` and `chatgpt.com`
  as OAuth endpoints; it adds no API-key path or network rule.
  Its transport config uses the proxy sentinel approach described in
  [Docker's Codex kit](https://github.com/docker/sbx-kits-contrib/blob/main/codex/spec.yaml).
  That preparation did not establish compatibility or proxy isolation. ADR-0018
  now selects the in-VM login route; this mixin was not selected or installed
  by this implementer.

The current [codex-plugin-cc README](https://github.com/openai/codex-plugin-cc)
describes an app-server wrapper, not the older direct-exec implementation. It
supports background jobs, rescue/resume, transfer, and interactive review; it
inherits local configuration. It does not document per-dispatch sandbox and
approval flags or this project's schema/claim/identity contract. We choose
`codex exec` for that explicit contract, not because the plugin lacks delegation.
No plugin is installed and no Stop-hook review loop is enabled.

## Dispatch contract

Run the checked-out script from a dedicated clean linked worktree inside the VM,
after the coordinator checks the main watch and authorizes the role. It must share
the trusted script checkout's git common directory and be the current directory's
exact root; the primary checkout, `main`, and unrelated repositories are refused.
A start worktree begins at detached current `origin/main`; it must not already
contain the task branch. Prepare a separate clean reviewer worktree at the exact
PR head and use a fresh context for `review`.

```sh
scripts/codex-dispatch.sh start 56 platform
scripts/codex-dispatch.sh resume <recorded-session-uuid> /absolute/private/findings.md
scripts/codex-dispatch.sh review <pr-number>
```

These are interface examples; use the existing claim for in-progress #56. Supported
implementer roles are `platform`, `site`, `upgrade`, and `seo`; the approved issue's
Role and Branch must match. `start` calls T08 `work-status.sh check` immediately
before claiming the task. Missing T08, an unapproved or blocked issue, an existing
remote branch/PR, malformed API data, and an existing local task branch all stop
the run. There is no bootstrap flag to bypass these checks.

Claims are under `~/.local/state/januslin-agent/codex-dispatch/` by default. An
absolute `JANUSLIN_CODEX_STATE_DIR` can select another private VM-local state
directory, shared by all coordinator worktrees; it is not a token directory or a
host mount. Existing state/claim directories must be owned by the process user,
mode 0700, with no symlink components. State files must be regular, singly linked,
owned by that user, mode 0600; result reads reject symlinks. Exclusive claim
creation prevents duplicate starts across processes. A per-claim lock prevents
concurrent resumes. Review claims are per PR and exact head SHA, independent of
implementation claims: an existing PR is the expected review target.

`AGENT_TOOL=codex` sets commit attribution. Role selects `JANUSLIN_GITHUB_APP` and
the trusted prompt: implementers use `scripts/agent-gh januslin-agent`, reviewers
use `scripts/agent-gh januslin-reviewer`. Inherited GitHub token variables are
removed from the CLI environment. Actual tokens still come from the mounted
role files through the helper. These are routing defaults, not an identity
security boundary: both role tokens are readable in this VM (ADR-0009).
The coordinator verifies the posted actor using `sandbox-config/identity.json`;
a model's claim that it used the correct identity is insufficient.

Issue/PR JSON is serialized as context and never executed, sourced, or interpolated
into shell commands. Only a startable T08-approved task snapshot supplies the
implementation spec. The prompt requires the agent to stop if the issue changed
after the snapshot; external comments remain data until their author/edit history
is checked. Review PR metadata is data, never an implementation instruction.

The output envelope contains `status`, `session_id`, `record_file`, and
`result_file`. Only exit 0, a completed turn, an observed valid session ID, and a
locally schema-validated result produce `reported`. That means a report arrived;
it does not mean tests passed, the GitHub actor was verified, independent review
approved, CI passed, or the task is complete. The coordinator reads the private
result and checks every claim. `scripts/codex-result.schema.json` fixes the PR
repository, verification summary, handoff fields, blockers, and review verdict.
The stdlib validator rejects unsupported schema keywords rather than silently
ignoring a future schema change.

Prompts and findings go on stdin, never argv. Raw CLI stdout/stderr is not replayed
or logged by the wrapper; only thread IDs and completion/error categories are
consumed. Private result files can still contain model/tool output, including
accidentally echoed input or secrets, and Codex maintains its own session logs.
Do not publish raw files. Review and redact before copying evidence to a public
PR; keep the UUID, verification evidence, and handoff in the PR. Retain private
claims until the task/PR is resolved; do not automatically delete a failed claim.

## Recovery

No failure automatically retries, creates a new thread, or falls back to bypass.
An observed SIGINT, SIGTERM, or SIGHUP is reported as `interrupted` even if the
child subsequently emits completion and exits zero. Its result is withheld;
the retained UUID and claim still require deliberate coordinator recovery.
Interruption also takes precedence over an earlier `login_required` or
`quota_exhausted` event in that run.
`interrupted`, `incomplete`, and `invalid_result` keep the claim and any observed
UUID. Resume that exact UUID from its original worktree with a local findings
file; never `--last`. The private record retains the original issue title/body/
last-edit snapshot or PR head metadata unchanged, and includes it with findings
in the resume prompt. Task resume compares the current T08 snapshot and permits
only normal existing-branch/PR claim reasons; changed approval, dependencies,
assignment, unknown reasons, or a changed snapshot stop it. It does not require
branch absence again. Review resume rechecks the live PR head and local checkout;
a changed head requires a new exact-head review claim. The coordinator still
rechecks main integrity and continuing authorization before resuming.

`login_required` stops Codex routing. Ask the coordinator for an author-only
in-VM login human task using [codex-login.md](../runbooks/codex-login.md) on reviewed
`main`. Do not reuse retired #73, perform login as an agent, or work around it. `quota_exhausted` routes to Claude or waits, preserving
the branch/PR and UUID. Errors that do not arrive as structured login/quota events
remain `interrupted`; diagnose deliberately without dumping auth/session logs.
If dispatch fails before an ID arrives, inspect the private claim, branch, PR, and
Codex's session list locally. Do not remove the claim and restart blindly. If the
session cannot be recovered, the coordinator authorizes a new context continuing
the existing PR and records which claim it supersedes; it does not start a second
implementation of the task. A `running` claim after a hard crash likewise requires
checking the original process before resume.

If runtime sandbox/approval checks fail, record the exact failure, version,
effective configuration, and sanitized evidence. No automatic full-access or
second-sandbox fallback is selected. The author must approve a changed security
boundary before it is used. The old OAuth mixin's availability no longer gates
this approved in-VM route.

Inventory author-completed setup before repeating any step. Local runtime and
recovery procedures are [codex-runtime.md](../runbooks/codex-runtime.md) and
[codex-login.md](../runbooks/codex-login.md). #73 is retired by the amended spec;
connection/cloud/template work is #112. Do not start a cloud task from the VM.

## Acceptance ledger

Evidence: [T06 sandbox acceptance](../reports/T06-sandbox-acceptance.md).
Recorded observations await the author's human verification; they are not a
completion decision.

| Probe | Required evidence under the amended spec | Status / evidence |
|---|---|---|
| Human connection | Machine account `isweichen`, repository restriction, author grant revocation, permissions, connector decisions | MOVED to #112 (criteria 1–2, #72); not a local dispatch gate |
| OpenAI egress | Actual permitted hosts, ports and rule scope from the author's policy listing | OPEN INVENTORY GAP: in-VM Codex uses OpenAI destinations allowed by the live policy but absent from the allowlist; V19/V22/V28; coordinator requests read-only policy output through a human task, no guessed rows |
| V8 | Config/requirements paths, effective defaults, disabled apps/plugins/gateway, ordinary override and personal-account limits | RECORDED: 0.166.0 feature/MCP checks and both turn contexts; no requirements at checked paths; CLI overrides succeed; author verification pending |
| V22/V28 | Approved in-VM login, mounted GitHub token fallback and risk | RESOLVED BY RECORDING: ADR-0018; no sentinel-isolation claim; #73 no longer needed; author verification pending; template persistence moved to #112/#74 |
| V29 | Start and this exact-session resume workspace-write/on-request/auto_review, git denial and reviewed commit/push, API actor IDs | RECORDED in report and PR handoff; start actor 352218417; resumed decision commit 9c8cceb and its push verified as actor 352218417; author verification pending |
| V30 | Dispatch report, independent Claude review, exact-session findings resume, fix, coordinator report, CI URL once CI exists | COORDINATOR EVIDENCE PENDING: PR #114, round-one review 5764059589, same UUID resumed; final coordinator report/re-review links outstanding; CI does not yet exist |
| Reverse review | Codex reviews a Claude PR; API review actor matches active reviewer ID 352219106 | COORDINATOR EVIDENCE PENDING |
| V10 | Author-started cloud identity/push/private-repo/main/workflow probes | MOVED to #112/#75 |
| Phone steering | Tested phone cloud/local routes | MOVED to #112 |
| Template | Save/re-create and persistence | MOVED to #112/#74 |



`sh tests/scripts/codex-dispatch/test.sh` exercises only the fake CLI. It proves the
wrapper's contract and refusal paths, not any live row. V30 requires the other
tool's independent review; a same-tool local bootstrap code review alone does not
fulfill that acceptance criterion.
