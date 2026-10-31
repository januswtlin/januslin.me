#!/bin/sh
# Start, stop, or restart the sandbox session in one command (docs/runbooks/start-coordinator.md).
# Runs in the `agent` macOS account (agent-session), never inside the sandbox.
#
#   scripts/sandbox-session.sh start [--unlock-keychain]    update main, start the broker, sbx run
#   scripts/sandbox-session.sh restart                      stop the VM, then start
#   scripts/sandbox-session.sh stop                         stop the VM and the broker
#
# start: fast-forwards the host clone to origin/main and re-runs itself from the
# updated file, so the broker and this script always run reviewed code from main.
# It then restarts the broker, mints both tokens in the foreground (stops here if
# that fails), starts the background refresh, and hands the terminal to
# `sbx run --name januslin`. Leaving the session (/exit) leaves the VM and the
# broker running; `stop` ends both. --unlock-keychain is for the first start
# after a restart of the Mac; it asks for the sbx keychain password.
#
# Nothing runs this on a schedule: the broker, and with it every live token,
# exists only while the author has started a session (ADR-0009).
set -eu

here=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$here/.." && pwd)
SANDBOX=januslin
KEYCHAIN="$HOME/Library/Keychains/sbx.keychain-db"

usage() {
  echo "usage: $0 start [--unlock-keychain] | restart | stop" >&2
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
    || { echo "sandbox-session: minting the App tokens failed; see the message above. The sandbox was not started." >&2; exit 1; }
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
  exec sbx run --name "$SANDBOX"
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
      [ $# -eq 0 ] || usage
      sbx stop "$SANDBOX" || true
      start
      ;;
    stop) [ $# -eq 0 ] || usage; stop ;;
    *) usage ;;
  esac
}

# Everything above is only definitions: `git merge` may rewrite this file while
# it runs, and the shell has already read the whole of main() by then.
main "$@"
