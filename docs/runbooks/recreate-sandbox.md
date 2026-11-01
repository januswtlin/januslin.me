# Create or re-create the sandbox `januslin`
Where: `agent-session` · Time: about 20 min

For the T06 candidate, do not use re-creation as an unapproved workaround for a
failed mixin-add. First complete the reviewed `codex-runtime.md` initial
OAuth/inference/sandbox checks and save the template; V28 persistence remains
pending until this re-creation is measured. Retain all work/session IDs.
Saved images do not include the host OAuth store or kit
policy; V28 must measure config/history persistence rather than assume it.

1. Re-creating deletes the VM's clone and its scoped rules: make sure every branch is pushed. Then:
   ```sh
   sbx stop januslin; sbx rm januslin
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
   sbx create --clone --name januslin ./sandbox/kit ~/januslin.me ~/.local/state/januslin-agent/sandbox-tokens:ro ~/.config/januslin-agent/sandbox-config:ro
   sbx settings set claude.remoteControl true
   ```
4. `sbx run --name januslin`, then `/login` with your claude.ai account.
5. Ask the coordinator to run the canary (no key or host file readable outside the read-only mounts).

For T06's persistence probe after the initial checks above, replace only the
`sbx create` command in step 3 with the saved-template command below (do not run
both). Before step 1 deletes the existing VM, select the saved tag from local
`sbx template ls` (never from an issue) and retain it in `codex_template`. This
alternative still runs only reviewed `main` kit code and does not assume V28
has already passed:

```sh
sbx template ls
read -r codex_template
case "$codex_template" in januslin:codex-????-??-??) ;; *) exit 1 ;; esac
sbx create --clone --name januslin -t "$codex_template" ./sandbox/kit ~/januslin.me ~/.local/state/januslin-agent/sandbox-tokens:ro ~/.config/januslin-agent/sandbox-config:ro --kit ./sandbox/codex-proxy
```

The `openai` OAuth binding must still authorize only `auth.openai.com` and
`chatgpt.com`; add it through sbx's reviewed interactive approval, preserving the
existing `anthropic` entry. A missing Python/Codex binary, missing config, changed
permission mode, real token inside the VM, or missing session history is a V28/V29
failure to record, not permission to bypass. Recheck the canary, fake suite, actual
inference, exact-session resume, and commit/push escalation before dispatching.

## Check
```sh
sbx ls; sbx secret ls; sbx policy ls januslin --wide; sbx settings get ssh.agentForwardingEnabled; sbx settings get claude.remoteControl
```
Expected: `januslin` exists; `anthropic` (oauth configured); the allowlist in `docs/agents/sandbox.md`; `false`; `true`.
After accepted T06 setup also expect `openai` OAuth, the two explicitly approved
OpenAI hosts, and the recorded Codex version. Do not claim those additions before
the corresponding live checks and ledger evidence exist.
