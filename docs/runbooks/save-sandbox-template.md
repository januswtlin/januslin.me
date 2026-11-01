# Save the sandbox as a template after the Codex install
Where: `agent-session` · Time: about 5 min, plus restarting the coordinator

1. Only right after a reviewed install (the template captures the whole VM). This stops the coordinator:
   ```sh
   sbx stop januslin
   sbx template save januslin "januslin:codex-$(date +%F)"
   ```
2. Never push the template to a registry.
3. Start it again in `agent-session`, then Start steps 4 and 5 in `start-coordinator.md`:
   ```sh
   scripts/sandbox-session.sh start
   ```

## Check
```sh
sbx template ls
```
Expected: `januslin:codex-<today>`.
