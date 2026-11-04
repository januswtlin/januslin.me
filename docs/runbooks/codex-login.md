# Recover the Codex login inside the existing VM
Where: your own Terminal, then `agent-session`, then the existing `agent-vm` shell · Time: about 10 min

Run only the reviewed `main` version, after the coordinator raises an actionable
login-recovery human task. Keep the existing UUID/claim/branch/PR; do not repeat a
working login. #73's host-OAuth procedure is retired. Connection work (#112/#72)
is separate from local recovery. The coordinator stops Codex routing first.

1. In your own Terminal, open the host `agent` shell:
   ```sh
   agent-session
   ```
2. From that host shell, enter the existing VM (the `sbx exec` route used by
   `start-coordinator.md`; this opens a shell, not another agent session):
   ```sh
   sbx exec -it agent-vm bash -l
   ```
   Stop if the existing VM cannot be reached; do not recreate it for login.
3. Only inside that VM shell, use the headless login mode:
   ```sh
   codex login --device-auth
   ```
   [OpenAI authentication guidance](https://learn.chatgpt.com/docs/auth#login-on-headless-devices)
   recommends device-code login for headless environments. The installed 0.166.0
   help lists this flag; completing this flow in this VM remains untested.
   Device-code login must be available in your ChatGPT account's security settings;
   if unavailable or refused, stop and report that category to the coordinator.
   Open the displayed link in your own browser and enter its one-time code
   privately. Never post the link, code, token, or authentication file. Do not
   copy a host auth cache, use an API key, enable SSH/Remote Login, or change the
   account to work around a failure.
4. Run the Check below in the VM, then leave the VM shell with `exit`. Tell the
   coordinator only `logged in` or `not logged in`. It checks continuing task
   authorization and resumes the existing UUID. GitHub remains on mounted role
   tokens through `agent-gh`/the credential helper; no global git identity change.

## Check

Inside the VM:
```sh
codex login status
```
Expected: `Logged in using ChatGPT`. This exact read-only output was checked on
0.166.0 in this VM and contained no account email or token. Reply only `logged in`
or `not logged in`; do not paste output if another version includes account data.
The login may be readable inside the VM (the recorded author-approved risk);
status does not prove host sentinel isolation or GitHub/cloud identity.
