# Revoke everything a lost device could use
Where: a trusted device's browser, then the Mac · Time: about 30 min

Phone or tablet:
1. This repository → Settings → Deploy keys → delete the device's key.
2. GitHub → Settings → Sessions → sign out its GitHub Mobile session.

Laptop (all of the above, plus):
3. For both `januswtlin` and the machine account: GitHub → Settings → Sessions → sign out; Developer settings → revoke `gh` tokens; SSH keys → delete the laptop's. Change the machine account's password.
4. claude.ai → Settings → sign out everywhere (ends Remote Control and cloud sessions).
5. `rotate-app-keys.md`.
6. In `agent-session` (removes every sandbox secret, the Claude login included):
   ```sh
   sbx reset
   ```
   Then sign out the Docker account `sbx` uses, at Docker Hub → Account settings → sessions.
7. If the device may have been unlocked: rotate the deploy token and `ci-smoke-test` once they exist.
8. Optional: Cloudflare Zero Trust → revoke the device's Access sessions.
9. Tell the coordinator, so it reviews recent pushes, PRs, issues, and Actions runs (`docs/operations.md`, "Suspicious commit or PR").

## Check
Expected: Deploy keys and Sessions list nothing from the lost device.
