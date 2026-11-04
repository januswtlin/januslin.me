#!/bin/sh
# Static check of the tracked Codex TOML files; runs no Codex binary.
set -eu
here=$(CDPATH='' cd -- "$(dirname "$0")" && pwd)
exec python3 "$here/test.py"
