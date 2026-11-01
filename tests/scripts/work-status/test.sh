#!/bin/sh
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
reset; change '.repo.pullRequests.nodes=[{number:80,title:"implements #54",body:"Closes #54",headRefName:"feature",closingIssuesReferences:{nodes:[{number:54}],pageInfo:{hasNextPage:false,endCursor:null}}}]'; run check 54; expect 'open PR excludes duplicate work' 3 'PR #80'
reset; run human; expect 'human queue reports parent and author assignment' 0 '"parent":54'
reset; run author-activity --since 2026-10-30T00:00:00Z; expect 'trusted author comment emitted' 0 'author instruction'
reset; change '.nodes.C1.userContentEdits.nodes=[{editedAt:"2026-10-30T12:00:00Z",editor:{databaseId:349177542}}]'; run author-activity --since 2026-10-30T00:00:00Z; if [ "$rc" = 0 ] && ! grep -q 'author instruction' "$tmp/out"; then ok 'author comment edited by bot is untrusted'; else fail 'author comment edited by bot is untrusted'; fi
reset; change '.nodes.C1.userContentEdits.nodes=[{editor:{databaseId:2433928}},{editor:{databaseId:2433928}},{editor:{databaseId:9988}}]'; run author-activity --since 2026-10-30T00:00:00Z; if [ "$rc" = 0 ] && ! grep -q 'author instruction' "$tmp/out"; then ok 'comment edit history paginates'; else fail 'comment edit history paginates'; fi
reset; change '.nodes.I54.title="$(touch /tmp/t08-should-never-exist) `false`\n\t\"hostile\"" | .nodes.I54.body="**Depends on:** none\n$(false)"'; run check 54; if [ "$rc" = 0 ] && jq -e 'select(.number==54)|.title|contains("$(touch")' "$tmp/out" >/dev/null && [ ! -e /tmp/t08-should-never-exist ]; then ok 'hostile title and body round-trip as JSON data'; else fail 'hostile title and body round-trip as JSON data'; fi
reset; export FAKE_API_FAILURE=Edits; run next; if [ "$rc" = 1 ] && [ ! -s "$tmp/out" ]; then ok 'API errors fail closed without partial dispatch output'; else fail 'API errors fail closed without partial dispatch output'; fi
reset; change '.errors=[{message:"GraphQL failure"}]'; run check 54; if [ "$rc" = 1 ]; then ok 'GraphQL errors fail closed'; else fail 'GraphQL errors fail closed'; fi
reset; change '.nodes.I54.body="**Depends on:** #57 or anything"'; run check 54; expect 'ambiguous dependency syntax fails closed' 3 'invalid dependencies'
reset; run next; if ! grep -q 'ghs_T08_TEST_TOKEN_NEVER_PRINT' "$tmp/out" "$tmp/err" "$FAKE_GH_LOG"; then ok 'token absent from output and argv'; else fail 'token absent from output and argv'; fi
printf '%s\n' "$fails work-status failures"
[ "$fails" = 0 ]
