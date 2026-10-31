# App key sets: add, switch, turn off
Where: your own Terminal; the browser for GitHub · Time: about 5 min to switch; about 20 min to set up a new pair of Apps

A set is one implementer App and one reviewer App with their keys (ADR-0015). All sets live in your account in `~/.config/januslin-keys/sets/`; the `agent` account holds only the active one. `januslin-keys` asks for `sudo` (your password) whenever it writes to the `agent` account.

## Install the tool (once, and after every merge that changes `tools/author/`)
Copy it from `main`, never from an agent's working tree. In your own Terminal:
```sh
mkdir -p ~/bin && curl -fsSL https://raw.githubusercontent.com/januswtlin/januslin.me/main/tools/author/januslin-keys -o ~/bin/januslin-keys && chmod 755 ~/bin/januslin-keys
less ~/bin/januslin-keys
```
`~/bin` must be on your `PATH` (`echo $PATH`).

## Move the current keys into the set `machine` (once, when this lands)
The broker on `main` reads only `~/.config/januslin-agent/active/`, and a running broker picks up the new code as soon as the host clone is updated, so do this before you next run `scripts/sandbox-session.sh start` (or otherwise update the host clone):
```sh
cd / && (umask 077; sudo cat /Users/Agent/.config/januslin-agent/januslin-agent.pem > ~/Downloads/impl.private-key.pem)
cd / && (umask 077; sudo cat /Users/Agent/.config/januslin-agent/januslin-reviewer.pem > ~/Downloads/rev.private-key.pem)
cd / && sudo rm /Users/Agent/.config/januslin-agent/januslin-agent.pem /Users/Agent/.config/januslin-agent/januslin-reviewer.pem
januslin-keys add machine     # implementer App ID 5506552, key ~/Downloads/impl.private-key.pem; reviewer 5506595, ~/Downloads/rev.private-key.pem
januslin-keys use machine
```
`add` checks each key with GitHub, so it fails while GitHub refuses the machine account's Apps. Then the two copies stay in `~/Downloads` (mode `0600`) until `add machine` works; set up a new pair (below) and `use` it meanwhile. The old key files are out of the `agent` account either way.

## Set up a new pair of Apps (a new set)
1. As the owner (for the fallback: `januswtlin`), GitHub → Settings → Developer settings → GitHub Apps → New GitHub App, twice:
   - Names, for example `januslin-impl-<owner>` and `januslin-review-<owner>`. Homepage URL `https://januslin.me`. Webhook off. Only on this account (private).
   - Permissions exactly as `docs/security.md` ("Identities") lists for the implementer and the reviewer App. Nothing else.
2. For each App: Install App → only `januswtlin/januslin.me`. Then Private keys → Generate a private key (it downloads to `~/Downloads`).
3. In your own Terminal:
   ```sh
   januslin-keys add <set>
   ```
   It asks for each App's ID (App settings → General) and key file, shows the bot it found, saves the set, and offers to delete the downloads.
4. Send the coordinator, or put in a PR, the two bot names and IDs it printed, so `docs/security.md` and `docs/infra-current-state.md` can list the set.

## Switch to another set
```sh
januslin-keys use <set>
januslin-keys status
```
Within a minute the broker revokes the old tokens and mints from the new set; `status` shows `app set: <set>` and fresh expiries. Nothing in the sandbox needs a restart.

## Turn everything off
```sh
januslin-keys off
```
Within a minute both tokens are revoked and no new ones are minted. The agents' GitHub calls then fail, and they report it.

If the `agent` account or the sandbox may be compromised, `off` is not enough, because a key or a token may already be copied:
1. For each App of the active set: GitHub → Settings → Applications (or the owner's Installed GitHub Apps) → Configure → Suspend. Every token of that installation stops working at once.
2. Rotate the set's keys (below) before you unsuspend.

## Rotate a set's keys
1. For each App of the set: Private keys → Generate a private key.
2. `januslin-keys add <set>` → `y` to replace; give the new key files.
3. If the set is active: `januslin-keys use <set>`.
4. On each App's page, delete the old key. Exactly one key remains.

## Check
```sh
januslin-keys status
cd / && sudo ls -la /Users/Agent/.config/januslin-agent /Users/Agent/.config/januslin-agent/active
```
Expected: the active set and both tokens about an hour ahead; in the `agent` account only `active/` (`apps.json`, `implementer.pem`, `reviewer.pem`, all `0600`) and `sandbox-config/`, no other `.pem`.

Key fingerprints of every set (public, never a key), to compare with each App's page, which must show exactly one key:
```sh
for k in ~/.config/januslin-keys/sets/*/*.pem; do printf '%s SHA256:' "$k"; openssl rsa -in "$k" -pubout -outform DER 2>/dev/null | openssl dgst -sha256 -binary | openssl base64 -A; echo; done
```
