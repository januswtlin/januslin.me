# T06 local sandbox acceptance evidence

Recorded: 2026-11-04 · [PR #114](https://github.com/januswtlin/januslin.me/pull/114)
· Session UUID: `01a1a528-db91-7bb0-b671-046b6397a92c`

## Authority and scope

The implementer ran `scripts/work-status.sh author-activity --since
2026-11-04T05:49:00Z` successfully (exit 0). Its trusted-author output includes
#56's amendment, comment node `IC_kwDOVbvt8s8AAAABis11Uw`, created and updated
2026-11-04T05:50:15Z. The workflow verifies author numeric ID 2433928 and paginates
edit history; this comment was never edited. The issue body's last edit remained
`2026-10-31T09:19:13Z`, matching the dispatch snapshot, when rechecked this round.
The developer's identical comment was not used as authority.

[ADR-0018](../decisions/ADR-0018-codex-in-vm-login.md) records the author's approved
in-VM subscription login and mounted GitHub role-token fallback. V22/V28 are
resolved by that record and its risk, subject to the author's verification; no
host OAuth or sentinel-isolation result is claimed. No authentication-file
contents were read, and no login, host-key access, host setting change, connector
call, or cloud/scheduled session was performed during this round.

Connection/connector criteria 1–2/#72, cloud/V10/#75, phone steering and template
save/#74 moved to #112; #73 is no longer needed. The designated follow-up machine
account is `isweichen`, restricted to this repository. Its connection is not
proved by this local run. Only the author closes tasks or merges PRs.

## OpenAI egress inventory gap

Working in-VM Codex login/inference requires OpenAI destinations permitted by
the live policy. Those hosts and their rule scope are not yet listed in the
sandbox allowlist. V19/V22/V28 explicitly retain this inventory gap alongside
the recorded authentication decision. The coordinator requests the author's
`sbx policy ls agent-vm --wide` output through a human task using the existing
read-only Check in `allow-sandbox-host.md`. No host rows were guessed or policy
changes performed; successful inference alone does not identify the rules.

## Login recovery command verification (round two)

`codex login --help` lists `--device-auth` in 0.166.0. Official authentication
guidance recommends it for a headless environment; completing device-code login
here remains untested. The implementer ran only the read-only
`codex login status`: exit 0, `Logged in using ChatGPT`, no email or token in that
output. No login or authentication-file read was performed. The revised runbook
uses the established host `agent-session` then `sbx exec -it agent-vm bash -l`
route; this author-only entry route was inspected, not executed by the agent.

## V8: measured defaults and their limits

`codex --version` returned `codex-cli 0.166.0`. Non-model local checks:

| Check | Observation |
|---|---|
| `/home/agent/.codex/config.toml` | Present; whitelisted settings read: workspace-write, on-request, auto_review; apps/plugins false |
| Project `.codex/config.toml` | Present and loads after #113; same policy/feature defaults; gateway enabled=false with transport URL |
| `/etc/codex/managed_config.toml` | Absent |
| `/etc/codex/requirements.toml` | Absent |
| `/home/agent/.codex/requirements.toml` | Absent |
| `codex features list` | apps=false, plugins=false |
| `codex mcp list` | mcp-gateway disabled, no bearer-token environment variable |
| `codex -c features.apps=true -c features.plugins=true features list` | apps=true, plugins=true for this process; no config files modified and no tools invoked |

The project gateway entry appears in the effective MCP listing; the CLI loads
the project config as well as user defaults. The override demonstrates that
ordinary config is not an admin-enforced prohibition. No requirements were found
at the checked paths; this does not inventory every possible enterprise policy
source. Personal ChatGPT access does not establish enterprise-managed settings.
No connector, plugin, or gateway invocation was attempted: the evidence is the
effective CLI flags/listing, not a claim that every external tool is inaccessible.
VM root could also change local defaults. The author must verify whether these
limits meet V8's intent; do not describe them as a security boundary.

## V29: start and exact-session resume

Only `session_meta` ID and whitelisted `turn_context` permission fields were
extracted from the retained session metadata; no messages/prompts or raw session
file were copied into this report. Both turns use the UUID above:

| Turn | Sandbox | Approval policy | Reviewer | Network |
|---|---|---|---|---|
| Original implementation | workspace-write | on-request | auto_review | true |
| This findings resume | workspace-write | on-request | auto_review | true |

Original turn: workspace files were edited; an ordinary `git fetch origin main`
failed on read-only `FETCH_HEAD`. Automatic review then allowed the fetch,
authorized branch creation, tests-first and implementation commits, and the
branch push. No bypass/full-access flag was used. The API branch-creation event
for `e2401f9111d0a59e0e5c276a526b645a5c67e926` at 2026-11-04T06:08:24Z names
push actor `isweichen-agent[bot]`, ID 352218417.

Resume: opening the git index for writing without writing any bytes was refused
with errno 30 (read-only filesystem). An explicitly escalated fetch was allowed
by automatic review; current `origin/main` remains
`162b64b0fd725ccc0d0ade981e46c1b73dc91bf7`, already an ancestor of this branch,
so no merge/rebase was needed. Workspace documentation edits succeed within the
sandbox. Automatic review then allowed decision commit
`9c8cceb7639e8100838b3ee8a0bbb43924ba16e7` and its push through the existing
credential helper. The repository activity API returned a push at
2026-11-04T06:24:07Z for that exact SHA, actor `isweichen-agent[bot]`, ID 352218417.
This matches the active identity mount. The PR handoff records the final docs
head separately; permission metadata alone was not used as proof of a push.
No intentionally destructive command or main push was used as a denial probe.

The original signal-based regression experiment hung and was interrupted (exit
130). The committed regression instead invokes the registered interruption
handler and mocks process-group termination while fake Codex completes normally.
It failed before implementation (`incomplete` versus `interrupted`) and passes
after the fix. This proves classification, withheld result, UUID retention, and
duplicate refusal; it does not prove OS signal delivery or automatic-review
rejection. The observed read-only metadata refusal is the live denial evidence.

## Identity evidence

The non-secret read-only `sandbox-config/identity.json` reports set/owner
`isweichen`, repository `januswtlin/januslin.me`:

| Actor | Numeric ID | Evidence |
|---|---|---|
| Active implementer bot `isweichen-agent[bot]` | 352218417 | identity mount; branch activity API; PR #114 API author |
| Active reviewer bot `isweichen-reviewer[bot]` | 352219106 | identity mount; coordinator checks posted review actor |
| Original commit author and committer `januslin-agent[bot]` | 349177542 | API for commit e2401f9111d0a59e0e5c276a526b645a5c67e926 |

The commit author differs from the push/PR actor because the VM retains its
configured git identity (ADR-0015). Global git config was not changed. The
original commits carry `Agent: codex`; `Task: #56` was separated by a blank line,
so git did not parse it as a trailer. Subsequent commits put both lines in one
trailer block; history is not rewritten. Role aliases remain `januslin-agent`
and `januslin-reviewer`; expected bot IDs come from the active mount, not aliases.

Read-only API commands used (only through the implementer wrapper):

- `api repos/januswtlin/januslin.me/commits/e2401f9111d0a59e0e5c276a526b645a5c67e926`
- `api repos/januswtlin/januslin.me/pulls/114`
- `api 'repos/januswtlin/januslin.me/activity?ref=refs/heads/agent/platform/T06-codex&per_page=10'`

The activity result includes older deleted/reused branches: only the event for
the exact implementation SHA above is evidence for this start. API actor data,
not this model's report, must be compared with the active identity mount.

## V30, reverse review and final verification

The start produced PR #114 and a structured JSON report. The independent Claude
review on head e2401f9 requested changes:
[review 5764059589](https://github.com/januswtlin/januslin.me/pull/114#pullrequestreview-5764059589).
The coordinator sent findings to this same UUID; this turn addresses them.
The coordinator supplies final fix/re-review, reverse-review, and report links,
and records whether its dispatch classifier allowed the command. No claim about
that classifier is inferred from implementer execution. CI/pnpm verify are not
yet implemented (no package.json or ci workflow); record the script gate and do
not invent a CI URL. The author must verify V8, V22/V28, V29, V30 and the reverse
review before closing #56. Until the remaining evidence is present the PR uses
`Refs #56`, with no automatic closing keyword.
