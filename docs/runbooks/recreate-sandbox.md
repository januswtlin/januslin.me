# Create or re-create the sandbox `januslin`
Where: `agent-session` · Time: about 20 min

1. Re-creating deletes the VM's clone and its scoped rules: make sure every branch is pushed. Then:
   ```sh
   sbx rm januslin
   ```
2. Credential binding for the kit (refuses to overwrite; if it says "exists", add the `anthropic` entry under `bindings:` by hand):
   ```sh
   f=~/.config/sbx/credentials.yaml; if [ -e "$f" ]; then echo "$f exists: merge by hand"; else mkdir -p ~/.config/sbx && ( umask 077; cat > "$f" <<'YAML'
   bindings:
     anthropic:
       oauth:
         domains: [platform.claude.com, api.anthropic.com]
   YAML
   ); fi
   ```
3. Create it from the kit on `main`:
   ```sh
   cd ~/januslin.me && git checkout main && git merge --ff-only origin/main
   sbx create --clone --name januslin ./sandbox/kit ~/januslin.me ~/.local/state/januslin-agent/sandbox-tokens:ro ~/.config/januslin-agent/sandbox-config:ro
   ```
4. `sbx run --name januslin`, then `/login` with your claude.ai account.
5. Ask the coordinator to run the canary (no key or host file readable outside the read-only mounts).

## Check
```sh
sbx ls; sbx secret ls; sbx policy ls januslin --wide; sbx settings get ssh.agentForwardingEnabled; sbx settings get claude.remoteControl
```
Expected: `januslin` exists; `anthropic` (oauth configured); the allowlist in `docs/agents/sandbox.md`; `false`; `true`.
