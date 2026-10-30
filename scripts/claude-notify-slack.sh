#!/bin/sh
# Claude Code Notification hook (T05, V27; .claude/settings.json).
# When Claude Code in the local sandbox waits for a permission answer (for example after
# auto mode pauses on repeated blocks) or a dialog, post one line to the coordinator's
# Slack channel with scripts/coordinator-channel.sh, so the author can answer through
# Remote Control or the terminal (docs/agents/sandbox.md, "Permissions inside the VM").
#
# Does nothing, silently, when:
#   - not in the local sandbox (JANUSLIN_AGENT_STATE_DIR is set by sandbox/kit only;
#     cloud sessions also load this repository's settings);
#   - scripts/coordinator-channel.sh does not exist (before T04 is merged);
#   - the notification is not a permission prompt or a dialog (idle prompts are not
#     posted: the coordinator posts itself when it needs the author).
# Never prints, never fails: a hook error must not disturb the session. Posts a fixed
# text with the notification type only, never the notification's message.
set -u

dir=$(cd "$(dirname "$0")" && pwd)
channel="$dir/coordinator-channel.sh"

input=$(cat 2>/dev/null) || input=
[ -n "${JANUSLIN_AGENT_STATE_DIR:-}" ] || exit 0
[ -f "$channel" ] || exit 0

type=$(printf '%s' "$input" | jq -r '.notification_type // empty' 2>/dev/null) || type=
case "$type" in
  permission_prompt|elicitation_dialog) ;;
  *) exit 0 ;;
esac

sh "$channel" post "Claude Code in the sandbox is waiting for input ($type). Answer in the terminal or through Remote Control." > /dev/null 2>&1 || true
exit 0
