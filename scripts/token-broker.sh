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
# A token is replaced when it has less than 10 minutes left.
#
# The Apps come from the active App set, ~/.config/januslin-agent/active/, which
# only the author changes (tools/author/januslin-keys, ADR-0015). Each check
# compares the set with the one a token was minted from: when the author switched
# sets, the old token is revoked and a new one minted at once; when the author
# removed the set, the tokens are revoked and nothing is minted. The set's public
# identity (set name, bot names and IDs, never a key) is published to
# sandbox-config/identity.json for the agents in the VM.
# Nothing here prints a token, and nothing but token files is ever written to
# the token directory.
set -eu
umask 077

here=$(cd "$(dirname "$0")" && pwd)
# Its own root variable: JANUSLIN_AGENT_STATE_DIR means "the token directory" to
# agent-gh and the credential helper, and may point at sandbox-tokens.
STATE="${JANUSLIN_BROKER_ROOT:-$HOME/.local/state/januslin-agent}"
WORK="$STATE/broker"
CONF="${JANUSLIN_AGENT_CONFIG_DIR:-$HOME/.config/januslin-agent}"
APPS="$CONF/active/apps.json"
IDENTITY_DIR="$CONF/sandbox-config"
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

# The checks agent-token.sh and januslin-keys make, for both roles at once, so a
# broken apps.json is neither taken for a switch nor published.
apps_valid() {
  jq -e '
    def id: type == "number" and . > 0 and floor == .;
    .version == 1 and .repository == "januswtlin/januslin.me" and (.set | type == "string")
    and ([.apps.implementer, .apps.reviewer] | all(. != null and (.app_id | id)
         and (.installation_id | id) and (.bot_user_id | id) and (.slug | type == "string")
         and (.key | type == "string" and test("^[a-z0-9-]+\\.pem$"))))' "$APPS" >/dev/null 2>&1
}

# $1 = app, $2 = reason. Takes the token out of the token directory first, then
# revokes it from the broker's own directory; a token that cannot be revoked is
# still removed and expires within the hour.
retire() {
  r_app=$1
  r_file="$(target_dir "$r_app")/$r_app.token"
  r_dir="$WORK/retire-$r_app"
  rm -f "$WORK/$r_app.apps.json"
  [ -f "$r_file" ] || return 0
  rm -rf "$r_dir"
  mkdir -p "$r_dir"
  mv -f "$r_file" "$r_dir/$r_app.token"
  r_exp=$(sed -n 2p "$r_dir/$r_app.token")
  if JANUSLIN_AGENT_STATE_DIR="$r_dir" sh "$here/agent-token.sh" --revoke "$r_app" >/dev/null 2>&1; then
    log "$r_app: $2; token revoked"
  else
    log "$r_app: $2; could not revoke the token, removed it (expires $r_exp)" >&2
  fi
  rm -rf "$r_dir"
}

refresh() { # $1 = app; mints when the token is missing, near expiry, or from another set
  app=$1
  dir=$(target_dir "$app")
  file="$dir/$app.token"
  used="$WORK/$app.apps.json"   # the apps.json the current token was minted from
  safe_dir "$STATE" && safe_dir "$dir" && safe_dir "$WORK" || return 1
  [ ! -L "$file" ] || { log "refusing: $file is a symlink" >&2; return 1; }
  if [ ! -f "$APPS" ]; then
    [ ! -f "$file" ] || retire "$app" "no active App set"
    return 1
  fi
  if [ -f "$file" ]; then
    if cmp -s "$APPS" "$used"; then
      left=$(( $(epoch "$(sed -n 2p "$file")") - $(date +%s) ))
      [ "$left" -lt "$MARGIN" ] || return 0
    else
      retire "$app" "App set changed"
    fi
  fi
  stage="$WORK/stage-$app"
  rm -rf "$stage"
  mkdir -p "$stage"
  cp "$APPS" "$stage/apps.json"
  if ! JANUSLIN_AGENT_APPS="$stage/apps.json" JANUSLIN_AGENT_STATE_DIR="$stage" \
      sh "$here/agent-token.sh" "$app" >/dev/null 2>"$stage/err"; then
    log "$app: mint failed: $(head -n 1 "$stage/err")" >&2
    rm -rf "$stage"
    return 1
  fi
  chmod 600 "$stage/$app.token"
  mv -f "$stage/$app.token" "$file"
  mv -f "$stage/apps.json" "$used"
  rm -rf "$stage"
  log "$app: new token from set $(jq -r '.set' "$used"), expires $(sed -n 2p "$file")"
}

# Public fields only, chosen one by one: nothing from apps.json reaches the VM
# unless it is named here.
publish_identity() {
  safe_dir "$CONF" && safe_dir "$IDENTITY_DIR" || return 1
  out="$IDENTITY_DIR/identity.json"
  [ ! -L "$out" ] || { log "refusing: $out is a symlink" >&2; return 1; }
  if [ ! -f "$APPS" ]; then
    rm -f "$out"
    return 0
  fi
  jq '{set, owner, repository,
       apps: (.apps | {implementer, reviewer} | map_values({app_id, slug, bot_user_id}))}' \
    "$APPS" > "$WORK/identity.json" 2>/dev/null \
    || { rm -f "$WORK/identity.json"; log "identity: $APPS is not valid JSON" >&2; return 1; }
  chmod 600 "$WORK/identity.json"
  if cmp -s "$WORK/identity.json" "$out"; then rm -f "$WORK/identity.json"; else mv -f "$WORK/identity.json" "$out"; fi
}

once() { # $1 = loop: say "no active App set" once per change, not every minute
  safe_dir "$STATE" && safe_dir "$WORK" || return 1
  if [ -f "$APPS" ]; then
    rm -f "$WORK/no-set"
  elif [ "${1:-}" != loop ] || [ ! -f "$WORK/no-set" ]; then
    log "no active App set; nothing is minted until the author runs januslin-keys use <set>" >&2
    : > "$WORK/no-set"
  fi
  if [ -f "$APPS" ] && ! apps_valid; then
    if [ "${1:-}" != loop ] || [ ! -f "$WORK/bad-set" ]; then
      log "$APPS is not a valid App set; keeping the current tokens until they expire" >&2
      : > "$WORK/bad-set"
    fi
    return 1
  fi
  rm -f "$WORK/bad-set"
  rc=0
  refresh januslin-agent || rc=1
  refresh januslin-reviewer || rc=1
  publish_identity || rc=1
  return $rc
}

# Running only if the pid in the file is alive and is this broker, so a stale
# pid file never makes `stop` kill an unrelated process.
running() {
  [ -f "$PIDFILE" ] || return 1
  pid=$(cat "$PIDFILE")
  case "$pid" in ''|*[!0-9]*) return 1 ;; esac
  ps -p "$pid" -o args= 2>/dev/null | grep -q 'token-broker\.sh start'
}

case "${1:-}" in
  once)
    once "${2:-}"   # `once loop` is what the background loop runs; the tests use it
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
        once loop >> "$LOG" 2>&1 || true
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
    if [ -f "$APPS" ]; then echo "app set: $(jq -r '.set // "unnamed"' "$APPS" 2>/dev/null || echo unreadable)"; else echo "app set: none active"; fi
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
