# Start, stop, or restart the coordinator
Where: your own Terminal, then `agent-session` · Time: about 5 min

## Start
1. In your own Terminal:
   ```sh
   agent-session
   ```
2. Only after a restart of the Mac (cancel any "Keychain Not Found" dialog; never "Reset To Defaults"):
   ```sh
   security unlock-keychain ~/Library/Keychains/sbx.keychain-db
   ```
3. Update the host clone and start the token broker:
   ```sh
   cd ~/januslin.me && git checkout main && git fetch origin && git merge --ff-only origin/main
   scripts/token-broker.sh start && scripts/token-broker.sh status
   ```
4. In a second Terminal, in your own account, keep the Mac awake (Ctrl-C when you stop):
   ```sh
   caffeinate -ims
   ```
5. Back in `agent-session`. The status line must say `auto mode on`:
   ```sh
   sbx run --name januslin
   ```
6. Paste the coordinator prompt from `docs/agents/workflow.md` ("Coordinator loop") verbatim.
7. For the phone: type `/remote-control` and open the link.

## Stop
1. Tell it to stop, then type `/exit`.
2. In `agent-session`:
   ```sh
   sbx stop januslin && scripts/token-broker.sh stop
   exit
   ```
3. In your own Terminal: `agent-end`, and Ctrl-C the `caffeinate`.

## Restart (new prompt on `main`)
Stop steps 1 only (`/exit`), then Start steps 3, 5, 6, 7.

## Check
```sh
scripts/token-broker.sh status; sbx ls
```
Expected: both Apps about an hour ahead; `januslin` running.
