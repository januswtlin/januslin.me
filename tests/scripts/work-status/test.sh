#!/bin/sh
# Hostile shell syntax below is deliberately inert fixture data.
# shellcheck disable=SC2016
# Acceptance tests for T08. Fake gh evaluates production --jq against fixtures.
set -u
here=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$here/../../.." && pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT HUP INT TERM
export PATH="$here/bin:$PATH" FAKE_GRAPHQL="$tmp/graphql.json" FAKE_GH_LOG="$tmp/gh.log" JANUSLIN_AGENT_STATE_DIR="$tmp/state"
mkdir -p "$tmp/state"
printf '%s\n%s\n' 'ghs_T08_TEST_TOKEN_NEVER_PRINT' '2099-01-01T00:00:00Z' > "$tmp/state/januslin-agent.token"
fails=0
ok() { printf 'ok   - %s\n' "$1"; }
fail() { printf 'FAIL - %s\n' "$1"; fails=$((fails+1)); }
reset() { jq -n -f "$here/fixtures/base.jq" > "$FAKE_GRAPHQL"; : > "$FAKE_GH_LOG"; unset FAKE_API_FAILURE; }
change() { jq "$1" "$FAKE_GRAPHQL" > "$tmp/change" && mv "$tmp/change" "$FAKE_GRAPHQL"; }
run() { sh "${WORK_STATUS_SCRIPT:-$root/scripts/work-status.sh}" "$@" > "$tmp/out" 2> "$tmp/err"; rc=$?; }
expect() { name=$1; expected=$2; pattern=$3; if [ "$rc" = "$expected" ] && grep -q "$pattern" "$tmp/out"; then ok "$name"; else fail "$name (exit $rc, expected $expected)"; cat "$tmp/out" "$tmp/err"; fi; }
reset; run next; expect 'next preserves plan order and selects first startable' 0 '"next":54'
reset; run check 54; expect 'approved task is startable and prints lastEditedAt' 0 '"lastEditedAt":null'
reset; change '.nodes.I54.timelineItems.nodes[0].actor.databaseId=349177542'; run check 54; expect 'bot label is unapproved' 3 'label added by someone else'
reset; change '.nodes.I54.labels.nodes |= map(select(.id!="LA_kwDOVbvt8s8AAAADARxrMw"))'; run check 54; expect 'removed label is unapproved' 3 'no label'
reset; change '.nodes.I54.labels.nodes[1].id="renamed-other-label" | .nodes.I54.timelineItems.nodes[0].label.id="renamed-other-label"'; run check 54; expect 'name collision cannot replace pinned label ID' 3 'no label'
reset; change '.nodes.I54.userContentEdits.nodes=[{editedAt:"2026-10-30T12:00:00Z",editor:{databaseId:349746030}}]'; run check 54; expect 'machine-account body edit invalidates approval' 3 'edited after approval'
reset; change '.nodes.I54.timelineItems.nodes += [{__typename:"RenamedTitleEvent",createdAt:"2026-10-30T12:00:00Z",actor:{databaseId:9988}}]'; run check 54; expect 'developer title rename invalidates approval' 3 'edited after approval'
reset; change '.nodes.I54.userContentEdits.nodes=[{editedAt:"2026-10-29T12:00:00Z",editor:{databaseId:2433928}},{editedAt:"2026-10-29T13:00:00Z",editor:{databaseId:2433928}},{editedAt:"2026-10-30T12:00:00Z",editor:{databaseId:9988}}]'; run check 54; expect 'body edits paginate through hostile later page' 3 'edited after approval'
reset; change '.nodes.I54.timelineItems.nodes += [{__typename:"ReopenedEvent",createdAt:"2026-10-30T10:01:00Z",actor:{databaseId:2433928}},{__typename:"RenamedTitleEvent",createdAt:"2026-10-30T12:00:00Z",actor:{databaseId:9988}}]'; run check 54; expect 'timeline paginates through hostile later page' 3 'edited after approval'
reset; change '.nodes.I57.timelineItems.nodes[0].actor.databaseId=349177542'; run check 55; expect 'dependency close by bot blocks task' 3 'dependency #57'
reset; change '.nodes.I57.stateReason="NOT_PLANNED"'; run check 55; expect 'not-planned dependency blocks task' 3 'dependency #57'
reset; run check 55; expect 'completed dependency author close permits task' 0 '"state":"startable"'
reset; run check 56; expect 'assigned developer excludes duplicate work' 3 'assigned to another developer'
reset; change '.repo.refs.nodes=[{name:"agent/platform/T08-work-status"}]'; run check 54; expect 'agent branch excludes duplicate work' 3 'branch'
reset; change '.repo.pullRequests.nodes=[{id:"PR80",number:80,title:"implements #54",body:"Closes #54",headRefName:"feature",closingIssuesReferences:{nodes:[{number:54}],pageInfo:{hasNextPage:false,endCursor:null}}}] | .nodes.PR80=.repo.pullRequests.nodes[0]'; run check 54; expect 'open PR excludes duplicate work' 3 'PR #80'
reset; run human; expect 'human queue reports parent and author assignment' 0 '"parent":54'
reset; run author-activity --since 2026-10-30T00:00:00Z; expect 'trusted author comment emitted' 0 'author instruction'
reset; change '.nodes.C1.userContentEdits.nodes=[{editedAt:"2026-10-30T12:00:00Z",editor:{databaseId:349177542}}]'; run author-activity --since 2026-10-30T00:00:00Z; if [ "$rc" = 0 ] && ! grep -q 'author instruction' "$tmp/out"; then ok 'author comment edited by bot is untrusted'; else fail 'author comment edited by bot is untrusted'; fi
reset; change '.nodes.C1.userContentEdits.nodes=[{editor:{databaseId:2433928}},{editor:{databaseId:2433928}},{editor:{databaseId:9988}}]'; run author-activity --since 2026-10-30T00:00:00Z; if [ "$rc" = 0 ] && ! grep -q 'author instruction' "$tmp/out"; then ok 'comment edit history paginates'; else fail 'comment edit history paginates'; fi
reset; change '.nodes.I54.title="$(touch /tmp/t08-should-never-exist) `false`\n\t\"hostile\"" | .nodes.I54.body="**Depends on:** none\n$(false)"'; run check 54; if [ "$rc" = 0 ] && jq -e 'select(.number==54)|.title|contains("$(touch")' "$tmp/out" >/dev/null && [ ! -e /tmp/t08-should-never-exist ]; then ok 'hostile title and body round-trip as JSON data'; else fail 'hostile title and body round-trip as JSON data'; fi
reset; export FAKE_API_FAILURE=Edits; run next; if [ "$rc" = 1 ] && [ ! -s "$tmp/out" ]; then ok 'API errors fail closed without partial dispatch output'; else fail 'API errors fail closed without partial dispatch output'; fi
reset; change '.errors=[{message:"GraphQL failure"}]'; run check 54; if [ "$rc" = 1 ]; then ok 'GraphQL errors fail closed'; else fail 'GraphQL errors fail closed'; fi
reset; change '.nodes.I54.body="**Depends on:** #57 or anything"'; run check 54; expect 'ambiguous dependency syntax fails closed' 3 'invalid dependencies'
reset; run next; if ! grep -q 'ghs_T08_TEST_TOKEN_NEVER_PRINT' "$tmp/out" "$tmp/err" "$FAKE_GH_LOG"; then ok 'token absent from output and argv'; else fail 'token absent from output and argv'; fi
reset; change '.nodes.I55.body="**Depends on:** #57. Integration with outputs uses fixtures until another task merges."'; run check 55; expect 'dependency explanation after period is supported' 0 '"state":"startable"'
reset; change '.nodes.I55.body="**Depends on:** #57, #58 (#79 and #81 explain the tokens)"'; run check 55; expect 'dependency explanation ignores parenthesized references' 0 '"state":"startable"'
reset; change '.nodes.I54.userContentEdits.nodes=[{editedAt:"2026-10-30T12:00:00Z",editor:null}]'; run check 54; expect 'null editor fails closed' 3 'edited after approval'
reset; change '.nodes.I54.userContentEdits.nodes=[{editedAt:null,deletedAt:"2026-10-30T12:00:00Z",editor:{databaseId:2433928}}]'; run check 54; expect 'deleted edit fails closed' 3 'edited after approval'
reset; change '.nodes.I54.lastEditedAt="2026-10-30T12:00:00Z"'; run check 54; expect 'missing edit history after an edit fails closed' 3 'edited after approval'
reset; change '.nodes.I54.labels.nodes=[{id:"a",name:"a"},{id:"b",name:"b"},{id:"task",name:"task"},{id:"LA_kwDOVbvt8s8AAAADARxrMw",name:"renamed-approval"}]'; run check 54; expect 'labels paginate and pinned label survives rename' 0 '"state":"startable"'
reset; change '.nodes.I54.assignees.nodes=[{databaseId:2433928},{databaseId:2433928},{databaseId:9988}]'; run check 54; expect 'assignees paginate through other developer' 3 'assigned to another developer'
reset; change '.repo.refs.nodes=[{name:"agent/a"},{name:"agent/b"},{name:"agent/platform/T08-work-status"}]'; run check 54; expect 'branches paginate through matching task branch' 3 'branch'
reset; change '.nodes.I53.subIssues.nodes=[{number:56},{number:55},{number:54}] | .nodes.I57.state="OPEN"'; run next; expect 'plan subissues paginate preserving preference' 0 '"next":54'
reset; change '.repo.issues.nodes += [{id:"I57",number:57}]'; run author-activity --since 2026-10-30T00:00:00Z; expect 'closed issue author events are included' 0 '"event":"ClosedEvent"'
reset; change '.repo.pullRequests.nodes=[{id:"PR80",number:80,title:"other/repo#54",body:"",headRefName:"feature"}] | .nodes.PR80={closingIssuesReferences:{nodes:[{number:54,repository:{nameWithOwner:"other/repo"}}]}}'; run check 54; expect 'foreign repository references do not claim local task' 0 '"state":"startable"'
reset; change '.repo.pullRequests.nodes=[{id:"PR80",number:80,title:"feature",body:"",headRefName:"feature"}] | .nodes.PR80={closingIssuesReferences:{nodes:[{number:1,repository:{nameWithOwner:"other/repo"}},{number:2,repository:{nameWithOwner:"other/repo"}},{number:54,repository:{nameWithOwner:"januswtlin/januslin.me"}}]}}'; run check 54; expect 'PR closing references paginate through local issue' 3 'PR #80'
reset; change '.nodes.C1.lastEditedAt="2026-10-30T12:00:00Z" | .nodes.I54.comments.nodes[0].lastEditedAt=.nodes.C1.lastEditedAt'; run author-activity --since 2026-10-30T00:00:00Z; if [ "$rc" = 0 ] && ! grep -q 'author instruction' "$tmp/out"; then ok 'edited comment with missing history is untrusted'; else fail 'edited comment with missing history is untrusted'; fi
reset; export FAKE_CURSOR_STALL=1; run next; if [ "$rc" = 1 ] && [ ! -s "$tmp/out" ]; then ok 'non-progressing pagination fails closed'; else fail 'non-progressing pagination fails closed'; fi; unset FAKE_CURSOR_STALL
reset; change '.repo.pullRequests.nodes=[{id:"PR80",number:80,title:"mentions #54 #55",body:"",headRefName:"feature"}] | .nodes.PR80={closingIssuesReferences:{nodes:[]}}'; run check 55; expect 'consecutive PR issue references are all detected' 3 'PR #80'
reset; change '.nodes.I54.title="T08: fixture task" | .nodes.I54.body="**Depends on:** none" | .repo.refs.nodes=[{name:"agent/platform/T08-other-branch"}]'; run check 54; expect 'alternate task-ID branch prevents duplicate work' 3 'branch names task ID'
reset; change '.repo.pullRequests.nodes=[{id:"PR80",number:80,title:"one",body:"",headRefName:"a"},{id:"PR81",number:81,title:"two",body:"",headRefName:"b"},{id:"PR82",number:82,title:"three #54",body:"",headRefName:"c"}] | .nodes.PR80={closingIssuesReferences:{nodes:[]}} | .nodes.PR81=.nodes.PR80 | .nodes.PR82=.nodes.PR80'; run check 54; expect 'open PR connection paginates through claiming PR' 3 'PR #82'
reset; change '.nodes.I54.comments.nodes=[{id:"CX",author:{databaseId:9988},createdAt:"2026-10-30T09:00:00Z",updatedAt:"2026-10-30T09:00:00Z",body:"data"},{id:"CY",author:{databaseId:9988},createdAt:"2026-10-30T10:00:00Z",updatedAt:"2026-10-30T10:00:00Z",body:"data"},.nodes.C1]'; run author-activity --since 2026-10-30T00:00:00Z; expect 'comments paginate through trusted later comment' 0 'author instruction'
reset; run author-activity --since 2026-10-30T11:00:00Z; if [ "$rc" = 0 ] && jq -s -e 'map(.at)==(map(.at)|sort) and all(.at>="2026-10-30T11:00:00Z")' "$tmp/out" >/dev/null; then ok 'activity since is inclusive and oldest first'; else fail 'activity since is inclusive and oldest first'; fi
reset; change '.nodes.I57=null'; run next; if [ "$rc" = 1 ] && [ ! -s "$tmp/out" ]; then ok 'next dependency metadata API failure propagates'; else fail 'next dependency metadata API failure propagates'; fi
reset; change '.nodes.I57=null'; run check 55; if [ "$rc" = 1 ] && [ ! -s "$tmp/out" ]; then ok 'check dependency metadata API failure propagates'; else fail 'check dependency metadata API failure propagates'; fi
reset; change '.nodes.I57=null'; run human; if [ "$rc" = 1 ] && [ ! -s "$tmp/out" ]; then ok 'human dependency metadata API failure propagates'; else fail 'human dependency metadata API failure propagates'; fi
reset; change '.partialErrors=[{message:"GraphQL error with valid partial data"}]'; run next; if [ "$rc" = 1 ] && [ ! -s "$tmp/out" ]; then ok 'GraphQL partial data with errors fails closed'; else fail 'GraphQL partial data with errors fails closed'; fi
reset; change '.repo.pullRequests.nodes=[{id:"PR80",number:80,title:"Task: https://github.com/januswtlin/januslin.me/issues/54",body:"",headRefName:"feature"}] | .nodes.PR80={closingIssuesReferences:{nodes:[]}}'; run check 54; expect 'local issue URL in PR prevents duplicate work' 3 'PR #80'
reset; change '.repo.pullRequests.nodes=[{id:"PR80",number:80,title:"Task: januswtlin/januslin.me#54",body:"",headRefName:"feature"}] | .nodes.PR80={closingIssuesReferences:{nodes:[]}}'; run check 54; expect 'fully qualified local issue in PR prevents duplicate work' 3 'PR #80'
reset; change '.repo.pullRequests.nodes=[{id:"PR80",number:80,title:"https://github.com/foreign/repo/issues/54 foreign/repo#54",body:"",headRefName:"feature"}] | .nodes.PR80={closingIssuesReferences:{nodes:[]}}'; run check 54; expect 'foreign URLs and qualified refs do not claim task' 0 '"state":"startable"'
reset; change '.nodes.I53.subIssues.nodes=[{number:55},{number:54},{number:56}]'; run next; if [ "$rc" = 0 ] && jq -s -e '[.[]|select(has("number"))|.number]==[55,54,56] and .[-1].next==55' "$tmp/out" >/dev/null; then ok 'plan preference differs from numeric order with two startable tasks'; else fail 'plan preference differs from numeric order with two startable tasks'; fi
reset; change '.nodes.C1.createdAt="2026-10-29T11:00:00Z" | .nodes.C1.updatedAt="2026-10-30T13:00:00Z" | .nodes.C1.lastEditedAt="2026-10-30T13:00:00Z" | .nodes.C1.userContentEdits.nodes=[{editedAt:"2026-10-30T13:00:00Z",deletedAt:null,editor:{databaseId:2433928}}] | .nodes.I54.comments.nodes=[.nodes.C1]'; run author-activity --since 2026-10-30T12:00:00Z; if [ "$rc" = 0 ] && jq -s -e 'any(.event=="Comment" and .createdAt<"2026-10-30T12:00:00Z" and .at=="2026-10-30T13:00:00Z") and map(.at)==(map(.at)|sort)' "$tmp/out" >/dev/null; then ok 'author edit to an older trusted comment appears since update'; else fail 'author edit to an older trusted comment appears since update'; fi
reset; change '.nodes.I54.labels.nodes |= map(select(.id!="LA_kwDOVbvt8s8AAAADARxrMw"))'; run check 54; if [ "$rc" = 3 ] && jq -s -e '.[0].reasons==[.[]|select(has("reason"))|.reason] and length==2' "$tmp/out" >/dev/null; then ok 'check emits each refusal reason as a separate JSON line'; else fail 'check emits each refusal reason as a separate JSON line'; fi
printf '%s\n' "$fails work-status failures"
[ "$fails" = 0 ]
