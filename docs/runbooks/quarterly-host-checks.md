# Quarterly security checks only the author can run
Where: your own Terminal (your own `gh`), the browser as `januswtlin` and as the machine account, `agent-session` · Time: about 20 min

1. Your own Terminal:
   ```sh
   gh api repos/januswtlin/januslin.me/interaction-limits --jq '.limit, .expires_at'
   gh api repos/januswtlin/januslin.me/rulesets --jq '.[] | [.id, .name, .enforcement] | @tsv'
   gh api 'repos/januswtlin/januslin.me/collaborators?affiliation=direct' --jq '.[] | [.login, .role_name] | @tsv'
   gh api repos/januswtlin/januslin.me/keys --jq '.[] | [.title, .last_used] | @tsv'
   gh secret list --repo januswtlin/januslin.me; gh variable list --repo januswtlin/januslin.me
   for e in $(gh api repos/januswtlin/januslin.me/environments --jq '.environments[].name'); do echo "== $e"; gh secret list --env "$e" --repo januswtlin/januslin.me; done
   ls -ld ~
   dscl . -read /Groups/admin GroupMembership
   sudo systemsetup -getremotelogin
   cat "/Library/Application Support/ClaudeCode/managed-settings.json"
   ```
   Compare the managed settings printed last with the block in `install-managed-settings.md`.
2. Browser as `januswtlin`: this repository → Settings → General: issue creation limited to collaborators. System Settings → General → Sharing: File Sharing and Remote Login off.
3. Machine account's profile: Settings → Password and authentication (passkey or 2FA on), SSH and GPG keys (none), Developer settings → Personal access tokens (none), Applications → Authorized OAuth Apps (none beyond Claude), Sessions (only this browser).
4. `agent-session`:
   ```sh
   command -v claude codex; echo "ai exit=$?"
   crontab -l 2>&1 | head -3; ls ~/Library/LaunchAgents 2>/dev/null; echo "launchagents exit=$?"
   ls ~/.local/state/januslin-agent/ ~/.config/januslin-agent/ ~/.config/januslin-agent/active/
   sbx version; sbx settings get ssh.agentForwardingEnabled; sbx secret ls; sbx policy ls agent-vm --wide
   ```
5. Run the Check in `app-key-sets.md` and compare with each App's page (exactly one key each); the `agent` account holds only the active set.

## Check
Reply with the output of steps 1 and 4, and one line each for steps 2, 3, 5.
Expected:
- Step 1: `collaborators_only` with an expiry more than a month away; `main-protect` and `main-restrict-updates` active; `januswtlin admin` and `januslin-agent write` only; one deploy key per device in use; no repository secrets or variables; environment secrets as in `docs/deployment.md`; your home `drwx------`; `Agent` not in the admin group; Remote Login Off; managed settings identical to `install-managed-settings.md`.
- Step 4: `ai exit=1`; no crontab, `launchagents exit=1`; no `cloudflare-ops.token`; `false`; secrets and rules as in `docs/agents/sandbox.md`.
