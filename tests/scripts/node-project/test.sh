#!/bin/sh
# Acceptance tests for the Node project bootstrap (T07, #57): package.json fields, pinned
# tooling that agrees, the verify chain, and the repository-wide editor and git attributes.
# Needs jq and node (both in the sandbox); no network.
set -u

here=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$here/../../.." && pwd)
pkg="$root/package.json"

fails=0
pass() { echo "ok   - $1"; }
fail() { echo "FAIL - $1"; fails=$((fails + 1)); }
check() { if [ "$2" = 0 ]; then pass "$1"; else fail "$1"; fi; }
field() { jq -r "$1" "$pkg" 2>/dev/null; }

[ -f "$pkg" ]
check "package.json exists" $?

[ "$(field '.private')" = true ] && [ "$(field '.type')" = module ] && [ "$(field '.license')" = MIT ]
check "package.json: private, type module, license MIT" $?

field '.packageManager' | grep -Eq '^pnpm@[0-9]+\.[0-9]+\.[0-9]+(\+sha[0-9]+\.[0-9a-f]+)?$'
check "packageManager pins an exact pnpm version" $?

grep -Eqx '24\.[0-9]+\.[0-9]+' "$root/.nvmrc" 2>/dev/null
check ".nvmrc pins an exact Node 24 version" $?

field '.engines.node' | grep -Eq '^\^24\.'
check "engines.node is Node 24.x" $?

(cd "$root" && node scripts/check-versions.js >/dev/null 2>&1)
check "packageManager, engines, and .nvmrc agree (scripts/check-versions.js)" $?

[ "$(field '.scripts.prepare // "none"')" = none ]
check "no prepare script (agent clones set core.hooksPath by hand)" $?

for s in check lint format test verify; do
  [ "$(field ".scripts.\"$s\" // \"\"")" != "" ]
  check "script '$s' exists" $?
done

field '.scripts.test' | grep -Eq '^sh tests/scripts/run\.sh && .*vitest run'
check "test runs the script tests first, then Vitest" $?

# verify chains check, lint, test with && so the first failure stops it.
verify=$(field '.scripts.verify')
printf '%s\n' "$verify" | grep -Eq '^pnpm (run )?check && pnpm (run )?lint && pnpm (run )?build && pnpm (run )?test$'
check "verify runs check, lint, build, test in order and stops on the first failure" $?

[ -f "$root/.editorconfig" ] && grep -q '^root = true' "$root/.editorconfig"
check ".editorconfig exists with root = true" $?

attrs=$(cd "$root" && git check-attr text eol -- x.sh 2>/dev/null)
printf '%s\n' "$attrs" | grep -q 'eol: lf'
check ".gitattributes: text files use LF" $?

for f in a.png a.jpg a.webp a.avif a.gif a.woff2 a.ttf a.otf; do
  (cd "$root" && git check-attr binary -- "$f" | grep -q 'binary: set')
  check ".gitattributes: $f is binary" $?
done

[ -f "$root/pnpm-lock.yaml" ]
check "pnpm-lock.yaml is committed" $?

echo "$fails failure(s)"
[ "$fails" = 0 ]
