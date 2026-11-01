#!/bin/sh
# GraphQL and jq variables intentionally stay literal in single quotes.
# shellcheck disable=SC2016
# Read-only coordinator state. Untrusted strings remain JSON; never source/eval them.
set -eu
root=$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)
author=2433928
approved=LA_kwDOVbvt8s8AAAADARxrMw
plan=53
usage() { echo 'usage: work-status.sh next | human | check <issue> | author-activity --since <YYYY-MM-DDTHH:MM:SSZ>' >&2; exit 2; }
[ "$#" -gt 0 ] || usage
command=$1; shift
case "$command" in
  next|human) [ "$#" = 0 ] || usage ;;
  check) [ "$#" = 1 ] || usage; case "$1" in ''|*[!0-9]*|0) usage;; esac; number=$1 ;;
  author-activity) [ "$#" = 2 ] && [ "$1" = --since ] || usage; since=$2
    printf '%s\n' "$since" | LC_ALL=C grep -Eq '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$' || usage ;;
  *) usage ;;
esac
umask 077
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT HUP INT TERM
fail() { echo 'work-status: API response unavailable, incomplete, or invalid; no decisions emitted.' >&2; exit 1; }
actor='... on User { databaseId } ... on Bot { databaseId }'
# Do not replay gh stderr: authentication errors must never expose credentials.
api() {
  api_query=$1; api_filter=$2; shift 2
  "$root/scripts/agent-gh" januslin-agent api graphql -f "query=$api_query" "$@" --jq \
    'if ((.errors // []) | length) != 0 then error("GraphQL errors") else (.data.item // error("missing node")) end | '"$api_filter" \
    2> "$tmp/api-error" || fail
}
# Every connection has its own cursor; nested connections are never truncated.
# Scope is a fixed schema type, not text taken from an issue.
pages() (
  scope=$1; id=$2; operation=$3; field=$4; selection=$5; filter=$6
  cursor=; seen='|'; page_file=$(mktemp "$tmp/page.XXXXXXXX")
  while :; do
    case "$field" in *\(*) connection="$field";; *) connection="$field(";; esac
    if [ "$scope" = Repository ]; then
      query="query WorkStatus$operation(\$cursor:String){item:repository(owner:\"januswtlin\",name:\"januslin.me\"){connection:${connection}first:100,after:\$cursor){pageInfo{hasNextPage endCursor} nodes{$selection}}}}"
      set --
    else
      query="query WorkStatus$operation(\$id:ID!,\$cursor:String){item:node(id:\$id){... on $scope{connection:${connection}first:100,after:\$cursor){pageInfo{hasNextPage endCursor} nodes{$selection}}}}}"
      set -- -f "id=$id"
    fi
    [ -z "$cursor" ] || set -- "$@" -f "cursor=$cursor"
    api "$query" '.connection // error("missing connection") | if (.nodes|type)!="array" or (.pageInfo.hasNextPage|type)!="boolean" then error("invalid connection") else . end | (["PAGE",(.pageInfo.hasNextPage|tostring),(.pageInfo.endCursor // "-")]|join("\t")), (.nodes[] | '"$filter"')' "$@" > "$page_file"
    IFS="$(printf '\t')" read -r tag more next < "$page_file"
    [ "$tag" = PAGE ] || fail
    sed '1d' "$page_file"
    [ "$more" = true ] || break
    case "$next" in ''|-|*[!A-Za-z0-9+/=_:-]*) fail;; esac
    case "$seen" in *"|$next|"*) fail;; esac
    seen="$seen$next|"; cursor=$next
  done
)
get() { sed -n "s/^$2$(printf '\t')//p" "$1"; }
metadata() (
  n=$1
  [ ! -f "$tmp/meta-$n" ] || exit 0
  # Alias the union to item so all API validation uses one path.
  query='query WorkStatusMetadata($n:Int!){repository(owner:"januswtlin",name:"januslin.me"){item:issueOrPullRequest(number:$n){__typename ... on Issue{id number title body issueState:state stateReason lastEditedAt updatedAt parent{number}} ... on PullRequest{id number title body prState:state lastEditedAt updatedAt}}}}'
  "$root/scripts/agent-gh" januslin-agent api graphql -f "query=$query" -F "n=$n" --jq '
    if ((.errors // [])|length)>0 then error("GraphQL errors") else (.data.repository.item // error("missing issue")) end | .state=(.issueState // .prState) |
    if (.number|type)!="number" or (.id|type)!="string" or (.body|type)!="string" or (.title|type)!="string" then error("invalid metadata") else . end |
    ("id\t"+.id), ("type\t"+.__typename), ("state\t"+.state), ("reason\t"+(.stateReason // "-")),
    ("edited\t"+(.lastEditedAt|tojson)), ("updated\t"+.updatedAt), ("parent\t"+((.parent.number // null)|tojson)),
    ("title\t"+(.title|tojson)), ("body\t"+(.body|tojson)),
    ("taskKey\t"+([.title|scan("^([A-Z]+[0-9]+):")|.[0]][0] // "-")),
    ("branch\t"+([.body|scan("\\*\\*Branch:\\*\\* `(?<branch>agent/[A-Za-z0-9/_-]+)`")|.[0]][0] // "-")),
    (.body|split("\n")|map(select(test("^\\*\\*Depends on:\\*\\*"))) |
      if length!=1 then "deps\tinvalid" else .[0]|sub("^\\*\\*Depends on:\\*\\* *";"")|sub("(?:\\. | +\\().*$";"")|sub(" *$";"")|
      if .=="none" then "deps\t-" elif test("^#[1-9][0-9]*(, *#[1-9][0-9]*)*$") then "deps\t"+gsub("[#,]";" ") else "deps\tinvalid" end end),
    ("blockers\t"+([.body|split("\n")[]|select(test("^\\*\\*Blocked by:\\*\\*"))|sub("^\\*\\*Blocked by:\\*\\* *";"")][0] // "nothing"|tojson)),
    (.body|split("\n")[]|select(test("^\\*\\*Blocked by:\\*\\*"))|scan("#[1-9][0-9]*")|"blocker\t"+ltrimstr("#"))
  ' > "$tmp/meta-$n" 2> "$tmp/api-error" || fail
)
labels() { pages Issue "$1" Labels labels 'id name' '[.id,(.name|tojson)]|join("\t")'; }
assignees() { pages Issue "$1" Assignees assignees 'databaseId' '(.databaseId // 0)|tostring'; }
timeline() { pages "$1" "$2" Timeline timelineItems "__typename ... on LabeledEvent{createdAt actor{$actor} label{id}} ... on UnlabeledEvent{createdAt actor{$actor} label{id}} ... on RenamedTitleEvent{createdAt actor{$actor}} ... on ClosedEvent{createdAt actor{$actor}} ... on ReopenedEvent{createdAt actor{$actor}}" 'select(.__typename=="LabeledEvent" or .__typename=="UnlabeledEvent" or .__typename=="RenamedTitleEvent" or .__typename=="ClosedEvent" or .__typename=="ReopenedEvent") | [.__typename,.createdAt,((.actor.databaseId // 0)|tostring),(.label.id // "-")]|join("\t")'; }
edits() { pages "$1" "$2" Edits userContentEdits "editedAt deletedAt editor{$actor}" '[(.editedAt // "unknown"),((.editor.databaseId // 0)|tostring),(.deletedAt // "-")]|join("\t")'; }
done_issue() (
  n=$1; metadata "$n" || exit 1; m="$tmp/meta-$n"
  [ "$(get "$m" state)" = CLOSED ] && [ "$(get "$m" reason)" = COMPLETED ] || exit 3
  timeline Issue "$(get "$m" id)" > "$tmp/close-$n" || exit 1
  closer=$(awk -F '\t' '$1=="ClosedEvent" {a=$3} END{print a}' "$tmp/close-$n")
  [ "$closer" = "$author" ] || exit 3
)
# Cache all open PRs and branches once, with complete outer and inner pagination.
claims() (
  [ ! -f "$tmp/claims" ] || exit 0
  pages Repository repo Refs 'refs(refPrefix:"refs/heads/",' 'name' '.name|select(startswith("agent/"))|tojson' > "$tmp/branches"
  pages Repository repo PullRequests 'pullRequests(states:OPEN,' 'id number title body headRefName' 'if (.id|type)!="string" or (.number|type)!="number" then error("invalid PR") else . end | [.id,(.number|tostring),(.headRefName|tojson),([(.title+"\n"+.body|ascii_downcase)| (scan("(?:^|[^A-Za-z0-9_/])#([1-9][0-9]*)")|.[0]), (scan("(?:^|[^A-Za-z0-9_/])januswtlin/januslin[.]me#([1-9][0-9]*)")|.[0]), (scan("https?://github[.]com/januswtlin/januslin[.]me/issues/([1-9][0-9]*)")|.[0])]|unique|join(","))]|join("\t")' > "$tmp/prs"
  : > "$tmp/claims-building"
  while IFS="$(printf '\t')" read -r pid pn head mentions; do
    [ -n "$pid" ] || continue
    printf '%s\t%s\t%s\n' "$pn" "$head" "$mentions" >> "$tmp/claims-building"
    pages PullRequest "$pid" Closing closingIssuesReferences 'number repository{nameWithOwner}' 'select(.repository.nameWithOwner=="januswtlin/januslin.me")|.number|tostring' > "$tmp/closing-$pn"
    while IFS= read -r closed; do printf '%s\t-\t%s\n' "$pn" "$closed" >> "$tmp/claims-building"; done < "$tmp/closing-$pn"
  done < "$tmp/prs"
  mv "$tmp/claims-building" "$tmp/claims"
)
assess() (
  n=$1; metadata "$n"; m="$tmp/meta-$n"; id=$(get "$m" id)
  labels "$id" > "$tmp/labels-$n"; assignees "$id" > "$tmp/assignees-$n"
  timeline Issue "$id" > "$tmp/timeline-$n"; edits Issue "$id" > "$tmp/edits-$n"
  state=startable; reasons="$tmp/reasons-$n"; : > "$reasons"
  reason() { printf '"%s"\n' "$1" >> "$reasons"; }
  if [ "$(get "$m" state)" != OPEN ]; then state=waiting; reason 'issue is not open'; fi
  if ! awk -F '\t' '$2=="\"task\""{found=1} END{exit !found}' "$tmp/labels-$n"; then state=waiting; reason 'issue is not a task'; fi
  approval=$(awk -F '\t' -v label="$approved" '$1=="LabeledEvent" && $4==label{print $2 "\t" $3}' "$tmp/timeline-$n" | tail -n 1)
  at=$(printf '%s\n' "$approval" | cut -f1); by=$(printf '%s\n' "$approval" | cut -f2)
  if ! awk -F '\t' -v label="$approved" '$1==label{found=1} END{exit !found}' "$tmp/labels-$n"; then state=unapproved; reason 'no label'
  elif [ "$by" != "$author" ]; then state=unapproved; reason 'label added by someone else'
  elif awk -F '\t' -v at="$at" -v author="$author" '($1=="unknown" || $3!="-" || ($1>=at && $2!=author)){bad=1} END{exit !bad}' "$tmp/edits-$n" \
    || { [ "$(get "$m" edited)" != null ] && [ ! -s "$tmp/edits-$n" ]; } \
    || awk -F '\t' -v at="$at" -v author="$author" '$1=="RenamedTitleEvent" && $2>=at && $3!=author{bad=1} END{exit !bad}' "$tmp/timeline-$n"; then state=unapproved; reason 'edited after approval'; fi
  deps=$(get "$m" deps)
  if [ "$deps" = invalid ]; then [ "$state" != startable ] || state=waiting; reason 'invalid dependencies'
  elif [ "$deps" != - ]; then
    for dep in $deps; do
      if done_issue "$dep"; then :; else code=$?; [ "$code" != 1 ] || fail; [ "$state" != startable ] || state=waiting; reason "dependency #$dep is not completed by author"; fi
    done
  fi
  if awk -v author="$author" '$0!=author{bad=1} END{exit !bad}' "$tmp/assignees-$n"; then state=in-progress; reason 'assigned to another developer'; fi
  claims
  branch=$(get "$m" branch); task_key=$(get "$m" taskKey)
  if [ "$branch" != - ] && grep -Fx "\"$branch\"" "$tmp/branches" >/dev/null; then state=in-progress; reason 'agent branch exists'; fi
  while IFS= read -r ref; do
    case "$ref" in *"/$n-"*|*"/issue-$n-"*|*"/$n\"") state=in-progress; reason 'agent branch names issue';; esac
    if [ "$task_key" != - ]; then
      case "$ref" in *"/$task_key-"*|*"/$task_key\"") state=in-progress; reason 'agent branch names task ID';; esac
    fi
  done < "$tmp/branches"
  while IFS="$(printf '\t')" read -r pn head mentions; do
    case ",$mentions," in *",$n,"*) state=in-progress; reason "open PR #$pn names issue";; esac
    if [ "$branch" != - ] && [ "$head" = "\"$branch\"" ]; then state=in-progress; reason "open PR #$pn uses task branch"; fi
  done < "$tmp/claims"
  printf '%s\n' "$state" > "$tmp/state-$n"
  printf '{"number":%s,"state":"%s","lastEditedAt":%s,"title":%s,"body":%s,"reasons":[' "$n" "$state" "$(get "$m" edited)" "$(get "$m" title)" "$(get "$m" body)"
  awk 'NR>1{printf ","}{printf "%s",$0}' "$reasons"
  printf ']}\n'
)
list_issues() { pages Repository repo Issues 'issues(states:OPEN,' 'id number' '[.id,(.number|tostring)]|join("\t")'; }
activity() (
  pages Repository repo PullRequests pullRequests 'id number' '[.id,(.number|tostring)]|join("\t")' > "$tmp/activity-prs"
  # Closed/reopened issues are needed too; list all for a lossless idle-loop read.
  pages Repository repo Issues issues 'id number' '[.id,(.number|tostring)]|join("\t")' > "$tmp/activity-issues"
  : > "$tmp/events"
  for kind in Issue PullRequest; do
    if [ "$kind" = Issue ]; then input="$tmp/activity-issues"; else input="$tmp/activity-prs"; fi
    while IFS="$(printf '\t')" read -r id n; do
      metadata "$n"; m="$tmp/meta-$n"
      timeline "$kind" "$id" > "$tmp/activity-timeline"
      while IFS="$(printf '\t')" read -r event at by label; do
        [ "$by" = "$author" ] || continue
        case "$event" in ClosedEvent|ReopenedEvent) :;; LabeledEvent) [ "$label" = "$approved" ] || continue;; *) continue;; esac
        if awk -v at="$at" -v since="$since" 'BEGIN{exit !(at<since)}'; then continue; fi
        printf '%s\t{"type":"%s","number":%s,"event":"%s","at":"%s","createdAt":"%s","title":%s}\n' "$at" "$kind" "$n" "$event" "$at" "$at" "$(get "$m" title)" >> "$tmp/events"
      done < "$tmp/activity-timeline"
      pages "$kind" "$id" Comments comments "id createdAt updatedAt lastEditedAt body author{$actor}" '[.id,((.author.databaseId // 0)|tostring),.createdAt,.updatedAt,(.body|tojson),(.lastEditedAt // "-")]|join("\t")' > "$tmp/comments-$n"
      while IFS="$(printf '\t')" read -r cid by created updated body last_edit; do
        [ "$by" = "$author" ] || continue
        if awk -v created="$created" -v updated="$updated" -v since="$since" 'BEGIN{exit !(created<since && updated<since)}'; then continue; fi
        edits IssueComment "$cid" > "$tmp/comment-edits"
        if [ "$last_edit" != - ] && [ ! -s "$tmp/comment-edits" ]; then continue; fi
        if awk -F '\t' -v author="$author" '$1=="unknown" || $2!=author || $3!="-"{bad=1} END{exit !bad}' "$tmp/comment-edits"; then continue; fi
        printf '%s\t{"type":"%s","number":%s,"event":"Comment","id":"%s","at":"%s","createdAt":"%s","updatedAt":"%s","body":%s}\n' "$updated" "$kind" "$n" "$cid" "$updated" "$created" "$updated" "$body" >> "$tmp/events"
      done < "$tmp/comments-$n"
    done < "$input"
  done
  LC_ALL=C sort -t "$(printf '\t')" -k1,1 "$tmp/events" | cut -f2-
)
# Buffer every command until all reads succeed: API failure never yields a task.
case "$command" in
  check) assess "$number" > "$tmp/output"; cat "$tmp/output"; [ "$(cat "$tmp/state-$number")" = startable ] || exit 3 ;;
  next)
    # Resolve the plan node rather than relying on any numeric-node convention.
    metadata "$plan"; pages Issue "$(get "$tmp/meta-$plan" id)" SubIssues subIssues number '.number|tostring' > "$tmp/plan"
    : > "$tmp/output"; next=null
    while IFS= read -r n; do
      metadata "$n"; [ "$(get "$tmp/meta-$n" state)" = OPEN ] || continue
      labels "$(get "$tmp/meta-$n" id)" > "$tmp/plan-labels"
      awk -F '\t' '$2=="\"task\""{found=1} END{exit !found}' "$tmp/plan-labels" || continue
      assess "$n" >> "$tmp/output"
      if [ "$next" = null ] && [ "$(cat "$tmp/state-$n")" = startable ]; then next=$n; fi
    done < "$tmp/plan"
    printf '{"next":%s}\n' "$next" >> "$tmp/output"; cat "$tmp/output" ;;
  human)
    list_issues > "$tmp/humans"; : > "$tmp/output"
    while IFS="$(printf '\t')" read -r id n; do
      labels "$id" > "$tmp/human-labels"; awk -F '\t' '$2=="\"human-task\""{found=1} END{exit !found}' "$tmp/human-labels" || continue
      metadata "$n"; m="$tmp/meta-$n"; assignees "$id" > "$tmp/human-assignees"
      state=queued; grep -Fx "$author" "$tmp/human-assignees" >/dev/null && state=assigned
      printf '{"number":%s,"parent":%s,"state":"%s","title":%s,"blockers":%s,"openDependencies":[' "$n" "$(get "$m" parent)" "$state" "$(get "$m" title)" "$(get "$m" blockers)" >> "$tmp/output"
      sep=; for dep in $(get "$m" blocker); do
        if done_issue "$dep"; then :; else code=$?; [ "$code" != 1 ] || fail; printf '%s%s' "$sep" "$dep" >> "$tmp/output"; sep=,; fi
      done
      printf ']}\n' >> "$tmp/output"
    done < "$tmp/humans"
    cat "$tmp/output" ;;
  author-activity) activity > "$tmp/output"; cat "$tmp/output" ;;
esac
