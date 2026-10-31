# Lend a one-day Cloudflare token to the sandbox
Where: Cloudflare dashboard, your own Terminal, `agent-session` · Time: about 10 min

1. Cloudflare → My Profile → API Tokens → Create token → Custom. TTL: one day. Client IP filter: off. Scopes, by the task named in the issue:

   | Task | Scopes |
   |---|---|
   | T14 (Worker) | Account › Workers Scripts: Edit; Account › Account Settings: Read; Zone `januslin.me` › Workers Routes: Edit, Zone: Read, DNS: Edit |
   | T15 (Access) | Account › Access: Apps and Policies: Edit |
   | T17 (cutover) | Zone `januslin.me` › DNS: Edit, Zone Settings: Edit, Single Redirect: Edit, Transform Rules: Edit, Workers Routes: Edit; Account › Access: Apps and Policies: Edit; AI Crawl Control: Edit |

   A task that needs other scopes changes this table in a PR first.
   If a scope name differs in the dashboard, pick the closest and say which in your reply.
2. Copy the token. In your own Terminal (paste, Enter; nothing is echoed):
   ```sh
   sudo -u Agent sh -c 'umask 077; read -rs T; printf %s "$T" > /Users/Agent/.local/state/januslin-agent/cloudflare-ops.token'
   ```
3. In `agent-session`:
   ```sh
   sbx secret set-custom --sandbox januslin --host api.cloudflare.com --env CLOUDFLARE_API_TOKEN --command 'cat /Users/Agent/.local/state/januslin-agent/cloudflare-ops.token'
   sbx policy allow network --sandbox januslin api.cloudflare.com
   ```

## Check
```sh
sbx secret ls --sandbox januslin; sbx policy ls januslin --wide | grep cloudflare
```
Expected: a custom secret for `api.cloudflare.com` and the `api.cloudflare.com` rule.
