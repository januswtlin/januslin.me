#!/bin/sh
# Fake CLI only: no login, network, token broker, or real Codex session.
set -eu
here=$(CDPATH='' cd -- "$(dirname "$0")" && pwd)
exec python3 "$here/test.py"
