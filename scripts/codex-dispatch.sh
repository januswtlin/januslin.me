#!/bin/sh
# VM-only coordinator entry point. Python uses stdlib only (no package install).
set -eu
root=$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)
exec python3 "$root/scripts/codex_dispatch.py" "$@"
