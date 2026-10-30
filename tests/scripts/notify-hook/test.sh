#!/bin/sh
# Tests for scripts/claude-notify-slack.sh, the Claude Code Notification hook (T05, V27),
# and its entry in .claude/settings.json. POSIX sh, a fake coordinator-channel.sh, no network.
set -u

here=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$here/../../.." && pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

fails=0
pass() { echo "ok   - $1"; }
fail() { echo "FAIL - $1"; fails=$((fails + 1)); }
check() { if [ "$2" = 0 ]; then pass "$1"; else fail "$1"; fi; }

# A throwaway project root with the hook and, when wanted, a fake channel script.
proj="$tmp/proj"
mkdir -p "$proj/scripts"
cp "$root/scripts/claude-notify-slack.sh" "$proj/scripts/" 2>/dev/null
log="$tmp/channel.log"
fake_channel() { # $1 = exit code of the fake
  cat > "$proj/scripts/coordinator-channel.sh" <<FAKE
#!/bin/sh
for a in "\$@"; do printf '%s\n' "\$a"; done >> "$log"
echo "1700000000.000100"
exit $1
FAKE
}
no_channel() { rm -f "$proj/scripts/coordinator-channel.sh"; }
hook() { # $1 = stdin JSON; environment from the caller
  : > "$log"
  printf '%s' "$1" | sh "$proj/scripts/claude-notify-slack.sh" > "$tmp/out" 2> "$tmp/err"
}
perm='{"session_id":"s","hook_event_name":"Notification","message":"Claude needs your permission to use Bash","notification_type":"permission_prompt"}'

# ---- channel script missing (T04 not merged yet) ---------------------------
no_channel
JANUSLIN_AGENT_STATE_DIR=/x hook "$perm"
check "missing coordinator-channel.sh: exits 0" $?
[ ! -s "$tmp/out" ] && [ ! -s "$tmp/err" ]
check "missing coordinator-channel.sh: prints nothing" $?

# ---- posts on a permission prompt in the sandbox ---------------------------
fake_channel 0
JANUSLIN_AGENT_STATE_DIR=/x hook "$perm"
check "permission_prompt: exits 0" $?
[ "$(sed -n 1p "$log")" = post ]
check "permission_prompt: runs coordinator-channel.sh post" $?
sed -n 2p "$log" | grep -q 'waiting for input (permission_prompt)'
check "permission_prompt: message names the notification type" $?
[ "$(wc -l < "$log")" -eq 2 ]
check "permission_prompt: post gets exactly one text argument" $?
[ ! -s "$tmp/out" ]
check "permission_prompt: hook prints nothing to stdout" $?

JANUSLIN_AGENT_STATE_DIR=/x hook '{"notification_type":"elicitation_dialog"}'
sed -n 2p "$log" | grep -q 'waiting for input (elicitation_dialog)'
check "elicitation_dialog: posts" $?

# ---- does not post ---------------------------------------------------------
for t in idle_prompt auth_success; do
  JANUSLIN_AGENT_STATE_DIR=/x hook "{\"notification_type\":\"$t\"}"
  [ $? = 0 ] && [ ! -s "$log" ]
  check "$t: no post" $?
done

JANUSLIN_AGENT_STATE_DIR=/x hook 'not json'
[ $? = 0 ] && [ ! -s "$log" ]
check "unparsable input: exits 0, no post" $?

JANUSLIN_AGENT_STATE_DIR=/x hook '{"notification_type":"permission_prompt; touch /tmp/pwned"}'
[ $? = 0 ] && [ ! -s "$log" ]
check "unknown notification type: no post" $?

( unset JANUSLIN_AGENT_STATE_DIR; hook "$perm" )
[ $? = 0 ] && [ ! -s "$log" ]
check "outside the sandbox (no JANUSLIN_AGENT_STATE_DIR, e.g. a cloud session): no post" $?

# ---- a failing channel script never fails the hook --------------------------
fake_channel 1
JANUSLIN_AGENT_STATE_DIR=/x hook "$perm"
check "coordinator-channel.sh fails: hook still exits 0" $?
[ ! -s "$tmp/out" ] && [ ! -s "$tmp/err" ]
check "coordinator-channel.sh fails: hook prints nothing" $?

# ---- .claude/settings.json -------------------------------------------------
s="$root/.claude/settings.json"
jq -e '.hooks.Notification[] | select(.matcher == "permission_prompt|elicitation_dialog") | .hooks[] | select(.type == "command" and (.command | contains("scripts/claude-notify-slack.sh")))' "$s" > /dev/null
check "settings.json: Notification hook runs scripts/claude-notify-slack.sh for permission and elicitation prompts" $?
jq -e '.permissions.deny as $d | ["mcp__claude_ai_*","CronCreate","CronList","CronDelete","RemoteTrigger"] | all(. as $x | $d | index($x))' "$s" > /dev/null
check "settings.json: connector, cron, and RemoteTrigger denies kept" $?
jq -e '.permissions.deny | index("mcp__mcp-gateway__*")' "$s" > /dev/null
check "settings.json: Docker's mcp-gateway tools denied" $?

# The settings command must be harmless when the hook file is absent (an old branch checked out).
cmd=$(jq -r '.hooks.Notification[0].hooks[0].command' "$s")
mkdir -p "$tmp/empty"
( CLAUDE_PROJECT_DIR="$tmp/empty" sh -c "$cmd" < /dev/null )
check "settings.json: hook command exits 0 when the hook script is absent" $?

if [ "$fails" -eq 0 ]; then echo "all notify-hook tests passed"; else echo "$fails notify-hook test(s) failed"; exit 1; fi
