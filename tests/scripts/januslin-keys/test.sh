#!/bin/sh
# Tests for tools/author/januslin-keys (ADR-0015). Runs the tool as the current
# user: JANUSLIN_KEYS_AS_AGENT=env replaces `sudo -H -u Agent`, a temporary
# directory stands in for both homes, and a fake curl answers like GitHub.
# The last test checks that the set `use` writes is one the agent's
# scripts/agent-token.sh accepts. POSIX sh, throwaway RSA keys, no network.
set -u

here=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$here/../../.." && pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

tool="$root/tools/author/januslin-keys"
export PATH="$here/bin:$PATH"
export FAKE_LOG="$tmp/log"
export HOME="$tmp/author"
export JANUSLIN_KEYS_API="https://api.example.test"
export JANUSLIN_KEYS_AS_AGENT=env
export JANUSLIN_AGENT_HOME="$tmp/agent"
keys="$HOME/.config/januslin-keys"
agent_conf="$JANUSLIN_AGENT_HOME/.config/januslin-agent"
mkdir -p "$HOME/Downloads" "$JANUSLIN_AGENT_HOME"

fails=0
pass() { echo "ok   - $1"; }
fail() { echo "FAIL - $1"; fails=$((fails + 1)); }
check() { if [ "$2" = 0 ]; then pass "$1"; else fail "$1"; fi; }
mode() { stat -c '%a' "$1" 2>/dev/null || stat -f '%Lp' "$1"; }

newkey() { (umask 077; openssl genrsa -out "$1" 2048 2>/dev/null); }
newkey "$HOME/Downloads/impl.private-key.pem"
newkey "$HOME/Downloads/rev.private-key.pem"
cp "$HOME/Downloads/impl.private-key.pem" "$tmp/impl.pem"
cp "$HOME/Downloads/rev.private-key.pem" "$tmp/rev.pem"
key_line=$(sed -n 2p "$tmp/impl.pem")

# add: App ID and key path for each role, then the delete question.
answers() { printf '%s\n' 101 "$HOME/Downloads/impl.private-key.pem" 102 "$HOME/Downloads/rev.private-key.pem" "${1:-y}"; }

# ---- add ----------------------------------------------------------------------
: > "$FAKE_LOG"
out=$(answers | sh "$tool" add janus 2>&1); rc=$?
set_json="$keys/sets/janus/apps.json"
[ $rc -eq 0 ] && [ "$(jq -c '[.version, .set, .owner, .repository]' "$set_json")" = '[1,"janus","januswtlin","januswtlin/januslin.me"]' ] \
  && [ "$(jq -c '.apps.implementer' "$set_json")" = '{"app_id":101,"installation_id":1101,"slug":"app-101","bot_user_id":2101,"key":"implementer.pem"}' ] \
  && [ "$(jq -c '.apps.reviewer' "$set_json")" = '{"app_id":102,"installation_id":1102,"slug":"app-102","bot_user_id":2102,"key":"reviewer.pem"}' ]
check "add: writes apps.json with the IDs GitHub reports for each key" $?

cmp -s "$keys/sets/janus/implementer.pem" "$tmp/impl.pem" && cmp -s "$keys/sets/janus/reviewer.pem" "$tmp/rev.pem" \
  && [ "$(mode "$keys/sets/janus/implementer.pem")" = 600 ] && [ "$(mode "$keys/sets/janus")" = 700 ] && [ "$(mode "$keys")" = 700 ]
check "add: keeps its own copies of the keys, 0600, in 0700 folders" $?

[ ! -e "$HOME/Downloads/impl.private-key.pem" ] && [ ! -e "$HOME/Downloads/rev.private-key.pem" ]
check "add: deletes the downloaded keys when asked" $?

! grep -q 'BEGIN' "$set_json" && ! printf '%s' "$out" | grep -qF "$key_line"
check "add: apps.json holds no key, and nothing prints one" $?

! grep '^argv:' "$FAKE_LOG" | grep -q -e Bearer -e 'eyJ' -e BEGIN -e "$key_line" && grep -q '^stdin: header = "Authorization: Bearer ' "$FAKE_LOG"
check "add: sends the JWT on stdin, never in curl argv" $?

[ ! -e "$JANUSLIN_AGENT_HOME/.config" ]
check "add: puts nothing into the agent account" $?

cp "$tmp/impl.pem" "$HOME/Downloads/impl.private-key.pem"; cp "$tmp/rev.pem" "$HOME/Downloads/rev.private-key.pem"
before=$(cat "$set_json")
printf 'n\n' | sh "$tool" add janus >/dev/null 2>&1; rc=$?
[ $rc -ne 0 ] && [ "$(cat "$set_json")" = "$before" ]
check "add: an existing set is replaced only on yes" $?

answers n | FAKE_KEY_APP_ID=999 sh "$tool" add other >/dev/null 2>&1; rc=$?
[ $rc -ne 0 ] && [ ! -e "$keys/sets/other" ] && [ -z "$(ls -A "$keys/sets" | grep -v '^janus$')" ]
check "add: refuses a key that belongs to another App, and leaves nothing behind" $?

answers n | FAKE_NOT_INSTALLED=1 sh "$tool" add other >/dev/null 2>&1; rc=$?
[ $rc -ne 0 ] && [ ! -e "$keys/sets/other" ]
check "add: refuses an App that is not installed on the repository" $?

printf '%s\n' abc | sh "$tool" add other >/dev/null 2>&1; rc=$?
[ $rc -ne 0 ] && [ ! -e "$keys/sets/other" ]
check "add: refuses an App ID that is not a number" $?

for bad in ../x X -x 'a b' ''; do
  sh "$tool" add "$bad" </dev/null >/dev/null 2>&1; rc=$?
  [ $rc -ne 0 ] && [ ! -e "$keys/sets/$bad/apps.json" ] && [ ! -e "$keys/x" ]
  check "add: refuses the set name '$bad'" $?
done

answers n | sh "$tool" add second >/dev/null 2>&1
[ -f "$keys/sets/second/apps.json" ] && [ -e "$HOME/Downloads/impl.private-key.pem" ]
check "add: keeps the downloaded keys when told no" $?

s="$keys/sets/janus"
printf '%s\n' y 101 "$s/implementer.pem" 102 "$s/reviewer.pem" | sh "$tool" add janus >/dev/null 2>&1; rc=$?
[ $rc -eq 0 ] && cmp -s "$s/implementer.pem" "$tmp/impl.pem" && cmp -s "$s/reviewer.pem" "$tmp/rev.pem"
check "add: re-adding a set from its own key files keeps them (never deletes outside ~/Downloads)" $?

printf '%s\n' 101 "$s/implementer.pem" 101 | sh "$tool" add dup >/dev/null 2>&1; rc=$?
[ $rc -ne 0 ] && [ ! -e "$keys/sets/dup" ]
check "add: refuses the same App for both roles" $?

printf '%s\n' 101 "~/Downloads/impl.private-key.pem" 102 "~/Downloads/rev.private-key.pem" n | sh "$tool" add tilde >/dev/null 2>&1; rc=$?
[ $rc -eq 0 ] && cmp -s "$keys/sets/tilde/implementer.pem" "$tmp/impl.pem"
check "add: expands ~/ in a typed key path" $?

# ---- use, off, status -----------------------------------------------------------
sh "$tool" use janus >/dev/null 2>&1; rc=$?
[ $rc -eq 0 ] && cmp -s "$agent_conf/active/apps.json" "$set_json" \
  && cmp -s "$agent_conf/active/implementer.pem" "$tmp/impl.pem" && cmp -s "$agent_conf/active/reviewer.pem" "$tmp/rev.pem" \
  && [ "$(mode "$agent_conf/active/implementer.pem")" = 600 ] && [ "$(mode "$agent_conf")" = 700 ] \
  && [ "$(ls -A "$agent_conf/active" | tr '\n' ' ')" = "apps.json implementer.pem reviewer.pem " ]
check "use: puts exactly the set's apps.json and keys into the agent account, 0600" $?

sh "$tool" use second >/dev/null 2>&1; rc=$?
[ $rc -eq 0 ] && [ "$(jq -r .set "$agent_conf/active/apps.json")" = second ] \
  && [ "$(ls -A "$agent_conf" | tr '\n' ' ')" = "active " ]
check "use: replaces the previous set; only one set is ever in the agent account" $?

out=$(sh "$tool" status 2>&1)
printf '%s' "$out" | grep -q 'janus: app-101, app-102 (owner januswtlin)' && printf '%s' "$out" | grep -q 'Active in the agent account: second'
check "status: lists the sets and the active one" $?

sh "$tool" use nosuch >/dev/null 2>&1; rc=$?
[ $rc -ne 0 ] && [ "$(jq -r .set "$agent_conf/active/apps.json")" = second ]
check "use: refuses an unknown set and keeps the active one" $?

chmod 644 "$keys/sets/janus/reviewer.pem"
sh "$tool" use janus >/dev/null 2>&1; rc=$?
[ $rc -ne 0 ] && [ "$(jq -r .set "$agent_conf/active/apps.json")" = second ]
check "use: refuses a set whose key is not 0600" $?
chmod 600 "$keys/sets/janus/reviewer.pem"

jq '.set = "renamed"' "$set_json" > "$tmp/x" && cp "$tmp/x" "$keys/sets/janus/apps.json.bak"
mv "$set_json" "$tmp/good.json"; cp "$tmp/x" "$set_json"
sh "$tool" use janus >/dev/null 2>&1; rc=$?
[ $rc -ne 0 ]
check "use: refuses an apps.json whose set name does not match its folder" $?
mv "$tmp/good.json" "$set_json"; rm -f "$keys/sets/janus/apps.json.bak"

sh "$tool" off >/dev/null 2>&1; rc=$?
[ $rc -eq 0 ] && [ ! -e "$agent_conf/active" ]
check "off: removes the set from the agent account" $?

# ---- the agent side accepts what use writes -------------------------------------
sh "$tool" use janus >/dev/null 2>&1
: > "$tmp/agent-log"
FAKE_LOG="$tmp/agent-log" FAKE_TOKEN=ghs_FAKE PATH="$root/tests/scripts/agent-scripts/bin:$PATH" \
  JANUSLIN_AGENT_CONFIG_DIR="$agent_conf" JANUSLIN_AGENT_STATE_DIR="$tmp/agent-state" \
  sh "$root/scripts/agent-token.sh" januslin-reviewer >/dev/null 2>&1; rc=$?
[ $rc -eq 0 ] && grep -qx 'argv: https://api.github.com/app/installations/1102/access_tokens' "$tmp/agent-log"
check "agent-token.sh mints from the set that use wrote" $?

sh "$tool" bogus >/dev/null 2>&1; rc=$?
[ $rc -eq 2 ]
check "usage: exit 2 on an unknown command" $?

echo "januslin-keys: $fails failure(s)"
[ "$fails" -eq 0 ]
