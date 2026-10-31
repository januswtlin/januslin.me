# Take back a lent Cloudflare token
Where: Cloudflare dashboard, your own Terminal, `agent-session` · Time: about 5 min

1. Cloudflare → My Profile → API Tokens → delete the one-day token.
2. In your own Terminal:
   ```sh
   sudo -u Agent rm -f /Users/Agent/.local/state/januslin-agent/cloudflare-ops.token
   ```
3. In `agent-session`, remove the rule and the custom secret. The secret's removal syntax is confirmed from the `sbx secret rm --help` output you sent with the lend runbook's Check; until an agent has written it here, stop after the rule and reply with the Check.
   ```sh
   sbx policy rm network --sandbox januslin --resource api.cloudflare.com
   ```

## Check
```sh
ls /Users/Agent/.local/state/januslin-agent/; sbx secret ls --sandbox januslin; sbx policy ls januslin --wide | grep cloudflare; echo "grep exit=$?"
```
Expected: no `cloudflare-ops.token`, no Cloudflare secret, `grep exit=1`.
