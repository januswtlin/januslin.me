#!/bin/sh
# Tests for scripts/sandbox-session.sh. The script runs its sibling
# token-broker.sh and the commands git, sbx, and security, so the test copies it
# next to a fake broker and puts fakes for the commands first on PATH. Every call
# is logged to one file, in order. POSIX sh, no network, no key.
set -u

here=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$here/../../.." && pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

mkdir -p "$tmp/clone/scripts" "$tmp/fakebin"
cp "$root/scripts/sandbox-session.sh" "$tmp/clone/scripts/sandbox-session.sh"
script="$tmp/clone/scripts/sandbox-session.sh"
export FAKE_LOG="$tmp/calls"

# One fake for everything: logs "<name> <args>"; FAKE_FAIL="<name> <first arg>" fails that call.
cat > "$tmp/fake" <<'EOF'
#!/bin/sh
name=$(basename "$0" .sh)
echo "$name $*" >> "$FAKE_LOG"
[ "${FAKE_FAIL:-}" = "$name ${1:-}" ] && exit 1
# FAKE_REWRITE=<file>: `git merge` replaces <file>, as a merge of main would.
if [ "$name ${1:-}" = "git merge" ] && [ -n "${FAKE_REWRITE:-}" ]; then
  printf '#!/bin/sh\necho "updated-script $*" >> "$FAKE_LOG"\n' > "$FAKE_REWRITE"
fi
exit 0
EOF
for c in git sbx security; do cp "$tmp/fake" "$tmp/fakebin/$c"; chmod +x "$tmp/fakebin/$c"; done
cp "$tmp/fake" "$tmp/clone/scripts/token-broker.sh"
export PATH="$tmp/fakebin:$PATH"

fails=0
pass() { echo "ok   - $1"; }
fail() { echo "FAIL - $1"; fails=$((fails + 1)); }
check() { if [ "$2" = 0 ]; then pass "$1"; else fail "$1"; fi; }
run() { : > "$FAKE_LOG"; (unset SANDBOX_SESSION_UPDATED; sh "$script" "$@") >/dev/null 2>&1; }
log() { tr '\n' '|' < "$FAKE_LOG"; }

start_calls="git checkout -q main|git fetch -q origin|git merge -q --ff-only origin/main|token-broker stop|token-broker once|token-broker start|token-broker status|sbx run --name januslin|"

# ---- start ------------------------------------------------------------------
run start; rc=$?
[ $rc -eq 0 ] && [ "$(log)" = "$start_calls" ]
check "start: updates main once, restarts the broker, mints, then sbx run, in that order" $?

FAKE_FAIL="git merge" run start; rc=$?
[ $rc -ne 0 ] && ! grep -Eq '^(token-broker|sbx)' "$FAKE_LOG"
check "start: stops before the broker and sbx when main cannot be fast-forwarded" $?

FAKE_FAIL="token-broker once" run start; rc=$?
[ $rc -ne 0 ] && ! grep -Eq '^(token-broker start|sbx)' "$FAKE_LOG"
check "start: does not start the broker loop or the sandbox when minting fails" $?

FAKE_REWRITE="$script" run start; rc=$?
[ $rc -eq 0 ] && [ "$(log)" = "git checkout -q main|git fetch -q origin|git merge -q --ff-only origin/main|updated-script start|" ]
check "start: after the merge, runs the updated script from main instead of the old one" $?
cp "$root/scripts/sandbox-session.sh" "$script"

run start; ! grep -q '^security' "$FAKE_LOG"
check "start: leaves the keychain alone without --unlock-keychain" $?

run start --unlock-keychain; rc=$?
[ $rc -eq 0 ] && grep -qx "security unlock-keychain $HOME/Library/Keychains/sbx.keychain-db" "$FAKE_LOG" \
  && [ "$(grep -n '^security' "$FAKE_LOG" | cut -d: -f1)" -lt "$(grep -n '^token-broker once' "$FAKE_LOG" | cut -d: -f1)" ]
check "start --unlock-keychain: unlocks the sbx keychain before minting" $?

FAKE_FAIL="security unlock-keychain" run start --unlock-keychain; rc=$?
[ $rc -ne 0 ] && ! grep -Eq '^(token-broker|sbx)' "$FAKE_LOG"
check "start --unlock-keychain: stops before the broker when the unlock fails" $?

FAKE_FAIL="sbx run" run start; rc=$?
[ $rc -ne 0 ] && [ "$(tail -n 2 "$FAKE_LOG" | tr '\n' '|')" = "sbx run --name januslin|token-broker stop|" ]
check "start: stops the broker again when sbx run fails" $?

run start --bogus; rc=$?
[ $rc -eq 2 ] && [ ! -s "$FAKE_LOG" ]
check "start: refuses an unknown option before doing anything" $?

# ---- restart ----------------------------------------------------------------
run restart; rc=$?
[ $rc -eq 0 ] && [ "$(log)" = "sbx stop januslin|$start_calls" ]
check "restart: stops the VM, then runs start" $?

FAKE_FAIL="sbx stop" run restart; rc=$?
[ $rc -eq 0 ] && grep -q '^sbx run' "$FAKE_LOG"
check "restart: starts even when the VM was not running" $?

# ---- stop -------------------------------------------------------------------
run stop; rc=$?
[ $rc -eq 0 ] && [ "$(log)" = "sbx stop januslin|token-broker stop|" ]
check "stop: stops the VM and the broker" $?

FAKE_FAIL="sbx stop" run stop
grep -q '^token-broker stop' "$FAKE_LOG"
check "stop: stops the broker even when sbx stop fails" $?

# ---- usage ------------------------------------------------------------------
run; rc=$?
[ $rc -eq 2 ] && [ ! -s "$FAKE_LOG" ]
check "no command: usage, exit 2, nothing run" $?

run stop now; rc=$?
[ $rc -eq 2 ] && [ ! -s "$FAKE_LOG" ]
check "stop: refuses extra arguments" $?

[ $fails -eq 0 ] && echo "all sandbox-session tests passed" || echo "$fails sandbox-session test(s) failed"
exit $fails
