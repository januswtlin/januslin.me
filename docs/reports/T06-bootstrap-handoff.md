# T06 local bootstrap handoff

Prepared 2026-11-01 for [#56](https://github.com/januswtlin/januslin.me/issues/56).
Branch: `agent/platform/T06-codex`; base: `0f7c745770256c658fc8fdbeb562b63e21520e10`.
Tests-first commit: `f765796` (`test: cover Codex dispatch and recovery contract`).

This is code/runbook preparation, not completed T06. The author explicitly
permitted local preparation while #55 is incomplete and separately allowed the
coordinator to push new bootstrap branches using author SSH. No PR, issue write,
review request, real Codex run, installation, login, host kit change, network
policy change, cloud setup, token/key access, or App operation was performed by
this implementer. A later preparation/runbook PR should reference #56 without
`Closes #56`; only the final live-completion PR may close the task.

## Delivered

- VM-only `scripts/codex-dispatch.sh` plus Python stdlib orchestration and result
  schema. Start uses T08, role/branch checks, a clean secondary worktree at detached
  `origin/main`, and persistent task claims. Review has a separate per-PR/head
  claim, an exact-head worktree, and the reviewer helper. Resume requires the
  exact recorded UUID, original worktree/context, retained task authorization
  and snapshot, or unchanged review head. No model override or automatic retry.
- `--approve-for-me` precedes resume and is not combined with `--sandbox` or
  bypass. Prompts/findings use stdin. Wrapper stdout is a status/UUID/private-path
  envelope; no raw CLI event/error/model output is replayed. Results are private
  and untrusted, not proof of identity, successful tests, review, CI, or completion.
- Fake CLI coverage discovered by the existing `tests/scripts/run.sh` glob;
  project defaults; Python VM-prerequisite check; CODEOWNERS coverage; narrow
  uninstalled OAuth mixin and VM transport-config candidate. No package dependency.
- Updated sandbox/workflow/security/admin/infra/operations docs, candidate
  runtime/cloud runbooks, and connection/login/template/re-creation/revocation
  guidance. Current primary sources and pending evidence fields are in
  `docs/agents/codex.md`. Stable 0.166.0 was verified through public release
  metadata; no alpha was pinned or installed. The plugin comparison reflects its
  current app-server implementation.

## Verification

`sh tests/scripts/codex-dispatch/test.sh`: 15 fake-only test methods passed.

| Contract | Evidence |
|---|---|
| stdin/permissions/schema/private artifact contract | `test_start_uses_stdin_permissions_schema_and_private_results` |
| exact UUID and retained policy on resume | `test_resume_uses_exact_session_stdin_and_permissions` |
| role-specific review and independent claims | `test_review_has_own_claim_and_reviewer_identity` |
| absent T08, blocked task, duplicates, malformed arguments | `test_fails_closed_without_gate_or_startable_task`, `test_duplicate_start_is_refused_even_after_interruption`, `test_invalid_arguments_do_not_call_cli` |
| isolated checkout and role/branch constraints | `test_requires_isolated_clean_worktree_root`, `test_wrong_role_and_local_branch_refused` |
| interruption/login/quota classification | `test_nonzero_reports_interruption_login_or_quota_with_session` |
| invalid/incomplete/missing/symlink result rejection | `test_rejects_invalid_missing_incomplete_and_symlink_results` |
| private state, unknown session, findings path protection | `test_rejects_symlink_or_public_state_and_unknown_session`, `test_resume_rejects_symlinked_findings_parent` |
| retained task authorization and review-head validity | `test_resume_refuses_changed_task_snapshot`, `test_resume_rejects_lost_authorization_hidden_by_claim`, `test_resume_review_refuses_changed_head` |

The initial tests failed on the base with missing `scripts/codex_dispatch.py`.
The isolated-worktree and symlinked-findings-parent regressions each failed
before their review fixes. A temporary copied-tree mutation removing the schema
verification-status enum also failed as expected:
`AssertionError: 0 == 0 : bad-schema` / `FAILED (failures=1)`.
No mutation or weakened check remains in the implementation tree.

Full default macOS `/bin/sh` gate exited 1 with the same 12 pre-existing
`sandbox-session` fixture failures reported at baseline (temporary function
assignment leakage in the fake `FAKE_REWRITE` environment). Agent scripts,
januslin-keys, token broker, and all 15 new methods passed. That unrelated fixture
was not changed. Full POSIX gate using `/bin/dash` and a temporary PATH-local
`sh` symlink to `/bin/dash` exited 0. This is alternate-shell evidence, not a claim
that the default command is green or that Linux/microVM acceptance ran.

Shellcheck passed for the new shell entry points; Python AST parsing, JSON syntax,
and `git diff --check` passed. The macOS system Python lacked `tomllib`; the
coordinator then used the existing pyenv Python 3.11.2 stdlib `tomllib` to parse
both `.codex/config.toml` and `sandbox/codex-proxy/config.toml` successfully and
assert workspace-write/on-request/auto_review plus the absence of model and
reasoning-effort overrides. This is configuration syntax/value evidence only;
effective Codex configuration remains a live V8/V29 check. `pnpm verify` does not
exist on this base.

## Review and remaining handoff

The coordinator initiated an independent fresh review. Its confirmed worktree
finding was fixed and the resume-context/authorization recommendations were
addressed with regression coverage. The coordinator records the final verdict
against the final committed SHA before pushing the candidate branch. No
GitHub-hosted review or cross-tool V30 verdict is claimed by this local review.

All live acceptance remains PENDING: connection/connector decisions, V8, V10,
V22, V28, V29, V30, reverse Codex review of a Claude PR, real GitHub actor IDs,
template persistence, actual selected-model/proxy approval behavior, and phone
steering. `docs/agents/codex.md` has individual evidence fields. A listed config
or passing fake test never resolves a live criterion.

The normal runtime path requires completed #55, approved #56, and new runbooks
merged to `main`. If Claude quota prevents finishing #54/#55 and Codex must do
that work, the author first needs a separate explicit bounded authorization of
the exact independently reviewed host OAuth-binding/mixin/restart and VM
install/probe steps on the pushed candidate. The current preparation/SSH
exception does not authorize them. `docs/runbooks/codex-runtime.md` records that
decision point; neither path has been executed. A kit-add compatibility failure
is recorded as a blocker, not silently treated as permission for the conditional
second-sandbox fallback or full access.

After actual VM prerequisites pass, use the coordinator's separately reviewed
[durable microVM takeover prompt](https://github.com/januswtlin/januslin.me/blob/677f9e177ae84532811cb658fff1d523781a0f96/docs/agents/microvm-codex-handoff.md).
It lives on the T08 bootstrap commit, not this T06 base. It does not itself grant
new host authority, satisfy dependencies, or complete T06.
