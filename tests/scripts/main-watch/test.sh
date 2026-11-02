#!/bin/sh
set -eu
root=$(CDPATH='' cd -- "$(dirname "$0")/../../.." && pwd)
here=$root/tests/scripts/main-watch
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT HUP INT TERM
export PATH="$here/bin:$PATH" JANUSLIN_AGENT_STATE_DIR="$tmp/tokens" MAIN_WATCH_STATE="$tmp/private/watch.state" FAKE_GH_LOG="$tmp/argv" FAKE_MAIN_WATCH="$tmp/fixture.json"
mkdir "$tmp/tokens"
printf 'fake-main-watch-secret\n2099-01-01T00:00:00Z\n' > "$tmp/tokens/januslin-agent.token"
a=1111111111111111111111111111111111111111
b=2222222222222222222222222222222222222222
run() { rc=0; "$root/scripts/main-watch.sh" "$@" > "$tmp/out" 2> "$tmp/err" || rc=$?; }
expect() { [ "$rc" = "$1" ] || { echo "FAIL $label: expected exit $1 got $rc" >&2; cat "$tmp/err" >&2; exit 1; }; }
assert() { "$@" || { echo "FAIL $label: $*" >&2; exit 1; }; }
reset() { rm -rf "$tmp/private"; cp "$here/fixtures/base.json" "$FAKE_MAIN_WATCH"; run init; expect 0; }
change() { jq "$1" "$FAKE_MAIN_WATCH" > "$tmp/new"; mv "$tmp/new" "$FAKE_MAIN_WATCH"; }
label='no implicit state'; run check; expect 1; assert test ! -e "$MAIN_WATCH_STATE"; assert grep -q 'init' "$tmp/err"
label='author squash'; reset; run check; expect 0; assert jq -e '.sha=="'$a'" and .pr==1 and .merged_by_id==2433928 and .suspicious==false and .reason=="merged-by-author"' "$tmp/out"; run check; expect 0; assert test ! -s "$tmp/out"
label='private state and init refuses reset'; assert test "$(stat -c %a "$MAIN_WATCH_STATE")" = 600; cp "$MAIN_WATCH_STATE" "$tmp/saved"; run init; expect 1; assert cmp "$MAIN_WATCH_STATE" "$tmp/saved"
for scenario in not-author no-pr merge-sha-mismatch; do
 label="$scenario sticky accept"; reset
 case $scenario in not-author) change '.details["1"].merged_by.id=999';; no-pr) change '.pulls={}' ;; merge-sha-mismatch) change '.details["1"].merge_commit_sha="2222222222222222222222222222222222222222"';; esac
 run check; expect 3; assert jq -e '.suspicious==true and .reason=="'$scenario'"' "$tmp/out"; cp "$tmp/out" "$tmp/report"
 run check; expect 3; assert cmp "$tmp/out" "$tmp/report"
 run wait --interval 0 --max 1; expect 3; assert cmp "$tmp/out" "$tmp/report"
 run accept "$a"; expect 0; assert grep -q "$a" "$MAIN_WATCH_STATE"; run check; expect 0; assert test ! -s "$tmp/out"
done
label='sticky after rewritten suspect disappears'; reset; change '.details["1"].merged_by.id=999'; run check; expect 3; change '.commits[0].sha="'$b'" | .pulls["'$b'"]=[2] | .details["2"]=(.details["1"]|.number=2|.merged_by.id=2433928|.merge_commit_sha="'$b'")'; run check; expect 3; assert grep -q "$a" "$tmp/out"
label='history rewritten author accept'; reset; change '.status="diverged"'; run check; expect 3; assert jq -e '.sha=="'$a'" and .reason=="history-rewritten"' "$tmp/out"; run check; expect 3; run accept "$a"; expect 0; run check; expect 0
label='wait max'; reset; run check; expect 0; run wait --interval 0 --max 2; expect 2; assert test ! -s "$tmp/out"
label='API error preserves all state and stdout'; reset; cp "$MAIN_WATCH_STATE" "$tmp/saved"; export FAKE_API_FAILURE="repos/januswtlin/januslin.me/pulls/1"; run check; expect 1; assert cmp "$MAIN_WATCH_STATE" "$tmp/saved"; assert test ! -s "$tmp/out"; if cat "$tmp/out" "$tmp/err" "$FAKE_GH_LOG" | grep -q fake-main-watch-secret; then echo "FAIL $label: leaked credential"; exit 1; fi; unset FAKE_API_FAILURE
label='hostile titles and credential isolation'; reset; run check; expect 0; assert test ! -e /tmp/main-watch-injected; assert test "$(wc -l < "$tmp/out")" = 1; assert jq -e 'keys==["merged_by_id","pr","reason","sha","suspicious"]' "$tmp/out"; if cat "$tmp/out" "$tmp/err" "$FAKE_GH_LOG" | grep -q fake-main-watch-secret; then echo "FAIL $label"; exit 1; fi
label='malformed state fail closed'; printf 'baseline invalid\n' > "$MAIN_WATCH_STATE"; cp "$MAIN_WATCH_STATE" "$tmp/saved"; run check; expect 1; assert cmp "$MAIN_WATCH_STATE" "$tmp/saved"
label='state symlink rejected'; rm "$MAIN_WATCH_STATE"; ln -s "$tmp/saved" "$MAIN_WATCH_STATE"; run check; expect 1; assert cmp "$tmp/saved" "$MAIN_WATCH_STATE"
label='lock collision preserves state'; reset; cp "$MAIN_WATCH_STATE" "$tmp/saved"; mkdir "$MAIN_WATCH_STATE.lock"; run check; expect 1; assert cmp "$MAIN_WATCH_STATE" "$tmp/saved"; rmdir "$MAIN_WATCH_STATE.lock"
label='accept unknown rejects'; run accept "$b"; expect 1; assert cmp "$MAIN_WATCH_STATE" "$tmp/saved"
label='private permissions fail closed'; chmod 644 "$MAIN_WATCH_STATE"; run check; expect 1; chmod 600 "$MAIN_WATCH_STATE"
label='invalid commands'; run init --baseline bad; expect 2; run wait --max nope; expect 2; run accept main; expect 2
label='multiple compare and associated PR pages'; reset
jq -n --arg root 422517b80a52ae51d849080ab01c5b6a60b22b91 '
 [range(1;103)|("0000000000000000000000000000000000000000"+tostring)[-40:]] as $shas |
 {commits:[range(0;102)|. as $i|{sha:$shas[$i],parents:[{sha:(if $i==0 then $root else $shas[$i-1] end)}]}],
 pulls:([$shas[]|{key:.,value:[range(1;102)]}]|from_entries),
 details:([range(1;102)|{key:tostring,value:{number:.,merged:true,merge_commit_sha:(if .==101 then $shas[0] else $root end),merged_by:{id:2433928},base:{ref:"main",repo:{full_name:"januswtlin/januslin.me"}}}}]|from_entries)} |
 .pulls=([.commits|to_entries[]|{key:.value.sha,value:(if .key==0 then [range(1;102)] else [(.key+102)] end)}]|from_entries) |
 reduce range(1;102) as $i (.; .details[($i+102|tostring)]={number:($i+102),merged:true,merge_commit_sha:$shas[$i],merged_by:{id:2433928},base:{ref:"main",repo:{full_name:"januswtlin/januslin.me"}}})
' > "$FAKE_MAIN_WATCH"
run check; expect 0; assert test "$(wc -l < "$tmp/out")" = 102; assert grep -q 'page=2' "$FAKE_GH_LOG"
label='late page API failure leaves state'; reset; change '.commits += [{sha:"'$b'",parents:[{sha:"'$a'"}]}] | .pulls["'$b'"]=[2] | .details["2"]=(.details["1"]|.number=2|.merge_commit_sha="'$b'")'; cp "$MAIN_WATCH_STATE" "$tmp/saved"; export FAKE_API_FAILURE="repos/januswtlin/januslin.me/pulls/2"; run check; expect 1; assert cmp "$MAIN_WATCH_STATE" "$tmp/saved"; assert test ! -s "$tmp/out"; unset FAKE_API_FAILURE
label='nonlinear or incomplete compare fails closed'; reset; change '.commits[0].parents=[]'; cp "$MAIN_WATCH_STATE" "$tmp/saved"; run check; expect 1; assert cmp "$MAIN_WATCH_STATE" "$tmp/saved"
echo 'PASS main-watch: author, suspicious reasons, sticky restart/accept, rewrite, wait, pagination, API atomicity, private state, hostile data, credentials, validation'

sh "$here/regressions.sh"
