# Revoke everything a lost device could use
Where: a trusted device's browser (and the Mac, if it is not the lost one) · Time: about 30 min

## A phone or tablet
1. This repository → Settings → Deploy keys → delete the device's key.
2. GitHub → Settings → Sessions → sign out its GitHub Mobile session.

## A laptop other than the Mac
3. The phone steps, plus, for both `januswtlin` and the machine account: GitHub → Settings → Sessions → sign out; Settings → Applications → Authorized OAuth Apps → GitHub CLI → Revoke; Settings → SSH and GPG keys → delete the laptop's keys. Change the machine account's password.
4. claude.ai → Settings → sign out everywhere (ends Remote Control and cloud sessions).

## The Mac
The App keys, the `agent` account, and the sandbox are on it.
5. Steps 3 and 4.
6. In the machine account's browser profile, on another device: for each App, GitHub → Settings → Developer settings → GitHub Apps → the App → Private keys → delete **every** key. Local agents stop working until a new Mac is set up (`rotate-app-keys.md` then generates new keys).
7. Docker Hub → Account settings → sign out all sessions (the `sbx` login).
8. Rotate the deploy token and `ci-smoke-test`, once they exist.
9. Optional: Cloudflare Zero Trust → revoke the device's Access sessions.

## The Mac is not lost but a laptop or session may be compromised
10. `rotate-app-keys.md`, and in `agent-session` remove every sandbox secret (the Claude login included; log in again afterwards):
    ```sh
    sbx reset
    ```

## Afterwards
11. Tell the coordinator (or, without the Mac, a cloud session you start) so it reviews recent pushes, PRs, issues, and Actions runs (`docs/operations.md`, "Suspicious commit or PR").

## Check
Expected: Deploy keys, Sessions, Authorized OAuth Apps, and the Apps' key lists show nothing from the lost device.
