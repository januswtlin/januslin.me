# Install the host Claude Code managed settings
Where: your own Terminal · Time: about 2 min

1. Writes the reviewed content below to the root-owned file:
   ```sh
   sudo tee "/Library/Application Support/ClaudeCode/managed-settings.json" >/dev/null <<'JSON'
   {
     "disableClaudeAiConnectors": true,
     "disableRemoteControl": true,
     "permissions": {
       "disableBypassPermissionsMode": "disable",
       "deny": ["mcp__claude_ai_*", "CronCreate", "CronList", "CronDelete", "RemoteTrigger"]
     },
     "env": { "CLAUDE_CODE_DISABLE_CRON": "1" }
   }
   JSON
   sudo chown root:wheel "/Library/Application Support/ClaudeCode/managed-settings.json"
   sudo chmod 644 "/Library/Application Support/ClaudeCode/managed-settings.json"
   ```

## Check
```sh
ls -l "/Library/Application Support/ClaudeCode/managed-settings.json"; sudo -u Agent touch "/Library/Application Support/ClaudeCode/managed-settings.json"; echo "touch exit=$?"
```
Expected: owner `root wheel`, mode `-rw-r--r--`, `touch exit=1`.
