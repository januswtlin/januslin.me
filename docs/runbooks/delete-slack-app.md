# Delete the unused Slack app and its token
Where: Slack in the browser, then `agent-session` · Time: about 10 min

1. https://api.slack.com/apps → `januslin-coordinator` → OAuth & Permissions → Revoke tokens.
2. Basic Information → Delete App. Archive or keep the channel as you like.
3. In `agent-session`:
   ```sh
   rm -f ~/.config/januslin-agent/slack-bot-token ~/.config/januslin-agent/sandbox-config/coordinator-channel.conf
   ```
4. Only if the Check below lists a Slack rule:
   ```sh
   sbx policy rm network --resource slack.com
   ```
   If it lists a Slack secret, stop and reply with the Check; an agent adds the exact removal command here by PR.

## Check
```sh
ls -la ~/.config/januslin-agent ~/.config/januslin-agent/sandbox-config; sbx secret ls; sbx policy ls januslin --wide | grep -i slack; echo "grep exit=$?"
```
Expected: no Slack file, no Slack secret, `grep exit=1`.
