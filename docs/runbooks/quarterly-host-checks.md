# Quarterly security checks only the author can run
Where: GitHub as `januswtlin` (browser and your own `gh`), the machine account's browser profile, `agent-session` · Time: about 20 min

1. Your own Terminal:
   ```sh
   gh api repos/januswtlin/januslin.me/interaction-limits --jq '.limit, .expires_at'
   gh api repos/januswtlin/januslin.me/rulesets --jq '.[] | [.id, .name, .enforcement] | @tsv'
   gh api 'repos/januswtlin/januslin.me/collaborators?affiliation=direct' --jq '.[] | [.login, .role_name] | @tsv'
   gh api repos/januswtlin/januslin.me/keys --jq '.[] | [.title, .last_used] | @tsv'
   gh secret list --repo januswtlin/januslin.me; gh variable list --repo januswtlin/januslin.me
   for e in production preview smoke; do echo "== $e"; gh secret list --env "$e" --repo januswtlin/januslin.me; done
   ```
2. Browser, this repository → Settings → General: issue creation limited to collaborators (the API cannot read it).
3. Machine account profile: GitHub → Settings → SSH keys, Developer settings (tokens, OAuth apps), Sessions: nothing unexpected.
4. `agent-session`:
   ```sh
   command -v claude codex; echo "ai exit=$?"
   crontab -l 2>&1 | head -3; ls ~/Library/LaunchAgents 2>/dev/null
   ls ~/.local/state/januslin-agent/
   sbx version; sbx settings get ssh.agentForwardingEnabled; sbx secret ls; sbx policy ls januslin --wide
   ```
5. Run the Check in `rotate-app-keys.md` and compare with each App's page.

## Check
Reply with the output of steps 1 and 4, and one line each for steps 2, 3, 5.
