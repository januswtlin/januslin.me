#!/bin/sh
# Checks the repository's .claude/settings.json keeps its denies (T05; docs/agents/sandbox.md,
# "Permissions inside the VM"). Needs jq; no network.
set -u

here=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$here/../../.." && pwd)
s="$root/.claude/settings.json"

fails=0
check() { if [ "$2" = 0 ]; then echo "ok   - $1"; else echo "FAIL - $1"; fails=$((fails + 1)); fi; }

for d in 'mcp__claude_ai_*' 'mcp__mcp-gateway__*' CronCreate CronList CronDelete RemoteTrigger; do
  jq -e --arg d "$d" '.permissions.deny | index($d)' "$s" > /dev/null
  check "settings.json denies $d" $?
done
[ "$(jq -r '.env.CLAUDE_CODE_DISABLE_CRON' "$s")" = 1 ]
check "settings.json sets CLAUDE_CODE_DISABLE_CRON=1" $?

if [ "$fails" -eq 0 ]; then echo "all claude-settings tests passed"; else echo "$fails claude-settings test(s) failed"; exit 1; fi
