# Create or re-create the sandbox `agent-vm`
Where: `agent-session` · Time: about 20 min

Re-creating the VM from the base kit drops its in-VM Codex login. Recover it
through the reviewed [codex-login.md](codex-login.md) when the coordinator raises
the author-only recovery task; do not copy authentication files. Template save
and persistence measurements are follow-up #112/#74, not T06's original host-OAuth
gate. Retain all work/session IDs before re-creation. This runbook does not select
or install the superseded OpenAI proxy mixin.

1. Re-creating deletes the VM's clone and its scoped rules: make sure every branch is pushed. Then:
   ```sh
   sbx stop agent-vm; sbx rm agent-vm
   ```
2. Credential binding for the kit. Refuses to overwrite; if it says "exists", add the `anthropic` entry under `bindings:` by hand. If `sbx` later asks to approve more domains for `anthropic`, approve only Claude's hosts.
   ```sh
   f=~/.config/sbx/credentials.yaml; if [ -e "$f" ]; then echo "$f exists: merge by hand"; else mkdir -p ~/.config/sbx && ( umask 077; cat > "$f" <<'YAML'
   bindings:
     anthropic:
       oauth:
         domains: [platform.claude.com, api.anthropic.com]
   YAML
   ); fi
   ```
3. Create it from the kit on an up-to-date `main`. Creation needs the global allowlist in `docs/agents/sandbox.md` (it survives `sbx rm`):
   ```sh
   cd ~/januslin.me && git checkout main && git fetch origin && git merge --ff-only origin/main
   sbx create --clone --name agent-vm ./sandbox/kit ~/januslin.me ~/.local/state/januslin-agent/sandbox-tokens:ro ~/.config/januslin-agent/sandbox-config:ro
   sbx settings set claude.remoteControl true
   ```
4. `sbx run --name agent-vm`, then `/login` with your claude.ai account.
5. Ask the coordinator to run the canary (no key or host file readable outside the read-only mounts).

For the separate template-persistence work (#112/#74), use its reviewed-main
runbook after the coordinator makes that human task actionable. Do not substitute
the old proxy-mixin/template command for the base-kit creation above.

## Check
```sh
sbx ls; sbx secret ls; sbx policy ls agent-vm --wide; sbx settings get ssh.agentForwardingEnabled; sbx settings get claude.remoteControl
```
Expected: `agent-vm` exists; `anthropic` (oauth configured); the allowlist in `docs/agents/sandbox.md`; `false`; `true`.
Codex recovery is a separate author-only step after base-kit recreation;
check it using `codex-login.md`. The OpenAI rules used by in-VM Codex are still
an inventory gap in V19/V22/V28: the coordinator requests the actual policy
listing through a human task before any destination rows are added. Do not
assume that this Check establishes OpenAI rule scope or template persistence.
