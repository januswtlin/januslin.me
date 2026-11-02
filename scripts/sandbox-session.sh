#!/bin/sh
# Start, stop, or restart the sandbox session in one command (docs/runbooks/start-coordinator.md).
# Runs in the `agent` macOS account (agent-session), never inside the sandbox.
#
#   scripts/sandbox-session.sh start [--unlock-keychain]    update main, start the broker, sbx run
#   scripts/sandbox-session.sh restart [--unlock-keychain]  update main, stop the VM, then start
#   scripts/sandbox-session.sh stop                         stop the VM and the broker
#
# start: fast-forwards the host clone to origin/main and re-runs itself from the
# updated file, so the broker and this script always run reviewed code from main.
# It then restarts the broker, mints both tokens in the foreground (stops here if
# that fails), starts the background refresh, and hands the terminal to
# `sbx run --name agent-vm`; if that fails, it stops the broker again. Leaving the
# session (/exit) leaves the VM and the broker running; `stop` ends both. The
# broker belongs to this terminal: closing the agent-session window ends it.
# --unlock-keychain is for the first start after a restart of the Mac; it asks
# for the sbx keychain password.
#
# Nothing runs this on a schedule: the broker refreshes tokens only while the
# author has started a session (ADR-0009). Stopping it revokes nothing; the last
# tokens expire within the hour.
set -eu

here=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$here/.." && pwd)
SANDBOX=agent-vm
KEYCHAIN="$HOME/Library/Keychains/sbx.keychain-db"

usage() {
  echo "usage: $0 start [--unlock-keychain] | restart [--unlock-keychain] | stop" >&2
  exit 2
}

update_main() {
  cd "$root"
  git checkout -q main && git fetch -q origin && git merge -q --ff-only origin/main \
    || { echo "sandbox-session: could not fast-forward $root to origin/main; fix the host clone first." >&2; exit 1; }
}

start_broker() {
  sh "$here/token-broker.sh" stop >/dev/null
  sh "$here/token-broker.sh" once \
    || { echo "sandbox-session: minting the App tokens failed; see the message above. sbx run was not opened." >&2; exit 1; }
  sh "$here/token-broker.sh" start
  sh "$here/token-broker.sh" status
}

start() {
  unlock=0
  for arg in "$@"; do
    case "$arg" in
      --unlock-keychain) unlock=1 ;;
      *) usage ;;
    esac
  done
  if [ -z "${SANDBOX_SESSION_UPDATED:-}" ]; then
    update_main
    SANDBOX_SESSION_UPDATED=1 exec sh "$here/sandbox-session.sh" start "$@"
  fi
  [ "$unlock" -eq 0 ] || security unlock-keychain "$KEYCHAIN"
  start_broker
  echo "sandbox-session: keep the Mac awake from your own account (caffeinate -ims); then paste the coordinator prompt and type /remote-control."
  sbx run --name "$SANDBOX" || {
    rc=$?
    echo "sandbox-session: sbx run failed (exit $rc); stopping the broker; its current tokens expire within the hour." >&2
    sh "$here/token-broker.sh" stop
    exit "$rc"
  }
}

stop() {
  sbx stop "$SANDBOX" || echo "sandbox-session: sbx stop $SANDBOX failed; stopping the broker anyway." >&2
  sh "$here/token-broker.sh" stop
}

main() {
  cmd=${1:-}
  [ $# -eq 0 ] || shift
  case "$cmd" in
    start) start "$@" ;;
    restart)
      # Update first, so a failed fast-forward leaves the VM running.
      if [ -z "${SANDBOX_SESSION_UPDATED:-}" ]; then
        for arg in "$@"; do [ "$arg" = --unlock-keychain ] || usage; done
        update_main
        SANDBOX_SESSION_UPDATED=1 exec sh "$here/sandbox-session.sh" restart "$@"
      fi
      sbx stop "$SANDBOX" || true
      start "$@"
      ;;
    stop) [ $# -eq 0 ] || usage; stop ;;
    *) usage ;;
  esac
}

# Everything above is only definitions: `git merge` may rewrite this file while
# it runs, and the shell has already read the whole of main() by then.
main "$@"
