# Codex dispatch and pending sandbox acceptance

Prepared: 2026-11-01 · Task: [#56](https://github.com/januswtlin/januslin.me/issues/56)

This is a local bootstrap candidate, not completed T06 acceptance. The author
explicitly authorized preparing code and runbooks in a local checkout before
#55 is completed. That temporary preparation exception does not authorize a live
task dispatch, bypass approval, satisfy a dependency, or select the fallback.
Do not close #56 or describe the runtime as working from these fake tests.

## Runtime candidate and sources

The preferred candidate installs Codex in the existing Claude-template VM,
`januslin`. The coordinator calls it there; no AI binary or login runs in the host
`agent` shell. The host only uses `sbx` and the reviewed token-broker scripts.
Python 3.11 or later is a dispatcher/test prerequisite (stdlib only), along with
git and the existing `agent-gh`/T08 scripts. Check it before installation.

Verified documentation on 2026-11-01:

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
  Compatibility with this Claude kit, automatic review, subscription entitlement,
  selected model, and sbx 0.50.1 remains unproven until V22/V28/V29.

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

These are interface examples, not permission to dispatch blocked #56. Supported
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

`login_required` stops Codex routing. Queue the existing login human task or ask
the coordinator to raise one; the author repeats the host OAuth runbook only after
the connection is confirmed. `quota_exhausted` routes to Claude or waits, preserving
the branch/PR and UUID. Errors that do not arrive as structured login/quota events
remain `interrupted`; diagnose deliberately without dumping auth/session logs.
If dispatch fails before an ID arrives, inspect the private claim, branch, PR, and
Codex's session list locally. Do not remove the claim and restart blindly. If the
session cannot be recovered, the coordinator authorizes a new context continuing
the existing PR and records which claim it supersedes; it does not start a second
implementation of the task. A `running` claim after a hard crash likewise requires
checking the original process before resume.

If V28 or V29 fails, record the exact failure, version, effective configuration,
and sanitized evidence. The separate Codex-template sandbox and narrow host
launcher described in #56 is a conditional fallback that has not been selected or
built. The author must approve any move to danger-full-access; no script switches
to it. The VM cannot create that second sandbox. Missing support for adding the
OAuth mixin is a concrete blocker to resolve with the author, not evidence of
Codex sandbox failure.

The normal runtime setup waits for #55 and a reviewed-main runbook. If Codex is
needed to finish #54/#55 because Claude quota is exhausted, an additional explicit
author decision is necessary for the exact reviewed bootstrap host/VM steps;
preparation/push authorization alone does not permit them. See
`docs/runbooks/codex-runtime.md` before proposing that bounded exception.

## Acceptance ledger (all live rows pending)

Record sanitized evidence in the eventual PR/handoff and update
`docs/infra-current-state.md` only after the observations exist.

| Probe | Required evidence | Status / evidence |
|---|---|---|
| Human connection | GitHub connection machine account numeric ID 349746030; author grant revoked; permissions including Workflows, Secrets, Variables; connector names and decisions | PENDING |
| V8 | Effective config/requirements paths, disabled app/plugin/gateway tools, attempted ordinary override outcome; personal account limitations | PENDING |
| V22 | Host OAuth listing; whether current sbx accepts scoping (0.50.1 help says global only); approved binding domains; VM sentinel-only check without printing values | PENDING |
| V28 | Stable version and subscription-backed inference in Claude kit; model retained; proxy replacement; no real auth token in VM; save/recreate preserves binary and measured config/session state | PENDING |
| V29 | Start and exact-session resume both workspace-write/on-request/auto_review; file edit; `.git` write/commit/push escalation; push actor ID and Agent trailer; denial/interruption observed without bypass | PENDING |
| V30 | Claude dispatch classifier allowed/blocked; real task PR; independent Claude review; exact-session findings resume; fix commit; coordinator report; exact-head CI URL once CI exists | PENDING |
| Reverse review | Codex reviews a Claude PR; posted review actor equals active reviewer bot numeric ID | PENDING |
| V10 | Author-started phone cloud task; push capability vs Create PR; API push/commit/PR identities; private repo denial; main push denial; harmless workflow branch push | PENDING |
| Phone steering | Cloud UI on actual phone; local guidance through existing Claude Remote Control; any direct local Codex route tested and named | PENDING |

`sh tests/scripts/codex-dispatch/test.sh` exercises only the fake CLI. It proves the
wrapper's contract and refusal paths, not any live row. V30 requires the other
tool's independent review; a same-tool local bootstrap code review alone does not
fulfill that acceptance criterion.
