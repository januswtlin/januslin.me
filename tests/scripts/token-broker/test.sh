#!/bin/sh
# Tests for scripts/token-broker.sh (T03). The broker runs its sibling
# agent-token.sh, so the test copies the broker next to a fake agent-token.sh.
# POSIX sh, no network, no key.
set -u

here=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$here/../../.." && pwd)
tmp=$(mktemp -d)
trap 'sh "$tmp/bin/token-broker.sh" stop >/dev/null 2>&1; rm -rf "$tmp"' EXIT

mkdir -p "$tmp/bin"
cp "$root/scripts/token-broker.sh" "$tmp/bin/token-broker.sh"
cp "$here/fake-agent-token.sh" "$tmp/bin/agent-token.sh"
broker="$tmp/bin/token-broker.sh"

export JANUSLIN_BROKER_ROOT="$tmp/state"
export FAKE_LOG="$tmp/calls"
state=$JANUSLIN_BROKER_ROOT
# agent-gh and the credential helper read JANUSLIN_AGENT_STATE_DIR as the token
# directory; the broker must ignore it, even when it points at sandbox-tokens.
export JANUSLIN_AGENT_STATE_DIR="$state/sandbox-tokens"

fails=0
pass() { echo "ok   - $1"; }
fail() { echo "FAIL - $1"; fails=$((fails + 1)); }
check() { if [ "$2" = 0 ]; then pass "$1"; else fail "$1"; fi; }
mode() { stat -c '%a' "$1" 2>/dev/null || stat -f '%Lp' "$1"; }
calls() { grep -c "^mint $1$" "$FAKE_LOG" 2>/dev/null || true; }
reset() { rm -rf "$state" "$FAKE_LOG"; : > "$FAKE_LOG"; }
iso() { date -u -d "@$1" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -r "$1" +%Y-%m-%dT%H:%M:%SZ; }

# ---- once: placement and modes --------------------------------------------
reset
out=$(sh "$broker" once 2>&1); rc=$?
[ $rc -eq 0 ] \
  && [ -f "$state/sandbox-tokens/januslin-agent.token" ] \
  && [ -f "$state/sandbox-tokens/januslin-reviewer.token" ]
check "once: both tokens into sandbox-tokens" $?

[ "$(ls -A "$state/sandbox-tokens" | tr '\n' ' ')" = "januslin-agent.token januslin-reviewer.token " ] && [ ! -e "$state/proxy-tokens" ]
check "once: writes nothing else into the token directory, and no proxy-tokens directory" $?

[ ! -e "$state/sandbox-tokens/sandbox-tokens" ] && [ ! -e "$state/sandbox-tokens/broker" ]
check "once: ignores JANUSLIN_AGENT_STATE_DIR (no nested directories in sandbox-tokens)" $?

[ "$(mode "$state/sandbox-tokens")" = 700 ] \
  && [ "$(mode "$state/sandbox-tokens/januslin-agent.token")" = 600 ] \
  && [ "$(mode "$state/sandbox-tokens/januslin-reviewer.token")" = 600 ]
check "once: directory 0700, token files 0600" $?

! printf '%s' "$out" | grep -q 'ghs_FAKE'
check "once: prints no token" $?

# ---- refresh only near expiry ---------------------------------------------
now=$(date +%s)
reset; mkdir -p "$state/sandbox-tokens"
printf 'ghs_FAKE_old\n%s\n' "$(iso $((now + 1800)))" > "$state/sandbox-tokens/januslin-agent.token"
printf 'ghs_FAKE_old\n%s\n' "$(iso $((now + 300)))" > "$state/sandbox-tokens/januslin-reviewer.token"
sh "$broker" once >/dev/null 2>&1
[ "$(calls januslin-agent)" = 0 ] && [ "$(calls januslin-reviewer)" = 1 ] \
  && [ "$(sed -n 1p "$state/sandbox-tokens/januslin-agent.token")" = ghs_FAKE_old ] \
  && [ "$(sed -n 1p "$state/sandbox-tokens/januslin-reviewer.token")" != ghs_FAKE_old ]
check "once: refreshes a token with under 10 minutes left, keeps one with 30" $?

reset; mkdir -p "$state/sandbox-tokens"
printf 'ghs_FAKE_old\n%s\n' "$(iso $((now - 60)))" > "$state/sandbox-tokens/januslin-agent.token"
sh "$broker" once >/dev/null 2>&1
[ "$(calls januslin-agent)" = 1 ]
check "once: replaces an expired token" $?

# ---- refuses to write outside its directories -----------------------------
reset; mkdir -p "$state" "$tmp/elsewhere"
ln -s "$tmp/elsewhere" "$state/sandbox-tokens"
sh "$broker" once >/dev/null 2>&1; rc=$?
[ $rc -ne 0 ] && [ -z "$(ls -A "$tmp/elsewhere")" ]
check "refuses a symlinked token directory" $?

reset; mkdir -p "$state/sandbox-tokens" "$tmp/elsewhere2"
ln -s "$tmp/elsewhere2/x" "$state/sandbox-tokens/januslin-agent.token"
sh "$broker" once >/dev/null 2>&1; rc=$?
[ $rc -ne 0 ] && [ ! -e "$tmp/elsewhere2/x" ]
check "refuses a symlinked token file" $?

# ---- failure of the minting script ----------------------------------------
reset
FAKE_FAIL=januslin-reviewer sh "$broker" once >/dev/null 2>&1; rc=$?
[ $rc -ne 0 ] && [ -f "$state/sandbox-tokens/januslin-agent.token" ] && [ ! -e "$state/sandbox-tokens/januslin-reviewer.token" ]
check "once: reports a failed mint and leaves no partial file" $?

# ---- start, status, stop --------------------------------------------------
reset
sh "$broker" start >/dev/null 2>&1; rc=$?
sleep 2
pid=$(cat "$state/broker/broker.pid" 2>/dev/null)
[ $rc -eq 0 ] && [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null && [ -f "$state/sandbox-tokens/januslin-agent.token" ]
check "start: runs in the background and mints" $?

sh "$broker" start >/dev/null 2>&1; rc=$?
[ $rc -ne 0 ]
check "start: refuses a second broker" $?

st=$(sh "$broker" status 2>&1)
printf '%s' "$st" | grep -q 'running' && printf '%s' "$st" | grep -q 'januslin-reviewer' && ! printf '%s' "$st" | grep -q 'ghs_FAKE'
check "status: shows the broker and expiries, no token" $?

! grep -q 'ghs_FAKE' "$state/broker/broker.log"
check "log: has no token" $?

sh "$broker" stop >/dev/null 2>&1
sleep 1
! kill -0 "$pid" 2>/dev/null && [ ! -e "$state/broker/broker.pid" ]
check "stop: ends the broker" $?

# ---- stop never kills an unrelated process ---------------------------------
reset; mkdir -p "$state/broker"
sleep 300 &
other=$!
echo "$other" > "$state/broker/broker.pid"
sh "$broker" stop >/dev/null 2>&1
kill -0 "$other" 2>/dev/null && [ ! -e "$state/broker/broker.pid" ]
check "stop: leaves an unrelated process whose pid is in a stale pid file" $?
kill "$other" 2>/dev/null

echo "token-broker: $fails failure(s)"
[ "$fails" -eq 0 ]
