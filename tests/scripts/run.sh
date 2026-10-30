#!/bin/sh
# Runs every script test under tests/scripts/*/test.sh. Exits non-zero on any failure.
set -eu
here=$(cd "$(dirname "$0")" && pwd)
rc=0
for t in "$here"/*/test.sh; do
  echo "== $t"
  sh "$t" || rc=1
done
exit $rc
