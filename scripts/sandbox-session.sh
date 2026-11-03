#!/bin/sh
# Start, stop, or restart the sandbox session in one command (docs/runbooks/start-coordinator.md).
# Runs in the `agent` macOS account (agent-session), never inside the sandbox.
#
#   scripts/sandbox-session.sh start [--unlock-keychain] [--agent claude|codex]    update main, start the broker, sbx run
#   scripts/sandbox-session.sh restart [--unlock-keychain] [--agent claude|codex]  update main, stop the VM, then start
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
# for the sbx keychain password. --agent defaults to claude; codex is launched
# with sbx exec in the same VM, with workspace-write and automatic review.
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
  echo "usage: $0 start [--unlock-keychain] [--agent claude|codex] | restart [--unlock-keychain] [--agent claude|codex] | stop" >&2
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

parse_options() {
  unlock=0
  agent=claude
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --unlock-keychain) unlock=1; shift ;;
      --agent)
        [ "$#" -ge 2 ] || {
          echo "sandbox-session: warning: --agent requires a value (claude or codex)." >&2
          usage
        }
        case "$2" in
          claude|codex) agent=$2 ;;
          *) echo "sandbox-session: warning: --agent must be claude or codex." >&2; usage ;;
        esac
        shift 2
        ;;
      *) usage ;;
    esac
  done
}

launch_agent() {
  case "$agent" in
    claude) sbx run --name "$SANDBOX" ;;
    # bash sources the VM environment first, then override the kit's Claude
    # trailer default. This fixed command runs only inside the existing VM.
    codex) sbx exec -it "$SANDBOX" bash -c 'export AGENT_TOOL=codex; exec codex --sandbox workspace-write --approve-for-me' ;;
  esac
}

start() {
  parse_options "$@"
  if [ -z "${SANDBOX_SESSION_UPDATED:-}" ]; then
    update_main
    SANDBOX_SESSION_UPDATED=1 exec sh "$here/sandbox-session.sh" start "$@"
  fi
  [ "$unlock" -eq 0 ] || security unlock-keychain "$KEYCHAIN"
  start_broker
  echo "sandbox-session: keep the Mac awake from your own account (caffeinate -ims); then paste the coordinator prompt."
  if [ "$agent" = claude ]; then
    echo "sandbox-session: type /remote-control for phone access."
  fi
  launch_agent || {
    rc=$?
    echo "sandbox-session: $agent launch failed (exit $rc); stopping the broker; its current tokens expire within the hour." >&2
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
      parse_options "$@"
      # Update first, so a failed fast-forward leaves the VM running.
      if [ -z "${SANDBOX_SESSION_UPDATED:-}" ]; then
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
