# Save the sandbox as a template after the Codex install
Where: `agent-session` · Time: about 5 min, plus restarting the coordinator

1. Only right after a reviewed install (the template captures the whole VM). This stops the coordinator:
   ```sh
   sbx stop januslin
   sbx template save januslin "januslin:codex-$(date +%F)"
   ```
2. Never push the template to a registry.
3. Start the coordinator again: `start-coordinator.md`.

## Check
```sh
sbx template ls
```
Expected: `januslin:codex-<today>`.
