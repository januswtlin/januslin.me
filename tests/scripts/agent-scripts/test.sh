#!/bin/sh
# Tests for the host agent scripts (T02): scripts/agent-token.sh, scripts/agent-gh,
# scripts/agent-git-credential, .githooks/prepare-commit-msg.
# POSIX sh, fake curl and gh on PATH, a throwaway RSA key, no network.
set -u

here=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$here/../../.." && pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

export PATH="$here/bin:$PATH"
export FAKE_LOG="$tmp/log"
export FAKE_TOKEN="ghs_FAKE0TOKEN0VALUE0123456789"
export JANUSLIN_AGENT_CONFIG_DIR="$tmp/config"
export JANUSLIN_AGENT_STATE_DIR="$tmp/state"

fails=0
pass() { echo "ok   - $1"; }
fail() { echo "FAIL - $1"; fails=$((fails + 1)); }
check() { if [ "$2" = 0 ]; then pass "$1"; else fail "$1"; fi; }
reset() { : > "$FAKE_LOG"; rm -rf "$JANUSLIN_AGENT_STATE_DIR"; }

# The active App set, as tools/author/januslin-keys writes it.
active="$JANUSLIN_AGENT_CONFIG_DIR/active"
mkdir -p "$active"
(umask 077; openssl genrsa -out "$active/implementer.pem" 2048 2>/dev/null)
cp "$active/implementer.pem" "$active/reviewer.pem"
key_line=$(sed -n 2p "$active/implementer.pem")
apps_ok='{"version":1,"set":"t","owner":"o","repository":"januswtlin/januslin.me","apps":{
  "implementer":{"app_id":7001,"installation_id":8001,"slug":"i","bot_user_id":1,"key":"implementer.pem"},
  "reviewer":{"app_id":7002,"installation_id":8002,"slug":"r","bot_user_id":2,"key":"reviewer.pem"}}}'
printf '%s\n' "$apps_ok" > "$active/apps.json"

write_token() { # $1 = app, $2 = expiry
  mkdir -p "$JANUSLIN_AGENT_STATE_DIR"
  printf '%s\n%s\n' "$FAKE_TOKEN" "$2" > "$JANUSLIN_AGENT_STATE_DIR/$1.token"
}

# ---- agent-git-credential -------------------------------------------------
cred() { printf '%s' "$1" | sh "$root/scripts/agent-git-credential" "${2:-get}" 2>/dev/null; }
reset; write_token januslin-agent 2099-01-01T00:00:00Z

out=$(cred 'protocol=https
host=github.com
path=januswtlin/januslin.me.git
')
[ "$out" = "username=x-access-token
password=$FAKE_TOKEN" ]
check "credential: answers for https://github.com/januswtlin/januslin.me" $?

for input in \
  'protocol=https
host=github.com
path=januswtlin/januslin.me-other.git
' \
  'protocol=https
host=github.com
path=januswtlin/other.git
' \
  'protocol=http
host=github.com
path=januswtlin/januslin.me.git
' \
  'protocol=https
host=example.com
path=januswtlin/januslin.me.git
' \
  'protocol=https
host=github.com
'; do
  out=$(cred "$input")
  [ -z "$out" ]; rc=$?
  check "credential: silent for $(printf '%s' "$input" | tr '\n' ' ')" $rc
done

out=$(cred 'protocol=https
host=github.com
path=januswtlin/januslin.me.git
' store)
[ -z "$out" ]
check "credential: silent for actions other than get" $?

# ---- agent-gh -------------------------------------------------------------
reset
out=$(sh "$root/scripts/agent-gh" januslin-agent api user 2>&1); rc=$?
[ $rc -ne 0 ] && ! grep -q 'argv:' "$FAKE_LOG"
check "agent-gh: refuses a missing token without running gh" $?

reset; write_token januslin-agent 2000-01-01T00:00:00Z
out=$(sh "$root/scripts/agent-gh" januslin-agent api user 2>&1); rc=$?
[ $rc -ne 0 ] && ! grep -q 'argv:' "$FAKE_LOG" && ! printf '%s' "$out" | grep -q "$FAKE_TOKEN"
check "agent-gh: refuses an expired token without printing it" $?

reset; write_token januslin-agent 2099-01-01T00:00:00Z
out=$(sh "$root/scripts/agent-gh" januslin-agent pr list --limit 1 2>&1); rc=$?
[ $rc -eq 0 ] && grep -q 'gh_token: expected' "$FAKE_LOG" && grep -q 'argv: --limit' "$FAKE_LOG" \
  && ! grep -q "$FAKE_TOKEN" "$FAKE_LOG" && ! printf '%s' "$out" | grep -q "$FAKE_TOKEN"
check "agent-gh: passes the token to gh in GH_TOKEN only, never in argv or output" $?

for app in januslin-platform other; do
  reset; write_token "$app" 2099-01-01T00:00:00Z
  sh "$root/scripts/agent-gh" "$app" api user >/dev/null 2>&1; rc=$?
  [ $rc -eq 2 ] && ! grep -q 'argv:' "$FAKE_LOG"
  check "agent-gh: rejects app '$app'" $?
done

# ---- agent-token.sh -------------------------------------------------------
for app in januslin-platform other; do
  reset
  sh "$root/scripts/agent-token.sh" "$app" >/dev/null 2>&1; rc=$?
  [ $rc -eq 2 ] && [ ! -s "$FAKE_LOG" ]
  check "agent-token: rejects app '$app' without calling curl" $?
done

for app in januslin-agent januslin-reviewer; do
  reset
  out=$(sh "$root/scripts/agent-token.sh" "$app" 2>&1); rc=$?
  tf="$JANUSLIN_AGENT_STATE_DIR/$app.token"
  [ $rc -eq 0 ] && [ "$(sed -n 1p "$tf")" = "$FAKE_TOKEN" ] && [ "$(sed -n 2p "$tf")" = 2099-01-01T00:00:00Z ]
  check "agent-token: $app writes the token file" $?
  perm=$(stat -c '%a' "$tf" 2>/dev/null || stat -f '%Lp' "$tf")
  [ "$perm" = 600 ]
  check "agent-token: $app token file is 0600" $?
  ! printf '%s' "$out" | grep -q "$FAKE_TOKEN" && ! printf '%s' "$out" | grep -qF "$key_line"
  check "agent-token: $app prints no token or key" $?
  jwt=$(sed -n 's/^stdin: header = "Authorization: Bearer \(.*\)"$/\1/p' "$FAKE_LOG" | head -n 1)
  [ -n "$jwt" ] && ! grep '^argv:' "$FAKE_LOG" | grep -q -F -e "$jwt" -e "$FAKE_TOKEN" -e 'Bearer' -e 'BEGIN' -e 'eyJ' -e "$key_line"
  check "agent-token: $app puts no credential (JWT, token, key) in curl argv" $?
  grep -q '^stdin: header = "Authorization: Bearer ' "$FAKE_LOG" && grep -q 'argv: {"repositories":\["januslin.me"\]}' "$FAKE_LOG"
  check "agent-token: $app sends the JWT on stdin and restricts to januslin.me" $?
done

reset; sh "$root/scripts/agent-token.sh" januslin-reviewer >/dev/null 2>&1
jwt=$(sed -n 's/^stdin: header = "Authorization: Bearer \(.*\)"$/\1/p' "$FAKE_LOG" | head -n 1)
payload=$(printf '%s' "$jwt" | cut -d. -f2 | tr -- '-_' '+/')
while [ $(( ${#payload} % 4 )) -ne 0 ]; do payload="$payload="; done
[ "$(printf '%s' "$payload" | openssl base64 -d -A | jq -r .iss)" = 7002 ] \
  && grep -qx 'argv: https://api.github.com/app/installations/8002/access_tokens' "$FAKE_LOG"
check "agent-token: takes the role's App ID and installation ID from the active set" $?

for bad in \
  "$(printf '%s' "$apps_ok" | jq -c '.repository = "someone/else"')" \
  "$(printf '%s' "$apps_ok" | jq -c '.version = 2')" \
  "$(printf '%s' "$apps_ok" | jq -c '.apps.implementer.app_id = "7001"')" \
  "$(printf '%s' "$apps_ok" | jq -c '.apps.implementer.installation_id = 1.5')" \
  "$(printf '%s' "$apps_ok" | jq -c '.apps.implementer.key = "../../januslin-agent.pem"')" \
  "$(printf '%s' "$apps_ok" | jq -c 'del(.apps.implementer)')" \
  'not json'; do
  reset; printf '%s\n' "$bad" > "$active/apps.json"
  sh "$root/scripts/agent-token.sh" januslin-agent >/dev/null 2>&1; rc=$?
  [ $rc -ne 0 ] && [ ! -s "$FAKE_LOG" ]
  check "agent-token: refuses apps.json without calling curl: $(printf '%s' "$bad" | cut -c1-60)" $?
done
printf '%s\n' "$apps_ok" > "$active/apps.json"

reset; mv "$active" "$active.off"
out=$(sh "$root/scripts/agent-token.sh" januslin-agent 2>&1); rc=$?
[ $rc -ne 0 ] && [ ! -s "$FAKE_LOG" ] && printf '%s' "$out" | grep -q 'no active App set'
check "agent-token: refuses to mint without an active set" $?
write_token januslin-agent 2099-01-01T00:00:00Z
sh "$root/scripts/agent-token.sh" --revoke januslin-agent >/dev/null 2>&1; rc=$?
[ $rc -eq 0 ] && [ ! -e "$JANUSLIN_AGENT_STATE_DIR/januslin-agent.token" ]
check "agent-token: --revoke works without an active set" $?
mv "$active.off" "$active"

reset; write_token januslin-agent 2099-01-01T00:00:00Z
out=$(sh "$root/scripts/agent-token.sh" --revoke januslin-agent 2>&1); rc=$?
[ $rc -eq 0 ] && [ ! -e "$JANUSLIN_AGENT_STATE_DIR/januslin-agent.token" ] \
  && ! grep '^argv:' "$FAKE_LOG" | grep -q -e "$FAKE_TOKEN" -e Bearer && grep -q "^stdin: .*$FAKE_TOKEN" "$FAKE_LOG" \
  && ! printf '%s' "$out" | grep -q "$FAKE_TOKEN"
check "agent-token: --revoke sends the token on stdin only and deletes the file" $?

reset; chmod 644 "$active/implementer.pem"
sh "$root/scripts/agent-token.sh" januslin-agent >/dev/null 2>&1; rc=$?
[ $rc -ne 0 ] && [ ! -s "$FAKE_LOG" ]
check "agent-token: refuses a key that is not 0600" $?
chmod 600 "$active/implementer.pem"

# ---- prepare-commit-msg ---------------------------------------------------
repo="$tmp/repo"
git init -q "$repo"
hook="$root/.githooks/prepare-commit-msg"
msg() { printf 'docs: x\n\nTask: T02\n' > "$repo/msg"; }

msg; (cd "$repo" && env -u AGENT_TOOL sh "$hook" msg)
! grep -q '^Agent:' "$repo/msg"
check "prepare-commit-msg: no trailer without AGENT_TOOL" $?

msg; (cd "$repo" && AGENT_TOOL=claude sh "$hook" msg)
[ "$(grep -c '^Agent: claude$' "$repo/msg")" = 1 ]
check "prepare-commit-msg: adds Agent: claude" $?

(cd "$repo" && AGENT_TOOL=claude sh "$hook" msg)
[ "$(grep -c '^Agent:' "$repo/msg")" = 1 ]
check "prepare-commit-msg: does not add a second trailer" $?

printf 'docs: x\n\nAgent: claude\n\nCo-Authored-By: someone <x@example.com>\n' > "$repo/msg"
(cd "$repo" && AGENT_TOOL=claude sh "$hook" msg)
[ "$(grep -c '^Agent:' "$repo/msg")" = 1 ]
check "prepare-commit-msg: no second trailer when Agent: is above another trailer block" $?

msg; (cd "$repo" && AGENT_TOOL=codex sh "$hook" msg)
grep -q '^Agent: codex$' "$repo/msg"
check "prepare-commit-msg: adds Agent: codex" $?

msg; (cd "$repo" && AGENT_TOOL=other sh "$hook" msg)
! grep -q '^Agent:' "$repo/msg"
check "prepare-commit-msg: ignores unknown AGENT_TOOL values" $?

echo "agent-scripts: $fails failure(s)"
[ "$fails" -eq 0 ]
