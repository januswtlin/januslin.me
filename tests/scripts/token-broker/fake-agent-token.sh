#!/bin/sh
# Fake scripts/agent-token.sh for tests/scripts/token-broker: writes a fake token
# file for <app> into $JANUSLIN_AGENT_STATE_DIR, valid for one hour, and logs the
# call with the set it was given ($JANUSLIN_AGENT_APPS). FAKE_FAIL=<app> makes that
# app fail. --revoke <app> logs "revoke <app> <token>" and deletes the file;
# FAKE_REVOKE_FAIL=1 makes the revocation fail.
set -eu
if [ "$1" = --revoke ]; then
  app=$2
  f="$JANUSLIN_AGENT_STATE_DIR/$app.token"
  [ -f "$f" ] || exit 0
  echo "revoke $app $(sed -n 1p "$f")" >> "$FAKE_LOG"
  [ -z "${FAKE_REVOKE_FAIL:-}" ] || exit 1
  rm -f "$f"
  exit 0
fi
app=$1
echo "mint $app" >> "$FAKE_LOG"
echo "set $app $(jq -r .set "$JANUSLIN_AGENT_APPS")" >> "$FAKE_LOG"
[ "${FAKE_FAIL:-}" = "$app" ] && { echo "agent-token: GitHub returned HTTP 500 for $app" >&2; exit 1; }
exp=$(($(date +%s) + 3600))
iso=$(date -u -d "@$exp" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -r "$exp" +%Y-%m-%dT%H:%M:%SZ)
umask 077
mkdir -p "$JANUSLIN_AGENT_STATE_DIR"
printf 'ghs_FAKE_%s_%s\n%s\n' "$app" "$$" "$iso" > "$JANUSLIN_AGENT_STATE_DIR/$app.token"
echo "agent-token: $app permissions: {}, repositories: [\"januswtlin/januslin.me\"]"
echo "agent-token: $app token written to $JANUSLIN_AGENT_STATE_DIR/$app.token, expires $iso."
