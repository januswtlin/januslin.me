# Upgrade `sbx`
Where: your own Terminal, then `agent-session` · Time: about 10 min

1. In your own Terminal:
   ```sh
   brew upgrade docker/tap/sbx
   ```
2. In `agent-session`, restart the sandbox: `start-coordinator.md` ("Restart").
3. Ask the coordinator to re-run the sandbox checks the release notes touch (canary, allowlist, login).

## Check
```sh
sbx version; sbx diagnose | head -20
```
Expected: the new version; reply with it so `docs/infra-current-state.md` is updated.
