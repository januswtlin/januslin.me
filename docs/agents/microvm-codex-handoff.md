# Codex handoff to the existing microVM

Prepared on 2026-11-01. Paste the prompt below into Codex **inside the existing `januslin` microVM**, after its installation, login, and permission setup have been checked. This document does not install or authenticate Codex. The procedures the author runs remain the runbooks on reviewed `main`.

## State to recover

| Work | State at handoff |
|---|---|
| #54 / T08 | Code pushed to `agent/platform/T08-work-status`; reviewed implementation head `b689eb561c386a6e85df68a74291e79ba01c93f0`. Later commits on that branch may add this handoff. Live acceptance and PR publication remain pending. |
| #55 / T04 | Not implemented by this session. Do not skip it. |
| #56 / T06 | Local bootstrap preparation is authorized. Candidate branch: `agent/platform/T06-codex`; inspect whether it exists and what it contains before relying on it. Installation, authentication, sandbox, cloud, phone, and end-to-end probes are not proven by local code. |

The author authorized one bootstrap exception: preparation in the personal macOS account, and use of the author's SSH identity to push new bootstrap branches. That exception does not authorize author credentials in the microVM, `main` pushes, merges, repository settings, or treating unfinished acceptance as complete. The author also authorized preparing #56 before its dependencies merge; normal dispatch rules and runtime approval checks remain unchanged.

## Prompt

```text
You are the coordinator continuing januswtlin/januslin.me inside the existing
januslin Docker Sandbox microVM. The author asked Codex to take over because
Claude's weekly quota was exhausted. Continue the existing work; do not restart
the project or duplicate its branches and PRs.

Read AGENTS.md fully, then docs/overview.md, docs/agents/roles.md,
docs/agents/workflow.md, docs/agents/sandbox.md, docs/security.md,
docs/infra-current-state.md, the plan issue #53, and task issues #54, #55, #56.
Read the relevant ADRs and each task's Read first list. Recover actual state
from GitHub and the VM; this handoff is a dated snapshot, not current evidence.
Apply AGENTS.md's rules for trusted author actions and edited GitHub text.

First check the execution environment and identities:
- Confirm you are in the microVM, not the personal macOS account or host Agent
  shell. If not, stop environment-dependent work and report the mismatch.
- Confirm Codex login and its workspace-write/automatic-review configuration
  using the installed CLI and the applicable T06 probes. Do not assume an
  existing session proves OAuth isolation or sandbox enforcement.
- Read active App names/IDs from the mounted sandbox-config/identity.json.
  Use scripts/agent-gh and the installed git credential helper. The role names
  januslin-agent and januslin-reviewer are helper aliases, not necessarily the
  active bot names. Never use plain gh with the author's login, inspect a key,
  print a token, or copy credentials from the host.
- If a login, token, network rule, or required tool is unavailable, report the
  exact blocker and use the existing human-task/runbook process. Never loosen
  sandboxing, add broad network access, or switch credentials as a workaround.

Recover the branches without disturbing existing work:
- Check git status, worktrees, open PRs, remote branches, and current main.
  Keep the coordinator checkout on main; use an existing suitable worktree or
  a separate task worktree for implementers and reviewers.
- Fetch agent/platform/T08-work-status. Confirm that the reviewed code head
  b689eb561c386a6e85df68a74291e79ba01c93f0 is present in its history. Inspect any
  later changes rather than assuming they were part of the original review.
- Check whether agent/platform/T06-codex exists. Read its committed handoff
  and verification evidence if present. A branch is a candidate implementation,
  not evidence that T06's live probes passed.
- Do not recreate tasks that already have a branch or PR. Missing bootstrap
  branches must be reported rather than silently replaced.

Finish #54 first:
1. Dispatch a Platform Engineer to the existing T08 task branch. As coordinator,
   do not implement feature changes yourself. Use a separate fresh-context
   reviewer; if independent execution is unavailable, report that limitation
   instead of calling self-review independent.
2. Read docs/reports/T08-work-status-verification.md. Local evidence was:
   53 focused checks; syntax, ShellCheck, and diff checks; 18 detected mutation
   classes; 14 generated GraphQL queries validated against the official schema.
   These were personal-account fixture/schema checks, not live VM acceptance.
   The complete suite passed under explicit dash at 1fb6ffc. Later output-only
   and test changes passed focused checks. Default macOS sh had 12 pre-existing
   sandbox-session fixture failures; existing tests were not changed.
3. Run sh tests/scripts/run.sh in the actual supported VM environment, plus
   any relevant focused/static checks. pnpm verify does not exist until T07.
   Record the actual head, platform, commands, exit codes, and failures.
4. Execute scripts/work-status.sh next and human against the real repository
   using the implementer App. Verify the plan order and queue. Find a genuinely
   unapproved task, run check for it, and record exit 3 and its JSON reason
   records. Do not alter approval labels to manufacture a passing example.
   A resumed T08 branch may correctly be reported as in-progress; that is not
   authorization to dispatch another copy. Direct authorization to resume this
   existing bootstrap does not make unapproved future tasks startable.
5. Replace pending live evidence in the verification report and PR body with
   observed results. Keep synthetic, schema, and live evidence distinguishable.
   Fix real failures within the workflow's self-repair limits. Obtain independent
   review of substantive changes, including evidence/documentation changes.
6. Open or update the task PR using .github/pull_request_template.md and
   Closes #54. Reviewer posts through the reviewer App; request the author's
   review only after required gates and acceptance are satisfied. If ci does
   not yet exist, say so rather than inventing a run link. Never merge.

After the author merges #54, verify the merger and issue-close actor, update
main, and complete #55 through its own Platform Engineer, tests, independent
review, and author merge. Do not silently omit #55 to reach #56 sooner.

Then finish #56 from its prepared candidate branch, if present. Reconcile it
with current main by merging main (no rebase or force push), rerun checks, and
complete every still-pending live criterion: account/connector isolation,
OAuth/proxy behavior, same-VM sandbox/automatic review, correct App push/review
actors, install/template persistence, cloud/phone probes the author starts,
and dispatch -> independent review -> exact-session resume -> fix -> report.
Use current official documentation and the installed stable CLI. Never assume
the personal-account desktop CLI's prerelease build is the VM's release.
Select a fallback only from actual probe evidence and required author decisions.

The final report must distinguish completed code, observed live acceptance,
independent-review verdicts, open human tasks, and the author's next action.
Keep durable knowledge in the repo/issues, not only in this chat. Continue the
authorized work between the author's merges within AGENTS.md's boundaries.
```
