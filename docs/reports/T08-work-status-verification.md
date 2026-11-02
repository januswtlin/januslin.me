# T08 work-status verification

Task: [#54](https://github.com/januswtlin/januslin.me/issues/54). Bootstrap evidence: 2026-11-01. Sandbox acceptance: 2026-11-02.

## Scope and test history

`work-status.sh` is a read-only POSIX shell client of the implementer App wrapper. It emits JSON Lines for task dispatch, the author's human-task queue, and trusted author activity. It adds no production dependency: JSON processing stays in `gh api graphql --jq`.

Acceptance tests were committed first in `9c2dbae`. The base had no `scripts/work-status.sh`; its recorded failing output began:

```
FAIL - next preserves plan order and selects first startable (exit 127, expected 0)
sh: .../scripts/work-status.sh: No such file or directory
FAIL - approved task is startable and prints lastEditedAt (exit 127, expected 0)
```

The implementation is `a24f5bd`. Independent review found two blocking defects: a dependency metadata error was swallowed by POSIX shell's conditional-function `errexit` behavior, and PR references written as a local issue URL or fully qualified issue reference were missed. Both were fixed with regression tests in `f76e219`. A stronger plan-order test, with two startable tasks in order `[55,54,56]`, is in `1fb6ffc`.

The fixtures are synthetic GraphQL-shaped data, including deliberate tampering. The fake `gh` paginates at two nodes and runs the production jq filters without reimplementing trust decisions. Tests use the repository's existing `jq` prerequisite; they never contact GitHub or read a live token. Real-repository validation remains a separate acceptance criterion.

## Verification results

- Focused `sh tests/scripts/work-status/test.sh`: 53 passing checks, no failures, including an author-only edit to a comment created before the activity cursor.
- Full `sh tests/scripts/run.sh` on the reviewed code: exit 1, exactly the 12 pre-existing macOS `/bin/sh` failures in `sandbox-session/test.sh`. Agent scripts, Claude settings, author key tools, token broker, and work-status pass. The sandbox-session fixture's `FAKE_REWRITE` assignment persists across a shell function call on this shell and contaminates later cases. No existing test or production host script was changed to hide this baseline.
- Full suite with explicit dash, including nested `sh` calls: exit 0. The command was `PATH="<temporary directory with sh symlinked to /bin/dash>:$PATH" /bin/dash tests/scripts/run.sh`. This is an alternate-shell result, not a passing default macOS gate.
- `shellcheck`, `sh -n`, and `git diff --check`: pass for the added script/tests.
- A separate schema check validated all 14 unique generated query documents against GitHub's official [public GraphQL schema](https://docs.github.com/en/graphql/overview/public-schema), downloaded on 2026-11-01 from `https://docs.github.com/public/fpt/schema.docs.graphql`. The temporary QA tool was `graphql-core` 3.2.13 under `/tmp`; no repository dependency was added. This check caught and corrected the distinct `IssueState`/`PullRequestState` response-key conflict by using explicit aliases.

A fresh-context reviewer independently passed the final 53 focused checks, syntax, shellcheck, and diff checks and reviewed the final source, tests, docs, and evidence without an open blocking finding. The App-posted verdict remains pending.

The full default-shell and dash runs cover behavior at `1fb6ffc`. Later changes add the reviewer-suggested old-comment regression and literal one-reason-per-line `check` output, independently passed in the focused suite. The output keeps the full JSON summary and appends separate JSON reason records before exit 3.

## Deliberate breaks

Each mutation below was made only in an isolated temporary copy of the script. The unmodified code passed before the mutations; each broken copy made the acceptance suite fail. The final mutation run uses implementation baseline `1fb6ffc`; the earlier run against `a24f5bd` was superseded after the review fixes. No mutation is committed.

```text
approval-actor: exit 1; 1 failing checks; DETECTED
FAIL - bot label is unapproved (exit 0, expected 3)
stable-label-id: exit 1; 20 failing checks; DETECTED
FAIL - name collision cannot replace pinned label ID (exit 0, expected 3)
current-label-presence: exit 1; 2 failing checks; DETECTED
FAIL - removed label is unapproved (exit 0, expected 3)
body-edit-actor: exit 1; 3 failing checks; DETECTED
FAIL - machine-account body edit invalidates approval (exit 0, expected 3)
title-edit-actor: exit 1; 2 failing checks; DETECTED
FAIL - developer title rename invalidates approval (exit 0, expected 3)
all-pagination: exit 1; 14 failing checks; DETECTED
FAIL - body edits paginate through hostile later page (exit 0, expected 3)
dependency-close-actor: exit 1; 1 failing checks; DETECTED
FAIL - dependency close by bot blocks task (exit 0, expected 3)
dependency-state-reason: exit 1; 1 failing checks; DETECTED
FAIL - not-planned dependency blocks task (exit 0, expected 3)
trusted-comment-edits: exit 1; 2 failing checks; DETECTED
FAIL - author comment edited by bot is untrusted
claimed-developer: exit 1; 3 failing checks; DETECTED
FAIL - assigned developer excludes duplicate work (exit 0, expected 3)
open-pr-claims: exit 1; 6 failing checks; DETECTED
FAIL - open PR excludes duplicate work (exit 0, expected 3)
existing-agent-branch: exit 1; 2 failing checks; DETECTED
FAIL - agent branch excludes duplicate work (exit 0, expected 3)
unknown-editor: exit 1; 1 failing checks; DETECTED
FAIL - null editor fails closed (exit 0, expected 3)
json-round-trip: exit 1; 2 failing checks; DETECTED
FAIL - hostile title and body round-trip as JSON data
token-output: exit 1; 10 failing checks; DETECTED
FAIL - token absent from output and argv
dependency-api-propagation: exit 1; 3 failing checks; DETECTED
FAIL - next dependency metadata API failure propagates
graphql-partial-errors: exit 1; 1 failing checks; DETECTED
FAIL - GraphQL partial data with errors fails closed
plan-preference: exit 1; 1 failing checks; DETECTED
FAIL - plan preference differs from numeric order with two startable tasks
```

The pagination mutation stops every connection after its first page; later-page tests cover body edits, title timeline, labels, assignees, plan sub-issues, branches, open PRs, nested PR closing references, comments, and comment edits. The plan-order mutation sorts by issue number and is rejected by the two-startable-task fixture. The API mutation removes explicit propagation from `done_issue`; all three affected commands must fail with empty stdout. The partial-error mutation accepts HTTP-success GraphQL responses containing both valid data and errors, which the regression rejects.

## Acceptance evidence map

| Rule | Representative focused check |
|---|---|
| Approval actor uses database ID | `bot label is unapproved` |
| The current pinned label must be present | `removed label is unapproved` |
| A renamed replacement label grants no approval | `name collision cannot replace pinned label ID` |
| A rename of the original label preserves its identity | `labels paginate and pinned label survives rename` |
| Untrusted body/title changes invalidate approval | `machine-account body edit invalidates approval`, `developer title rename invalidates approval` |
| Missing, deleted, or unknown edit metadata fails closed | `null editor fails closed`, `deleted edit fails closed`, `missing edit history after an edit fails closed` |
| Dependency completion requires author close and COMPLETED | `dependency close by bot blocks task`, `not-planned dependency blocks task` |
| Author comments require author-only edit history | `author comment edited by bot is untrusted`, `comment edit history paginates` |
| Hostile text remains JSON data | `hostile title and body round-trip as JSON data` |
| No token in stdout/stderr/argv | `token absent from output and argv` |
| A claimed task is excluded | developer assignment, branch, PR mention, URL, qualified reference, and closing-reference tests |
| Pagination cannot truncate or stall silently | later-page fixtures and `non-progressing pagination fails closed` |
| Plan preference is preserved | `plan preference differs from numeric order with two startable tasks` |
| API failures never emit partial dispatch decisions | `next/check/human dependency metadata API failure propagates`, `GraphQL partial data with errors fails closed` |

## Fixture output and request counts

These are fixture results, not live repository output. The fixture has four listed issues, one trusted comment, and two-node pages:

| Command | Exit | GraphQL requests |
|---|---:|---:|
| `next` | 0 | 27 |
| `human` | 0 | 10 |
| `check 54` | 0 | 7 |
| `author-activity --since 2026-10-30T00:00:00Z` | 0 | 16 |

Representative fixture output:

```json
{"next":54}
{"number":59,"parent":54,"state":"assigned","title":"Task 59","blockers":"#57","openDependencies":[]}
```

The script intentionally enumerates full issue/PR history for `author-activity`, including closed objects and comment-edit history. Request volume grows with object count, pages, and author comments. These request counts are not measurements of GraphQL point costs; a live rate-budget check is pending. No `updatedAt` shortcut was introduced without verifying whether it preserves all trusted activity.

## Sandbox acceptance, 2026-11-02

Implementation head tested: `412f9bf` (saved code plus merge of `origin/main`
`2ad410b`). Platform: Linux aarch64 in the existing `agent-vm` sandbox.
The coordinator prompt moved into `docs/agents/coordinator.md` in #98; its
step 2 and idle loop now use the script there, with a link from the workflow.
No production script or fixture behavior changed during this continuation.

- `sh tests/scripts/run.sh`: exit 0; all existing suites and all 53 work-status
  checks pass under the sandbox's default `sh`. The earlier macOS failures above
  are historical platform evidence, not current failures.
- `sh -n scripts/work-status.sh tests/scripts/work-status/test.sh
  tests/scripts/work-status/bin/gh` and `git diff --check origin/main...HEAD`:
  exit 0. ShellCheck is unavailable in this VM; its prior result above was not
  re-run or presented as fresh evidence.
- All live calls use `scripts/agent-gh januslin-agent`; the active App is
  `januswtlin-agent[bot]` (database ID `350971135`), not the machine account.
  The author approved #54, #55, and #56. #54's body `lastEditedAt` remains
  `2026-10-31T09:18:48Z`.
- `scripts/work-status.sh next`: exit 0; task order is 54 through 69, matching
  plan #53. #54/#56 are existing work, #55 waits for #54, and the remaining
  tasks are unapproved. The final output is `{"next":null}`: resuming #54 is
  correct; dispatching a duplicate or skipping to #55 would be wrong.
- `scripts/work-status.sh human`: exit 0; 23 records, #70 and #92 assigned to
  the author and the other 21 queued. See selected output below. The first
  attempt failed closed because #70 referred to inaccessible PR #50. The
  coordinator verified author-merged PR #52 and the runbook on `main`, and
  corrected #70's reference to #52. This was an issue-data correction, not an
  implementation fix or relaxation of the fail-closed rule.
- `scripts/work-status.sh check 57`: exit 3; the genuinely unapproved task
  reports `no label` and incomplete dependencies #55/#56. No label was changed
  to manufacture this example.

Live `next` output, projecting only `number`/`state` (the command also emits the
JSON-encoded title/body and reasons):

```json
{"number":54,"state":"in-progress"}
{"number":55,"state":"waiting"}
{"number":56,"state":"in-progress"}
{"number":57,"state":"unapproved"}
{"number":58,"state":"unapproved"}
{"number":59,"state":"unapproved"}
{"number":60,"state":"unapproved"}
{"number":61,"state":"unapproved"}
{"number":62,"state":"unapproved"}
{"number":63,"state":"unapproved"}
{"number":64,"state":"unapproved"}
{"number":65,"state":"unapproved"}
{"number":66,"state":"unapproved"}
{"number":67,"state":"unapproved"}
{"number":68,"state":"unapproved"}
{"number":69,"state":"unapproved"}
{"next":null}
```

Selected live `human` output (other records are queued):

```json
{"number":70,"parent":55,"state":"assigned","title":"Delete the Slack app and its bot token","blockers":"PR #52 merged (adds the runbook)","openDependencies":[52]}
{"number":71,"parent":55,"state":"queued","title":"Restart the coordinator on the new prompt and check phone notifications","blockers":"T04's PR merged","openDependencies":[]}
{"number":72,"parent":56,"state":"queued","title":"Connect ChatGPT to GitHub as the machine account","blockers":"nothing","openDependencies":[]}
{"number":73,"parent":56,"state":"queued","title":"Log in to Codex through sbx on the Mac","blockers":"#72","openDependencies":[72]}
{"number":74,"parent":56,"state":"queued","title":"Save the sandbox as a template after the Codex install","blockers":"the reviewed Codex install (the agent's comment says when)","openDependencies":[]}
{"number":75,"parent":56,"state":"queued","title":"Create the Codex cloud environment and run the probe from the phone","blockers":"#72; the runbook `docs/runbooks/codex-cloud.md`, which T06 adds in a small PR first (environment settings and the probe prompt)","openDependencies":[72]}
{"number":92,"parent":null,"state":"assigned","title":"Adopt issue tracking: phone notifications, review PR #50, approve the tasks","blockers":"nothing","openDependencies":[]}
```

`openDependencies` applies the completed-issue rule to numeric references.
It conservatively retains PR #52 because a merged PR is not an issue closed as
`COMPLETED`. The coordinator verified that PR's author merge separately;
assignment and this field alone do not prove a human task is actionable.
No PR-completion policy was added to the task's dependency rules.

Live refusal reasons from `check 57` (after its full JSON summary):

```json
{"number":57,"reason":"no label"}
{"number":57,"reason":"dependency #55 is not completed by author"}
{"number":57,"reason":"dependency #56 is not completed by author"}
```

PR: [#101](https://github.com/januswtlin/januslin.me/pull/101). Independent
App-posted review is requested by the coordinator after final documentation.
`pnpm verify`, the site preview, and `ci` do not exist yet; the script gate is the
current required check. Earlier deliberate-break and schema validation evidence
above is retained as dated bootstrap evidence and was not repeated needlessly.

## Remaining operating limits

- V32 remains open until a subsequent author-merged task PR demonstrates that
  GitHub records database ID `2433928` as the issue's latest `ClosedEvent` actor.
  Fixtures establish the checking rule, not GitHub's live merge behavior.
- GitHub reads span multiple requests. Re-run `check` immediately before
  dispatch, pass `lastEditedAt`, and retain the implementer's body-change stop.
  Missing edit history, deleted edits, unknown actors, API failures, and ambiguous
  dependency syntax stop dispatch rather than infer approval.
- Keep an overlapping inclusive activity cursor, deduplicate events/comments,
  and advance only after successful complete reads. `author-activity` enumerates
  full history; the fixture request counts above are not a measured long-running
  GitHub rate budget. No performance shortcut was introduced.
