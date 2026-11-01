# Save the sandbox as a template after the Codex install
Where: `agent-session` · Time: about 5 min, plus restarting the coordinator

1. Only after a reviewed install, passing V22/V29 checks, and V28's initial
   subscription-inference/proxy check. Saving and re-creation are the remaining
   V28 persistence probe, so V28 is not yet fully passed. Saving captures
   image filesystem content, not an independently proven copy of every kit-owned
   volume, host credential, or configuration. Keep all work pushed, record the
   coordinator/Codex UUIDs privately, and stop the coordinator cleanly. Then:
   ```sh
   sbx stop januslin
   sbx template save januslin "januslin:codex-$(date +%F)"
   ```
2. Never push the template to a registry.
   It may contain private session/configuration material. The OAuth credential
   remains in the host secret store; a saved image does not replace its binding
   or network policy. V28 must measure actual binary/config/session persistence.
3. Start it again in `agent-session`, then Start steps 4 and 5 in `start-coordinator.md`:
   ```sh
   scripts/sandbox-session.sh start
   ```

## Check
```sh
sbx template ls
```
Expected: `januslin:codex-<today>`.
Reply with the local tag and installed version, not image contents or raw session
logs. A listed template does not complete V28: re-creation is a separate author
step using `recreate-sandbox.md` after all important work is safely retained.
