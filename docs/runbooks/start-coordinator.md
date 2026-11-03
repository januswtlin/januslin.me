# Start, stop, or restart the coordinator
Where: your own Terminal, then `agent-session` · Time: about 5 min

`scripts/sandbox-session.sh` does the host part in one command: it fast-forwards the host clone to `main` and re-runs itself from there, restarts the token broker, mints both App tokens (and stops if that fails), then opens Claude Code by default with `sbx run --name agent-vm` (if the agent launch fails, it stops the broker again). Leaving the session with `/exit` leaves the VM and the broker running; `stop` ends both. Keep the `agent-session` window open while the coordinator runs: the broker belongs to it, and closing the window stops token refresh within the hour.

## Start
1. In your own Terminal:
   ```sh
   agent-session
   ```
2. In `agent-session`. After a restart of the Mac add `--unlock-keychain`, which asks for the `sbx` keychain password (cancel any "Keychain Not Found" dialog; never "Reset To Defaults"):
   ```sh
   scripts/sandbox-session.sh start
   ```
   To use Codex instead, pass `--agent codex`:
   ```sh
   scripts/sandbox-session.sh start --agent codex
   ```
   `--agent claude` explicitly selects the default. Both `start` and `restart` accept `--agent` together with `--unlock-keychain`, in either order. A missing value or any value other than `claude` or `codex` prints a warning and exits with status 2 before updating the host clone, stopping the VM, unlocking the keychain, or starting the broker.

   Codex must already be installed and authenticated in `agent-vm` (T06). The script uses `sbx exec -it agent-vm` to launch it in the same VM with `--sandbox workspace-write --approve-for-me`; it sets `AGENT_TOOL=codex` for the launched process after loading the VM's shell environment. The current kit can reset that variable in child Bash shells, so Codex commits must explicitly include the required `Agent: codex` trailer. A stopped VM is started by `sbx exec`; a missing VM or Codex installation fails and stops the broker. This does not install tools or change credentials or network policy. See [Docker's exec reference](https://docs.docker.com/reference/cli/sbx/exec/).

   It prints both tokens' expiry, about an hour ahead, then the session opens. For Claude, the status line must say `auto mode on`; for Codex, confirm workspace-write and automatic review.
3. In a second Terminal, in your own account, keep the Mac awake (Ctrl-C when you stop):
   ```sh
   caffeinate -ims
   ```
4. Paste the coordinator prompt from [`docs/agents/coordinator.md`](../agents/coordinator.md) verbatim.
5. For the phone with Claude: type `/remote-control` and open the link.

## Stop
1. Tell it to stop, then type `/exit`.
2. In `agent-session`:
   ```sh
   scripts/sandbox-session.sh stop
   exit
   ```
3. In your own Terminal: `agent-end`, and Ctrl-C the `caffeinate`.

## Restart
After a merge that changes the prompt or a host script, or after an `sbx` upgrade. Starts in the coordinator session; `caffeinate` keeps running.
1. Type `/exit` in the coordinator.
2. In `agent-session` (stops the VM and the broker, so both start from `main`):
   ```sh
   scripts/sandbox-session.sh restart
   ```
   To restart into Codex, use `scripts/sandbox-session.sh restart --agent codex`. Agent selection is per invocation; omitting it selects Claude again.
3. Start steps 4 and 5 (step 5 is Claude only).

## Initialize a missing main watcher state
Only when the coordinator reports missing state, including after VM re-creation. In the sandbox session, tell the coordinator: "I authorize main-watch init at the repository root, then a complete check of main." The coordinator runs the reviewed `scripts/main-watch.sh init` and `check`; it must report a verified history before dispatch resumes. Never authorize an alternate baseline or reset the state to suppress a suspicious report. An unexpected SHA needs separate explicit author review and acceptance.

Two historical commits currently lack accessible PR metadata: `dbb73f6e3daec0a64156c527f12356ab70436dbe` and `8f47de99b693fa27dfa5b61568486037315a6b95`. The author originally authorized those exceptions for T04's private live test, later withdrew that statement because the PRs could not be verified, then checked the PRs through the machine account and confirmed they were author-merged. The author reports account-dependent visibility after GitHub spam-blocked the machine account; this explanation was not independently verified. [The infrastructure evidence](../infra-current-state.md#main-watcher-acceptance-evidence-t04-2026-11-02) preserves that chronology and the original API failure. The latest merger clarification did not issue a new acceptance or initialization instruction. The default coordinator state has not been initialized. A newly authorized root initialization checks the complete history and may report them again. Keep those reports pending until the author explicitly authorizes their acceptance in that state; then the coordinator accepts only the named pending SHAs and checks the complete remaining history. Never copy the test state into the default path, hardcode exceptions, replay acceptance automatically from this historical note, or skip the initial root check. Any additional suspicious SHA needs its own author instruction.

## T04 phone notification check
After T04 merges and #71 becomes actionable:
1. Restart as above and connect Remote Control. In the sandbox session use `/permissions` to add a temporary **Ask** rule scoped to `Bash(printf T04-permission-check)` in local settings. This changes only the harmless check command; keep auto mode and all managed restrictions enabled. [Claude Code permissions](https://code.claude.com/docs/en/permissions) describes the Ask rule and `/permissions` editor.
2. Tell the coordinator "run the T04 notification check", lock the phone, and step away. The coordinator assigns a throwaway issue, records UTC time, then attempts exactly this harmless command through its Bash tool:
   ```sh
   printf T04-permission-check
   ```
3. Note whether GitHub assignment and the permission prompt each reach the locked phone, and their delay. Answer the prompt through Remote Control. If the command does not prompt, report that result; do not weaken managed restrictions to force it.
4. Remove only the temporary Ask rule with `/permissions`; confirm auto mode remains enabled. Close the throwaway issue and reply to #71 with the two observed results (yes/no and delay). The coordinator records V27/V33 through a follow-up docs PR; a missing notification is an observed failure with a proposed follow-up, not a passing result.

## Check
In `agent-session`:
```sh
scripts/token-broker.sh status; sbx ls
```
Expected: both Apps about an hour ahead; `agent-vm` running.

For watcher initialization, the coordinator reports `check` exit 0 and the verified baseline; for #71, reply with assignment and permission-prompt arrival/delay, including any failure to produce a prompt. Never paste the private state file or credentials.
