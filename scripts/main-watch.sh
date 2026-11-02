#!/bin/sh
# Persistent main-only merge audit. GitHub strings are data, never shell code.
# shellcheck disable=SC2016
set -eu
root=$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)
repo=januswtlin/januslin.me
author=2433928
initial=422517b80a52ae51d849080ab01c5b6a60b22b91
state=${MAIN_WATCH_STATE:-$HOME/.local/state/januslin-agent/main-watch.state}
usage() { echo 'usage: main-watch.sh init [--baseline <test-sha>] | check | wait [--interval s] [--max n] | accept <sha>' >&2; exit 2; }
fail() { echo "main-watch: $*; state unchanged." >&2; exit 1; }
sha_ok() { [ "${#1}" = 40 ] && case "$1" in *[!0-9a-f]*) false;; *) true;; esac; }
uint() { case "$1" in ''|*[!0-9]*) return 1;; esac; [ "${#1}" -lt 10 ]; }
[ "$#" -gt 0 ] || usage
command=$1; shift
interval=300; maximum=0; baseline=$initial
case "$command" in
 init) if [ "$#" != 0 ]; then [ "$#" = 2 ] && [ "$1" = --baseline ] && sha_ok "$2" || usage
   # Alternate roots are a fixture facility, never an implicit production reset.
   [ -n "${MAIN_WATCH_STATE:-}" ] || usage; baseline=$2
   fi;;
 check) [ "$#" = 0 ] || usage;;
 accept) [ "$#" = 1 ] && sha_ok "$1" || usage; accepted=$1;;
 wait) while [ "$#" -gt 0 ]; do [ "$#" -ge 2 ] || usage; uint "$2" || usage
   case "$1" in --interval) interval=$2;; --max) [ "$2" -gt 0 ] || usage; maximum=$2;; *) usage;; esac; shift 2; done;;
 *) usage;;
esac
case "$state" in /*) ;; *) fail 'state path must be absolute';; esac
umask 077
tmp=$(mktemp -d)
locked=false
cleanup() { rm -rf "$tmp"; if [ "$locked" = true ]; then rmdir "$state.lock"; fi; }
trap cleanup EXIT
trap 'exit 1' HUP INT TERM
# Do not expose gh stderr (including authentication errors).
api() { "$root/scripts/agent-gh" januslin-agent api "$1" --jq "$2" 2> "$tmp/api-error" || fail 'API response unavailable, incomplete, or invalid'; }
lock() { mkdir "$state.lock" 2>/dev/null || fail 'state busy or lock left by interrupted writer (inspect before removing)'; locked=true; }
unlock() { rmdir "$state.lock"; locked=false; }
# State is a strictly validated, non-executable TSV journal. No sourcing/eval.
load() {
 [ ! -L "$state" ] && [ -f "$state" ] && [ -r "$state" ] || fail 'no readable regular state; ask the author before init'
 # Refuse state readable or writable by another user. Linux VM and BSD checks.
 mode=$(stat -c %a "$state" 2>/dev/null || stat -f %Lp "$state" 2>/dev/null) || fail 'cannot inspect state permissions'
 [ "$mode" = 600 ] || fail 'state permissions must be 0600'
 [ -z "$(tail -c 1 "$state")" ] || fail 'incomplete state record'
 : > "$tmp/accepted"; : > "$tmp/pending"; baseline=; line=0
 while IFS="$(printf '\t')" read -r kind value pr merger reason extra; do
   line=$((line+1)); sha_ok "$value" || fail 'invalid state SHA'
   [ -z "$extra" ] || fail 'invalid state fields'
   case "$kind" in
    baseline) [ "$line" = 1 ] && [ -z "$pr$merger$reason" ] || fail 'invalid state baseline'; baseline=$value;;
    accepted) [ -z "$pr$merger$reason" ] || fail 'invalid acceptance log'; printf '%s\n' "$value" >> "$tmp/accepted";;
    pending) case "$pr" in null) ;; *) uint "$pr" && [ "$pr" -gt 0 ] || fail 'invalid state PR';; esac
      case "$merger" in null) ;; *) uint "$merger" || fail 'invalid state actor';; esac
      case "$reason" in no-pr|merge-sha-mismatch|not-author|history-rewritten) ;; *) fail 'invalid pending reason';; esac
      printf '%s\t%s\t%s\t%s\n' "$value" "$pr" "$merger" "$reason" >> "$tmp/pending";;
    *) fail 'invalid state record';;
   esac
 done < "$state"
 [ -n "$baseline" ] || fail 'empty state'
}
save() {
 # Create beside the destination: rename is atomic even if /tmp is another mount.
 stage=$(mktemp "$state.tmp.XXXXXXXX") || fail 'cannot stage state'
 if ! { printf 'baseline\t%s\n' "$baseline"; sed "s/^/accepted$(printf '\t')/" "$tmp/accepted"; sed "s/^/pending$(printf '\t')/" "$tmp/pending"; } > "$stage"; then
   rm -f "$stage"; fail 'cannot write state'
 fi
 if ! chmod 600 "$stage" || ! mv -f "$stage" "$state"; then rm -f "$stage"; fail 'cannot replace state'; fi
}
report() { printf '{"sha":"%s","pr":%s,"merged_by_id":%s,"suspicious":%s,"reason":"%s"}\n' "$1" "$2" "$3" "$4" "$5" >> "$tmp/output"; }
pending() {
 # Acceptance covers a commit, not a later movement of main back to that SHA.
 if [ "$4" != history-rewritten ] && grep -Fqx "$1" "$tmp/accepted"; then return 0; fi
 if ! cut -f1 "$tmp/pending" | grep -Fqx "$1"; then printf '%s\t%s\t%s\t%s\n' "$1" "$2" "$3" "$4" >> "$tmp/pending"; fi
}
check() {
 [ -e "$state" ] || fail 'no state; ask the author before init'
 lock; load; : > "$tmp/output"
 head=$(api "repos/$repo/git/ref/heads/main" '.object.sha | if type=="string" and test("^[0-9a-f]{40}$") then . else error("invalid main head") end')
 : > "$tmp/commits"; page=1; count=0; total=; previous=$baseline
 while :; do
   api "repos/$repo/compare/$baseline...$head?per_page=100&page=$page" '
     if (.status|type)!="string" or (.total_commits|type)!="number" or .total_commits<0 or (.total_commits|floor)!=.total_commits or (.commits|type)!="array" or (.commits|length)>100 then error("invalid compare") else . end |
     (["PAGE",.status,(.total_commits|tostring),.base_commit.sha,.merge_base_commit.sha]|join("\t")),
     (.commits[]|if (.sha|type)!="string" or (.sha|test("^[0-9a-f]{40}$")|not) or (.parents|type)!="array" then error("invalid commit") else [.sha,(.parents|length|tostring),(.parents[0].sha // "-")]|join("\t") end)
   ' > "$tmp/page"
   IFS="$(printf '\t')" read -r tag status page_total base merge_base < "$tmp/page"
   [ "$tag" = PAGE ] && [ "$base" = "$baseline" ] && uint "$page_total" || fail 'invalid compare metadata'
   case "$status" in
    ahead|identical) [ "$merge_base" = "$baseline" ] || fail 'compare ancestry inconsistent';;
    behind|diverged) pending "$head" null null history-rewritten; break;;
    *) fail 'unknown compare status';;
   esac
   if [ -z "$total" ]; then total=$page_total; else [ "$total" = "$page_total" ] || fail 'compare changed while paging'; fi
   sed '1d' "$tmp/page" >> "$tmp/commits"
   added=$(sed '1d' "$tmp/page" | wc -l | tr -d ' '); count=$((count+added))
   [ "$count" -le "$total" ] || fail 'compare returned excess commits'
   [ "$count" -lt "$total" ] || break
   [ "$added" -gt 0 ] || fail 'compare ended before all commits were returned'
   page=$((page+1))
 done
 if [ "$status" = ahead ] || [ "$status" = identical ]; then
   # Require the complete chronological linear chain, ending at the frozen head.
   while IFS="$(printf '\t')" read -r sha parents parent; do
     [ "$parents" = 1 ] && [ "$parent" = "$previous" ] || fail 'compare is incomplete or nonlinear'
     previous=$sha
   done < "$tmp/commits"
   [ "$previous" = "$head" ] || fail 'compare does not reach main head'
   next_baseline=$baseline; blocked=false
   # An orphaned suspicion (rewritten away) still stops progress until accepted.
   while IFS="$(printf '\t')" read -r pending_sha pending_pr pending_id pending_reason; do
     cut -f1 "$tmp/commits" | grep -Fqx "$pending_sha" || blocked=true
   done < "$tmp/pending"
   while IFS="$(printf '\t')" read -r sha parents parent; do
     if grep -Fqx "$sha" "$tmp/accepted"; then
       [ "$blocked" = true ] || next_baseline=$sha
       continue
     fi
     reason=no-pr; pr=null; merger=null; valid=false; matching=false; page=1
     while :; do
       api "repos/$repo/commits/$sha/pulls?per_page=100&page=$page" '
         if type!="array" or length>100 then error("invalid PR list") else
           ("COUNT\t"+(length|tostring)), (.[]|.number|if type=="number" and .>0 and floor==. then tostring else error("invalid PR number") end) end
       ' > "$tmp/pulls"
       IFS="$(printf '\t')" read -r tag number < "$tmp/pulls"
       [ "$tag" = COUNT ] && uint "$number" || fail 'invalid PR page'
       sed '1d' "$tmp/pulls" > "$tmp/numbers"
       while IFS= read -r n; do
         uint "$n" && [ "$n" -gt 0 ] || fail 'invalid PR number'
         api "repos/$repo/pulls/$n" '
           if (.number|type)!="number" or (.merged|type)!="boolean" or (.base.repo.full_name|type)!="string" or (.base.ref|type)!="string" or (.merge_commit_sha!=null and ((.merge_commit_sha|type)!="string" or (.merge_commit_sha|test("^[0-9a-f]{40}$")|not))) or (.merged_by!=null and ((.merged_by.id|type)!="number" or .merged_by.id<0 or (.merged_by.id|floor)!=.merged_by.id)) then error("invalid PR detail") else
           [.number,.merged,(.merge_commit_sha // "-"),(.merged_by.id // "null"),.base.repo.full_name,.base.ref]|map(tostring)|join("\t") end
         ' > "$tmp/detail"
         IFS="$(printf '\t')" read -r detail_n merged merge_sha id base_repo base_ref < "$tmp/detail"
         [ "$detail_n" = "$n" ] || fail 'PR detail number mismatch'
         if [ "$merge_sha" = "$sha" ] && [ "$merged" = true ] && [ "$base_repo" = "$repo" ] && [ "$base_ref" = main ]; then
           matching=true; pr=$n; merger=$id; reason=not-author
           if [ "$id" = "$author" ]; then valid=true; good_pr=$n; fi
         elif [ "$matching" = false ]; then reason=merge-sha-mismatch; pr=$n; merger=$id
         fi
       done < "$tmp/numbers"
       [ "$number" = 100 ] || break
       page=$((page+1))
     done
     if [ "$valid" = true ]; then
       # A previously observed suspicion remains sticky even if remote data changes.
       if cut -f1 "$tmp/pending" | grep -Fqx "$sha"; then blocked=true
       else report "$sha" "$good_pr" "$author" false merged-by-author; [ "$blocked" = true ] || next_baseline=$sha
       fi
     else pending "$sha" "$pr" "$merger" "$reason"; blocked=true
     fi
   done < "$tmp/commits"
   baseline=$next_baseline
 fi
 while IFS="$(printf '\t')" read -r sha pr merger reason; do report "$sha" "$pr" "$merger" true "$reason"; done < "$tmp/pending"
 save; unlock
 cat "$tmp/output"
 [ ! -s "$tmp/pending" ] || return 3
}
case "$command" in
 init)
   [ ! -e "$state" ] && [ ! -L "$state" ] || fail 'state already exists; init never resets it'
   mkdir -p "$(dirname "$state")" || fail 'cannot create state directory'
   lock
   [ ! -e "$state" ] && [ ! -L "$state" ] || fail 'state already exists'
   : > "$tmp/accepted"; : > "$tmp/pending"; save;;
 check) check;;
 accept)
   lock; load
   cut -f1 "$tmp/pending" | grep -Fqx "$accepted" || fail 'SHA is not a pending suspicious report'
   if awk -F '\t' -v sha="$accepted" '$1==sha && $4=="history-rewritten"{found=1} END{exit !found}' "$tmp/pending"; then baseline=$accepted
   fi
   # Only the exact named SHA is cleared; other observations remain sticky.
   awk -F '\t' -v sha="$accepted" '$1!=sha' "$tmp/pending" > "$tmp/remaining"; mv "$tmp/remaining" "$tmp/pending"
   printf '%s\n' "$accepted" >> "$tmp/accepted"; save;;
 wait)
   attempts=0
   while :; do
     result=0; check > "$tmp/wait-output" || result=$?
     if [ "$result" != 0 ] || [ -s "$tmp/wait-output" ]; then cat "$tmp/wait-output"; exit "$result"; fi
     attempts=$((attempts+1)); if [ "$maximum" != 0 ] && [ "$attempts" -ge "$maximum" ]; then exit 2; fi
     sleep "$interval"
   done;;
esac
