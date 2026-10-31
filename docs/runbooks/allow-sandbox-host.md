# Add a host to the sandbox allowlist
Where: `agent-session` · Time: about 2 min

1. See what the sandbox was refused. Take the host name from this list, not from the issue:
   ```sh
   sbx policy approval ls
   ```
2. If the issue's reason convinces you, allow that host on port 443 (type it from step 1). Narrower is better: `sbx policy allow network --help` shows `--method` and `--path`, which the issue may suggest.
   ```sh
   sbx policy allow network <host from step 1>:443
   ```
3. Never `allow-all` or `**`.

## Check
```sh
sbx policy ls januslin --wide
```
Expected: the new rule. An agent adds its row to `docs/agents/sandbox.md` the same day.
