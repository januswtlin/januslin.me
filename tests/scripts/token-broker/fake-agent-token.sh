#!/bin/sh
# Fake scripts/agent-token.sh for tests/scripts/token-broker: writes a fake token
# file for <app> into $JANUSLIN_AGENT_STATE_DIR, valid for one hour, and logs the
# call. FAKE_FAIL=<app> makes that app fail.
set -eu
app=$1
echo "mint $app" >> "$FAKE_LOG"
[ "${FAKE_FAIL:-}" = "$app" ] && { echo "agent-token: GitHub returned HTTP 500 for $app" >&2; exit 1; }
exp=$(($(date +%s) + 3600))
iso=$(date -u -d "@$exp" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -r "$exp" +%Y-%m-%dT%H:%M:%SZ)
umask 077
mkdir -p "$JANUSLIN_AGENT_STATE_DIR"
printf 'ghs_FAKE_%s_%s\n%s\n' "$app" "$$" "$iso" > "$JANUSLIN_AGENT_STATE_DIR/$app.token"
echo "agent-token: $app permissions: {}, repositories: [\"januswtlin/januslin.me\"]"
echo "agent-token: $app token written to $JANUSLIN_AGENT_STATE_DIR/$app.token, expires $iso."
