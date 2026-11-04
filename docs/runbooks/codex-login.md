# Recover the Codex login inside the existing VM
Where: the author's terminal in the existing `agent-vm` · Time: about 10 min

This is the author-only recovery route approved in the verified 2026-11-04
comment on #56 and recorded in ADR-0018. Use this runbook only after it is reviewed
on `main` and the coordinator raises an actionable login-recovery human task.
#73's old host-OAuth procedure is no longer needed. Do not repeat a working login.
The ChatGPT/GitHub connection is follow-up #112/#72, not a local dispatch gate.

1. The coordinator stops Codex routing, retains the UUID/claim/branch/PR, and tells
   you that login has expired. Do not copy or inspect authentication files.
2. In the existing VM terminal (never the host `agent` shell), run:
   ```sh
   codex login
   ```
   Follow the displayed sign-in instructions privately. Never paste a login URL,
   code, token, or authentication file into a public issue. If login fails, stop
   and report only the sanitized error category; do not use an API key, another
   account, or a host-credential workaround.
3. Tell the coordinator whether login completed. It checks continuing task
   authorization and resumes the existing UUID; it does not create another task
   or session. GitHub remains on `agent-gh`/the credential helper and mounted
   role tokens. No `github` proxy secret or global git identity change.

## Check

Confirm the CLI reports a completed sign-in, without printing credential files.
Reply with success/failure and the CLI version only. The login may be readable
inside the VM (the author-approved risk); success is not a host sentinel-isolation
result or proof of GitHub/cloud identity.
