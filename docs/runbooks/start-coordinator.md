# Start, stop, or restart the coordinator
Where: your own Terminal, then `agent-session` · Time: about 5 min

`scripts/sandbox-session.sh` does the host part in one command: it fast-forwards the host clone to `main` and re-runs itself from there, restarts the token broker, mints both App tokens (and stops if that fails), then opens `sbx run --name januslin` (if that fails, it stops the broker again). Leaving the session with `/exit` leaves the VM and the broker running; `stop` ends both. Keep the `agent-session` window open while the coordinator runs: the broker belongs to it, and closing the window stops token refresh within the hour.

## Start
1. In your own Terminal:
   ```sh
   agent-session
   ```
2. In `agent-session`. After a restart of the Mac add `--unlock-keychain`, which asks for the `sbx` keychain password (cancel any "Keychain Not Found" dialog; never "Reset To Defaults"):
   ```sh
   scripts/sandbox-session.sh start
   ```
   It prints both tokens' expiry, about an hour ahead, then the session opens. The status line must say `auto mode on`.
3. In a second Terminal, in your own account, keep the Mac awake (Ctrl-C when you stop):
   ```sh
   caffeinate -ims
   ```
4. Paste the coordinator prompt from `docs/agents/workflow.md` ("Coordinator loop") verbatim.
5. For the phone: type `/remote-control` and open the link.

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
3. Start steps 4 and 5.

## Check
In `agent-session`:
```sh
scripts/token-broker.sh status; sbx ls
```
Expected: both Apps about an hour ahead; `januslin` running.
