# Prepare the candidate Codex runtime in the existing VM
Where: first `agent-session` for sbx, then the existing sandbox shell for installation · Time: about 20 min plus probes

Candidate only. Run only after this runbook is reviewed on `main`, #55 is completed,
the author approves #56, and the coordinator has verified the human connection
task. No AI installation or execution takes place in the host `agent` shell.
The live acceptance ledger is `docs/agents/codex.md`.

There is a bootstrap dependency to resolve: if Claude cannot finish #54/#55 and
Codex is needed to do that work, the normal prerequisites above cannot enable the
first Codex session. The author must first review the exact candidate code and
runbook on the pushed bootstrap branch, then explicitly authorize the particular
host OAuth-binding/mixin/restart steps and VM install/probes before #55. That
would be a separate, bounded bootstrap exception, recorded by the coordinator;
the existing exception covers preparation and new-branch SSH pushes only.
This document does not grant that authorization. Alternatively, finish/merge
#54/#55 with an already available VM tool, merge the runbook, then follow the
normal path. Neither path weakens T08 or marks #56 complete. The author decides
which path once the concrete candidate has passed independent review.

1. In `agent-session`, confirm sbx version/help before changing anything:
   ```sh
   sbx version
   sbx kit add --help
   sbx secret set --help
   ```
   If kit-add is unavailable or the sandbox lacks its required recreate-aware
   label, stop and report that exact blocker. Preserve the existing VM and session;
   do not delete it or start a bypass-mode Codex sandbox.
2. Complete `codex-login.md`. Approve only the OAuth binding domains
   `auth.openai.com` and `chatgpt.com` for `openai` when sbx asks. No API key, no
   passthrough, no `github` proxy secret (it would overwrite the reviewer identity).
3. Ensure the host clone is reviewed, current `main`, then add the mixin. This
   restarts the sandbox; stop the coordinator cleanly and retain its session ID.
   ```sh
   cd ~/januslin.me
   git checkout main
   git fetch origin main
   git merge --ff-only origin/main
   sbx kit add januslin ./sandbox/codex-proxy
   ```
   Through `allow-sandbox-host.md`, approve `auth.openai.com:443` for OAuth refresh
   and `chatgpt.com:443` for subscription inference. Record them as applied only
   after inspecting the actual policy. Do not add wildcard domains. Report other
   blocked destinations individually with a reason before author approval.
4. In the existing VM shell, verify prerequisites and the stable release before
   installing. A changed latest stable version needs a reviewed pin update first.
   ```sh
   test -d /run/sandbox/source
   python3 -c 'import sys; assert sys.version_info >= (3, 11); print(sys.version.split()[0])'
   node --version
   npm view @openai/codex version
   npm install --global @openai/codex@0.166.0
   codex --version
   codex exec --help
   codex exec resume --help
   ```
   If Python is absent, stop: the kit check must be fixed through a reviewed
   change, not an ad hoc host install. These commands have not been run here.
5. Still inside the VM, create the candidate user transport config without
   overwriting an existing one. Inspect existing config locally and merge by hand
   if the check refuses. Preserve the user's model; do not copy any host auth cache.
   ```sh
   (set -euC
     umask 077
     mkdir -p "$HOME/.codex"
     test ! -e "$HOME/.codex/config.toml"
     test ! -L "$HOME/.codex/config.toml"
     cat sandbox/codex-proxy/config.toml > "$HOME/.codex/config.toml"
   )
   ```
6. Ask the coordinator in the VM to perform V8, V22, V28's initial proxy/inference
   checks, and V29 with the ledger. V28's save/re-create portion is still pending.
   Check sentinels by equality in code and report booleans only, never contents.
   Do not infer protection from the existence of config files. In particular test
   approval review with the custom proxy provider and the actual selected model.
   A login check alone does not establish subscription inference or safe approvals.
7. Only after those initial checks pass, save the template using `save-sandbox-template.md`
   and measure re-creation persistence with `recreate-sandbox.md`. Then authorize
   V30's small real task through the normal T08 gate and cross-tool workflow only
   when that persistence evidence completes V28 and the repeated V29 checks pass.

## Check

In the VM:
```sh
python3 --version
codex --version
sh tests/scripts/codex-dispatch/test.sh
```
In `agent-session`:
```sh
sbx secret ls
sbx policy ls januslin --wide
sbx policy approval ls
```
Expected: Python 3.11+, Codex 0.166.0, fake tests pass; `openai` OAuth configured;
only approved hosts; completed ledger entries with real evidence. These outputs
alone do not complete V8/V22/V28/V29 or #56. Never paste a secret or raw session log.
