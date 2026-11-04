# Check the Codex runtime in the existing VM
Where: existing `agent-vm` shell · Time: about 10 min

The author's verified 2026-11-04 amendment on #56 selects in-VM subscription login
(ADR-0018) and mounted GitHub role tokens. #72 no longer gates local dispatch;
#73 is retired. Do not install the old OpenAI proxy mixin, repeat working login,
change host policy, or recreate a sandbox as part of this check. Preserve the
existing binary, model, UUID, branch, and PR. New author commands wait for reviewed
`main`; agents only inventory completed setup and run the authorized task.

1. Check the existing runtime without starting a model session:
   ```sh
   python3 --version
   codex --version
   codex exec --help
   codex exec resume --help
   codex features list
   codex mcp list
   ```
   Expected measured baseline: Python 3.11+, Codex 0.166.0, apps/plugins false,
   gateway disabled. Preserve any different version and report it; do not silently
   install or downgrade. Never read `auth.json` or dump user/session files.
2. Read only non-secret config settings and requirements paths, recording sandbox,
   approval policy/reviewer and tool flags in the acceptance ledger. Project
   `.codex/config.toml` should load after #113. The project's defaults are not an
   admin-enforced personal-account policy; a non-model CLI override can establish
   that limit without invoking any connector or plugin.
3. Use the coordinator's already-authorized dispatch/resume to measure V29. Record
   the effective policy on both turns, a refused `.git` metadata write, and the
   automatically reviewed commit/push outcome. No bypass or full-access fallback.
   Compare API push/PR actor numeric IDs with mounted `identity.json`; commit
   author can differ and must be recorded separately. Never edit global git
   identity or read token files for this check.
4. If login expires, stop routing and ask the coordinator for an author-only
   recovery human task using `codex-login.md`. Do not invoke login as an agent.
5. The coordinator supplies independent review, exact-session findings resume,
   final report, and reverse-review evidence. The author verifies V8, V22/V28,
   V29, V30, and reverse review before closing T06. Fake tests alone do not
   establish live acceptance.

Connection/connector review (#72), cloud/V10 (#75), phone steering, and template
save/re-creation (#74) are follow-up #112. They no longer gate local task work.
Only the author starts cloud tasks or changes host configuration. In-VM login
may expose the subscription credential to VM processes; do not claim sentinel
isolation. V22/V28 are resolved by recording that decision and risk, subject to
the author's verification of the PR evidence.

## Check

```sh
sh tests/scripts/codex-dispatch/test.sh
```

Expected: fake tests pass; actual effective policy and API actors are separately
recorded in `docs/reports/T06-sandbox-acceptance.md` and the PR handoff. No raw
authentication/session/result files, login codes, or prompts are published.
