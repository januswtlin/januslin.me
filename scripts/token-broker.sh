#!/bin/sh
# Host token broker for the sandbox (ADR-0013, T03). Runs in the `agent` macOS
# account, never inside the sandbox.
#
#   scripts/token-broker.sh start    mint now, then refresh in the background
#   scripts/token-broker.sh stop     stop the background broker
#   scripts/token-broker.sh once     mint or refresh once, in the foreground
#   scripts/token-broker.sh status   broker state and token expiries (no tokens)
#
# Tokens come from the sibling agent-token.sh, which mints into a private staging
# directory; the finished file is then moved in one rename into
# $STATE/sandbox-tokens/, which is mounted read-only into the VM. Both Apps'
# tokens live there: the proxy-injected `github` secret is not used, because it
# overrides every Authorization header, the reviewer's included (V18, ADR-0013).
# A token is replaced when it has less than 10 minutes left. Nothing here prints
# a token, and nothing but token files is ever written to that directory.
set -eu
umask 077

here=$(cd "$(dirname "$0")" && pwd)
STATE="${JANUSLIN_AGENT_STATE_DIR:-$HOME/.local/state/januslin-agent}"
WORK="$STATE/broker"
PIDFILE="$WORK/broker.pid"
LOG="$WORK/broker.log"
MARGIN=600     # refresh when less than this many seconds are left
INTERVAL=60    # seconds between checks in the background loop

target_dir() {
  case "$1" in
    januslin-agent|januslin-reviewer) echo "$STATE/sandbox-tokens" ;;
  esac
}

log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*"; }

epoch() { # ISO 8601 UTC -> seconds; 0 when unreadable
  date -j -u -f '%Y-%m-%dT%H:%M:%SZ' "$1" +%s 2>/dev/null \
    || date -u -d "$1" +%s 2>/dev/null || echo 0
}

# Refuse symlinks anywhere we write, so nothing lands outside these directories.
safe_dir() {
  [ ! -L "$1" ] || { log "refusing: $1 is a symlink" >&2; return 1; }
  mkdir -p "$1"
  chmod 700 "$1"
}

refresh() { # $1 = app; mints when the token is missing or near expiry
  app=$1
  dir=$(target_dir "$app")
  file="$dir/$app.token"
  safe_dir "$STATE" && safe_dir "$dir" && safe_dir "$WORK" || return 1
  [ ! -L "$file" ] || { log "refusing: $file is a symlink" >&2; return 1; }
  if [ -f "$file" ]; then
    left=$(( $(epoch "$(sed -n 2p "$file")") - $(date +%s) ))
    [ "$left" -lt "$MARGIN" ] || return 0
  fi
  stage="$WORK/stage-$app"
  rm -rf "$stage"
  mkdir -p "$stage"
  if ! JANUSLIN_AGENT_STATE_DIR="$stage" sh "$here/agent-token.sh" "$app" >/dev/null 2>"$stage/err"; then
    log "$app: mint failed: $(head -n 1 "$stage/err")" >&2
    rm -rf "$stage"
    return 1
  fi
  chmod 600 "$stage/$app.token"
  mv -f "$stage/$app.token" "$file"
  rm -rf "$stage"
  log "$app: new token, expires $(sed -n 2p "$file")"
}

once() {
  rc=0
  refresh januslin-agent || rc=1
  refresh januslin-reviewer || rc=1
  return $rc
}

running() { [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; }

case "${1:-}" in
  once)
    once
    ;;
  start)
    if running; then echo "token-broker: already running (pid $(cat "$PIDFILE"))." >&2; exit 1; fi
    safe_dir "$STATE" && safe_dir "$WORK"
    once >> "$LOG" 2>&1 || echo "token-broker: first mint failed; see $LOG" >&2
    (
      trap 'rm -f "$PIDFILE"; exit 0' TERM INT
      while :; do
        sleep "$INTERVAL" &
        wait $! || true
        once >> "$LOG" 2>&1 || true
      done
    ) </dev/null >/dev/null 2>&1 &
    echo $! > "$PIDFILE"
    echo "token-broker: started (pid $!), log $LOG"
    ;;
  stop)
    if running; then
      kill "$(cat "$PIDFILE")"
      echo "token-broker: stopped."
    else
      echo "token-broker: not running."
    fi
    rm -f "$PIDFILE"
    ;;
  status)
    if running; then echo "token-broker: running (pid $(cat "$PIDFILE"))"; else echo "token-broker: not running"; fi
    for app in januslin-agent januslin-reviewer; do
      file="$(target_dir "$app")/$app.token"
      if [ -f "$file" ]; then echo "$app: expires $(sed -n 2p "$file")"; else echo "$app: no token"; fi
    done
    ;;
  *)
    echo "usage: $0 start|stop|once|status" >&2
    exit 2
    ;;
esac
