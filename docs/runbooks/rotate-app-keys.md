# Rotate both App keys
Where: the browser profile of the machine account `januslin-agent`, your own Terminal, `agent-session` · Time: about 15 min

For `januslin-agent`, then `januslin-reviewer`:
1. GitHub → Settings → Developer settings → GitHub Apps → the App → Private keys → Generate a private key.
2. Put it into the `agent` account: `hand-over-app-key.md`.
3. In `agent-session`, confirm it mints a token, then revoke the test token:
   ```sh
   scripts/agent-token.sh januslin-agent && scripts/agent-token.sh --revoke januslin-agent
   scripts/agent-token.sh januslin-reviewer && scripts/agent-token.sh --revoke januslin-reviewer
   ```
4. Back on the App's page, delete the old key. Exactly one key remains.

## Check
In `agent-session` (prints public fingerprints, never a key):
```sh
for a in januslin-agent januslin-reviewer; do printf '%s SHA256:' "$a"; openssl rsa -in ~/.config/januslin-agent/$a.pem -pubout -outform DER 2>/dev/null | openssl dgst -sha256 -binary | openssl base64 -A; echo; done
```
Expected: each line equals the one fingerprint on that App's settings page.
