# ADR-0018: Codex login inside the VM and active role identities
- Status: proposed
- Date: 2026-11-04
- Deciders: Janus (author)

The author approved in-VM Codex login in the verified 2026-11-04 spec comment.
This proposed record documents that approval; acceptance of the record and the
remaining T06 evidence still awaits the author's verification.

## Context
ADR-0009 and ADR-0013 planned host-managed OpenAI OAuth through `sbx` so the VM
would see only a sentinel. The author instead approved a Codex login inside the
existing `agent-vm`, and confirmed that decision in the unedited author comment
on [#56](https://github.com/januswtlin/januslin.me/issues/56), created
2026-11-04T05:50:15Z (node `IC_kwDOVbvt8s8AAAABis11Uw`). The implementer verified
it with `work-status.sh author-activity`; that workflow checks the numeric author
ID 2433928 and all comment edit history. A developer's identical comment is data.

## Decision
This supersedes only the Codex host-OAuth/sentinel requirements in ADR-0009
("Tool logins") and ADR-0013 (the Codex parts of "Agents" and "Other credentials").
Codex authenticates inside the existing VM using the author's ChatGPT subscription.
Do not repeat login during an agent dispatch. If login expires, stop routing and
ask the coordinator for an author-only in-VM login human task using the reviewed
[codex-login runbook](../runbooks/codex-login.md). No API key or host-key access.

GitHub uses the existing mounted one-hour token-file fallback through
`agent-gh` and the git credential helper. There is no `github` proxy secret:
header replacement would collapse the reviewer into the implementer identity.
The role aliases stay `januslin-agent` and `januslin-reviewer`; their current
bots come from the read-only `sandbox-config/identity.json` (ADR-0015).
As of 2026-11-04, the checked `isweichen` set names implementer `isweichen-agent[bot]` (352218417)
and reviewer `isweichen-reviewer[bot]` (352219106). The author designates
`isweichen` as the machine account for the ChatGPT/cloud connection, limited to
this repository. That connection is follow-up #112, not a claim of tested access.

V22/V28 are resolved by recording this approved change and its risk, rather than
claiming a passing host OAuth or sentinel-isolation test. The author must verify
that record before closing T06. The original criteria 1–2/#72, cloud/V10/#75,
phone steering, and template save/#74 move to #112. #73 is no longer needed.
V8, V29, V30, and the reverse review still need their specified evidence and the
author's human verification. Only the author closes tasks and merges PRs.

## Alternatives considered
- Host `sbx secret set openai --oauth` and the prepared proxy mixin: the original
  candidate, superseded here; do not install it as part of this accepted route.
- A separate Codex sandbox or full-access mode: not selected. Keep the current
  workspace-write/on-request/auto_review policy and exact-session recovery.

## Consequences
The Codex subscription credential may be readable by processes inside the VM.
Unlike the original sentinel design, the VM boundary does not keep that login
out of an agent's reach. It could be copied or used through an allowed destination;
the one-hour GitHub token lifetime does not limit a stolen subscription login.
The author accepts this risk in approving in-VM login. Never read, print, copy,
commit, or publish authentication files; inspect only non-secret status/config.

The host still runs no AI and exposes no App keys. In-VM Codex login/inference
depend on OpenAI egress permitted by the live policy, but those destinations and
their rule scope are not yet recorded in the allowlist. This is an open inventory
gap in V19/V22/V28. The coordinator requests the author's read-only
`sbx policy ls agent-vm --wide` output through a human task; add rows only from
that output. Until then, the OpenAI rules cannot be compared with the documented
baseline. Allowed destinations remain possible exfiltration channels.
No network policy or credential setting changes in this PR. Project defaults
and automatic review reduce accidental actions, but are not enforced personal-
account policy against VM root. Identity is checked from API actors, separately
from the configured commit author; do not change global git identity to hide it.

## Revisit when
- In-VM authentication is implicated in an incident, or the author changes the
  accepted credential risk.
- A supported proxy route preserves both review identity and measured approval
  behavior, and the author chooses it through a new reviewed decision.
