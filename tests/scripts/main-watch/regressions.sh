#!/bin/sh
# Review regressions use only fake REST responses and private temporary state.
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
expect() { [ "$rc" = "$1" ] || { echo "FAIL $scenario: expected exit $1 got $rc" >&2; cat "$tmp/err" >&2; exit 1; }; }
assert() { "$@" || { echo "FAIL $scenario: $*" >&2; exit 1; }; }
change() { jq "$1" "$FAKE_MAIN_WATCH" > "$tmp/new"; mv "$tmp/new" "$FAKE_MAIN_WATCH"; }
failures=0
for scenario in preserve-unrelated-pending repeat-rewrite-to-accepted-sha; do
 (
  rm -rf "$tmp/private"; cp "$here/fixtures/base.json" "$FAKE_MAIN_WATCH"
  run init; expect 0
  case "$scenario" in
   preserve-unrelated-pending)
    change '.pulls={}'
    run check; expect 3
    change '.status="diverged" | .commits=[{sha:"'$b'",parents:[{sha:"422517b80a52ae51d849080ab01c5b6a60b22b91"}]}]'
    run check; expect 3; assert test "$(wc -l < "$tmp/out")" = 2
    run accept "$b"; expect 0
    assert awk -F '\t' -v sha="$a" '$1=="pending" && $2==sha {found=1} END{exit !found}' "$MAIN_WATCH_STATE"
    assert awk -F '\t' -v a="$a" -v b="$b" '$1=="accepted" && $2==a{bad=1} $1=="accepted" && $2==b{found=1} END{exit bad || !found}' "$MAIN_WATCH_STATE"
    run check; expect 3; assert jq -se 'length==1 and .[0].sha=="'$a'" and .[0].reason=="no-pr"' "$tmp/out"
    run check; expect 3
    run accept "$a"; expect 0; run check; expect 0;;
   repeat-rewrite-to-accepted-sha)
    change '.commits[0].sha="'$b'" | .pulls={}'
    run check; expect 3; run accept "$b"; expect 0; run check; expect 0
    change '.commits=[.commits[0],{sha:"'$a'",parents:[{sha:"'$b'"}]}] | .pulls["'$a'"]=[1]'
    run check; expect 0
    change '.commits=[.commits[0]] | .status="behind"'
    run check; expect 3
    assert jq -se 'length==1 and .[0].sha=="'$b'" and .[0].reason=="history-rewritten" and .[0].suspicious' "$tmp/out"
    assert awk -F '\t' -v sha="$a" '$1=="baseline" && $2==sha{found=1} END{exit !found}' "$MAIN_WATCH_STATE"
    run check; expect 3
    run accept "$b"; expect 0; run check; expect 0;;
  esac
  echo "PASS $scenario"
 ) || failures=$((failures+1))
done
[ "$failures" = 0 ]
