#!/bin/sh
# Mint or revoke a GitHub App installation token for a local agent (ADR-0009).
#
#   scripts/agent-token.sh <app>            mint a token, write it to the token file
#   scripts/agent-token.sh --revoke <app>   revoke the current token, delete the file
#
# <app> is januslin-agent (the implementer role) or januslin-reviewer (the reviewer
# role). Which GitHub App serves each role comes from the active App set, which the
# author puts into this account with tools/author/januslin-keys (ADR-0015):
#
# Set:   ~/.config/januslin-agent/active/apps.json   App IDs, installation IDs, key file names
# Key:   ~/.config/januslin-agent/active/<role>.pem  (0600)
# Token: ~/.local/state/januslin-agent/<app>.token (0600)
#        line 1 = token, line 2 = expiry (UTC, ISO 8601). Read it with agent-gh or
#        the git credential helper; never copy it into an environment variable.
# Nothing here prints the key or a token. Secrets reach curl through stdin or a
# 0600 temp file, never argv (argv is visible to `ps`).
set -eu
umask 077

command -v jq >/dev/null 2>&1 || { echo "agent-token: jq is required (ships with current macOS; install if missing)." >&2; exit 1; }

REPO_NAME="januslin.me"
API="https://api.github.com"
CONF_DIR="${JANUSLIN_AGENT_CONFIG_DIR:-$HOME/.config/januslin-agent}"
STATE_DIR="${JANUSLIN_AGENT_STATE_DIR:-$HOME/.local/state/januslin-agent}"

usage() {
  echo "usage: $0 [--revoke] <januslin-agent|januslin-reviewer>" >&2
  exit 2
}

revoke=0
if [ "${1:-}" = "--revoke" ]; then
  revoke=1
  shift
fi
[ $# -eq 1 ] || usage
app=$1

case "$app" in
  januslin-agent)    role=implementer ;;
  januslin-reviewer) role=reviewer ;;
  *) usage ;;
esac

token_file="$STATE_DIR/$app.token"

mkdir -p "$STATE_DIR"
chmod 700 "$STATE_DIR"
tmp_dir=$(mktemp -d "$STATE_DIR/.tmp.XXXXXX")
trap 'rm -rf "$tmp_dir"' EXIT
trap 'exit 1' HUP INT TERM

b64url() { openssl base64 -A | tr '+/' '-_' | tr -d '='; }

# Curl reads its headers from a config on stdin so no credential appears in argv.
# $1 = method, $2 = path, $3 = bearer credential, $4 = optional JSON body (not secret).
api() {
  method=$1 path=$2 bearer=$3 body=${4:-}
  out="$tmp_dir/response"
  {
    printf 'header = "Authorization: Bearer %s"\n' "$bearer"
    printf 'header = "Accept: application/vnd.github+json"\n'
    printf 'header = "X-GitHub-Api-Version: 2022-11-28"\n'
    printf 'header = "User-Agent: januslin-agent-token"\n'
  } | curl -sS --max-time 30 --config - -X "$method" -o "$out" -w '%{http_code}' \
      ${body:+-H 'Content-Type: application/json' --data "$body"} "$API$path"
}

if [ "$revoke" -eq 1 ]; then
  if [ ! -f "$token_file" ]; then
    echo "agent-token: no token file for $app; nothing to revoke."
    exit 0
  fi
  tok=$(sed -n 1p "$token_file")
  status=$(api DELETE /installation/token "$tok")
  case "$status" in
    204) echo "agent-token: revoked $app token." ;;
    401) echo "agent-token: $app token was already invalid or expired." ;;
    *)   echo "agent-token: revoke failed for $app (HTTP $status); file kept." >&2; exit 1 ;;
  esac
  rm -f "$token_file"
  exit 0
fi

# The broker passes a snapshot of apps.json (JANUSLIN_AGENT_APPS) so it can tell
# which set a token came from; keys are always read from active/.
active="$CONF_DIR/active"
apps="${JANUSLIN_AGENT_APPS:-$active/apps.json}"
[ -r "$apps" ] || { echo "agent-token: no active App set in $active; the author runs januslin-keys use <set>." >&2; exit 1; }
# App IDs are the JWT `iss`; installation IDs and App IDs are public identifiers.
entry=$(jq -er --arg role "$role" '
  def id: type == "number" and . > 0 and floor == .;
  select(.version == 1 and .repository == "januswtlin/januslin.me") | .apps[$role]
  | select((.app_id | id) and (.installation_id | id)
           and (.key | type == "string" and test("^[a-z0-9-]+\\.pem$")))
  | "\(.app_id) \(.installation_id) \(.key)"' "$apps" 2>/dev/null) \
  || { echo "agent-token: $apps has no valid $role entry." >&2; exit 1; }
app_id=${entry%% *}
entry=${entry#* }
installation_id=${entry%% *}
key="$active/${entry#* }"

[ -r "$key" ] || { echo "agent-token: cannot read key for $app." >&2; exit 1; }
# GNU stat first: on Linux, `stat -f` succeeds with file-system output instead.
perm=$(stat -c '%a' "$key" 2>/dev/null || stat -f '%Lp' "$key")
[ "$perm" = "600" ] || { echo "agent-token: key for $app must be mode 0600 (is $perm)." >&2; exit 1; }

# JWT: RS256, iat 60 s in the past (clock drift), exp 9 min ahead (limit is 10).
now=$(date +%s)
header=$(printf '{"alg":"RS256","typ":"JWT"}' | b64url)
payload=$(printf '{"iat":%d,"exp":%d,"iss":"%s"}' $((now - 60)) $((now + 540)) "$app_id" | b64url)
signature=$(printf '%s.%s' "$header" "$payload" | openssl dgst -sha256 -sign "$key" -binary | b64url)
jwt="$header.$payload.$signature"

status=$(api POST "/app/installations/$installation_id/access_tokens" "$jwt" \
  "{\"repositories\":[\"$REPO_NAME\"]}")
if [ "$status" != "201" ]; then
  echo "agent-token: GitHub returned HTTP $status for $app: $(jq -r '.message // empty' "$tmp_dir/response" 2>/dev/null)" >&2
  exit 1
fi

# Print what GitHub actually granted so it can be compared with ADR-0009.
echo "agent-token: $app permissions: $(jq -c '.permissions' "$tmp_dir/response"), repositories: $(jq -c '[.repositories[].full_name]' "$tmp_dir/response")"
jq -e -r '.token, .expires_at' "$tmp_dir/response" > "$tmp_dir/token" \
  || { echo "agent-token: unexpected response for $app." >&2; exit 1; }
chmod 600 "$tmp_dir/token"
mv "$tmp_dir/token" "$token_file"
echo "agent-token: $app token written to $token_file, expires $(sed -n 2p "$token_file")."
