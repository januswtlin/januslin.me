# Configure Codex cloud and run the phone probe
Where: your ChatGPT browser, machine-account GitHub profile, then your phone · Time: about 30 min

Run only from reviewed `main`, after the connection review and local runtime
acceptance. Only you create the environment and start these cloud tasks. No local
agent starts a cloud task, automatic review, or scheduled task.

1. Confirm `connect-chatgpt-github.md` first. The only connected repository is
   `januswtlin/januslin.me`, through the machine account (id 349746030). Record the
   actual connector permission list, explicitly Workflows, Secrets, and Variables;
   do not assume the Claude App's list applies. Record connector names and each
   keep/remove decision; no personal-data connector is allowed implicitly.
2. Open ChatGPT settings → Codex Cloud → Environments → Create environment. Select
   only this repository, name it `januslin.me`, keep it private, and add no direct
   variables, HTTP secrets, personal-vault requests, VPN, or cloud identities.
   [Current OpenAI docs](https://learn.chatgpt.com/docs/environments/cloud-environments)
   describe publishing an environment; the
   [legacy environment](https://learn.chatgpt.com/docs/environments/cloud-environment)
   remains used by GitHub integrations. Record which UI you actually see. If it
   differs, stop and report the visible controls; do not silently substitute a
   workflow or enable unrelated capabilities.
3. Keep agent internet access off where the legacy UI offers it. In the current
   UI, disable full public access and the broad Package managers preset; start
   with no extra domains. If the probe needs GitHub command access, add only
   `github.com` and `api.github.com`; if installation needs it, `registry.npmjs.org`.
   Name each added host and reason in the reply. Any other host needs a separate
   decision. Do not enable unrestricted access to make a failing probe pass.
4. Choose Node 24 when the UI permits a version pin. Ask the environment setup to
   use this conditional install script; no dependency installation is needed
   until the Node project/lockfile exists:
   ```sh
   set -eu
   if [ -f pnpm-lock.yaml ]; then
     corepack enable
     pnpm install --frozen-lockfile
   fi
   ```
   Review the setup report/configuration/files, save, and publish only the intended
   repository setup. Record the selected runtime and whether the script actually
   ran. A saved draft is not a published environment.
5. On the phone, open Codex, select that published environment, and start the
   following probe yourself. If only a different legacy task UI is available,
   record that route and its limitations before proceeding.

   ```text
   You are the Platform Engineer for the januslin.me T06 cloud identity probe.
   Read AGENTS.md and docs/agents/workflow.md. This author-started probe authorizes
   only a throwaway docs/reports/T06-cloud-probe.md, its test branch/PR, and the
   checks below. Never merge, enable auto-merge, create schedules, read drafts or
   content, change settings, or use another repository's contents.

   Record the current commit SHA and visible GitHub identity, names/IDs only.
   Create a unique agent/platform/T06-cloud-probe-<UTC timestamp> branch. Commit
   the harmless report with Task: #56 and Agent: codex. Try a normal branch push
   and record whether it works directly or only my Create PR action publishes it.
   Try git push origin HEAD:main once; expected refused. If it succeeds, STOP and
   report an incident without further mutations. Query only repository metadata
   for januswtlin/januslin (the private old site); expected inaccessible. Do not
   fetch content even if unexpectedly accessible; stop and report the scope issue.

   On the throwaway branch only, test a workflow-file push with a harmless
   workflow_dispatch-only workflow, permissions: {}, no secrets, no network,
   one step `run: true`, and do not run it. Record accepted/refused. Open one
   draft probe PR if available, or wait for my Create PR action. Do not close
   #56. Return branch/PR/commit URLs and sanitized refusals; never credentials.
   ```
6. Continue that same cloud task once from the phone. Record whether it receives
   your follow-up and whether it can continue without the Mac. For local work,
   steer the existing Claude coordinator via its already tested Remote Control;
   it can send findings to the recorded Codex UUID. Direct phone attachment to
   local Codex is PENDING until explicitly tested. Remote Login stays off; do not
   add an SSH server, tunnel, host AI process, or another app as a silent substitute.
7. Ask the VM coordinator to read the probe branch activity/commit/PR APIs through
   its role App. It verifies push actor, commit author, and PR author independently
   (expect machine account for push/PR, record actual commit author), plus main
   refusal and workflow-file result. Keep screenshots private, with names/scopes
   only. The author decides cleanup of the probe branch/PR; do not merge it.

## Check

Reply with the environment's name, actual current/legacy UI, runtime, exact network
hosts, confirmation of no variables/secrets/VPN, connector names/decisions, and the
phone task/branch/PR/commit URLs. Include the coordinator's independently fetched
numeric identities and refusal evidence for V10. No raw auth/session logs,
credentials, email address, or private-repository content. Missing evidence stays
PENDING in `docs/agents/codex.md`; the cloud environment alone does not complete #56.
