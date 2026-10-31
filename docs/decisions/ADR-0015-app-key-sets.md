# ADR-0015: App key sets, kept in the author's account, one active on the host
- Status: proposed
- Date: 2026-10-31
- Deciders: the author (Janus Lin), on the coordinator's proposal

## Context

ADR-0009 gives local agents one pair of GitHub Apps (implementer and reviewer), owned by the machine account `januslin-agent`, with their keys in the `agent` macOS account. On 2026-10-31 GitHub marked the machine account as spam, and every request by either App failed with HTTP 403 ("The owner of this application has been marked as spammy"). The keys, the broker, and the sandbox were all fine; the single owner was the single point of failure, and there was no second pair to switch to.

The author wants a fallback that is off by default, can be switched on by the author alone, needs nothing from the agents, and does not limit the design to one primary and one standby.

## Decision

- **A key set** is one pair of Apps, implementer and reviewer, with the same owner. Its public IDs live in `apps.json` (format version 1: set name, owner, repository, and per role the App ID, installation ID, bot slug, bot user ID, and key file name); its keys are `implementer.pem` and `reviewer.pem`. There may be any number of sets. The current Apps become the set `machine`; a second pair, owned by `januswtlin` and installed on this repository only, is the first fallback.
- **All sets live in the author's own macOS account**, as files in `~/.config/januslin-keys/sets/<set>/` (folders `0700`, keys `0600`, inside the author's `chmod 700` home), where neither the `agent` account nor the sandbox can read them.
- **The host holds exactly one set, or none**, in `~/.config/januslin-agent/active/`. Only the author changes it, with `tools/author/januslin-keys use <set>` or `off`, run from the author's account (`sudo -H -u Agent`). A set that is not active is not on the host, which is what keeps it locked.
- **The agents do nothing.** `scripts/agent-token.sh` reads the active set's IDs and keys. `scripts/token-broker.sh` compares the active `apps.json` with the one each token was minted from on every check (every 60 seconds): when the author switched sets, it revokes the old tokens and mints from the new set at once; when the author removed the set, it revokes both tokens and mints nothing. The sandbox's token files keep their role names (`januslin-agent.token`, `januslin-reviewer.token`), so `agent-gh` and the credential helper are unchanged.
- **The VM learns the active identity**: the broker writes the set name, owner, and each role's App ID, bot slug, and bot user ID to `sandbox-config/identity.json` (the read-only config mount reserved for non-secret configuration). No key file name, installation ID, or other field is copied unless named in the broker's filter.
- **The author's tool lives in this repository** (`tools/author/`, a CODEOWNERS path) so it is tested with the scripts that read what it writes; the author runs a copy of `main` from `~/bin`, never an agent's working tree. `add` asks for each role's App ID and key file and looks up the rest from GitHub with that key, so a set cannot name the wrong App.
- This amends ADR-0009 in two places: Apps may also be owned by `januswtlin`, and App keys are kept in the author's account, with only the active set in the `agent` account. The rest of ADR-0009 stands.

## Alternatives considered

- **A vault the agent account queries (OpenBao, HashiCorp Vault, Infisical)**, with per-key policies. OpenBao's Transit engine would even keep the keys from the host entirely. Rejected for now as more than this needs: a new service, a separate macOS account to keep its storage and unseal key away from `agent`, unsealing after every restart, and a policy language to maintain. Revisit if the host should never hold a key.
- **Every set's keys on the host, switched by a setting.** One command in `agent-session`, but no lock: a compromise of the `agent` account would take every set.
- **Fallback Apps not installed until needed.** Strong (only the owner can install), but switching then means browser steps under pressure; with the keys off the host, installation is not what locks a set.
- **Keys in the author's Keychain instead of files.** A confirmation prompt on every `use`. Deferred: files inside the author's `chmod 700` home are simpler, and the Keychain can be added to `januslin-keys` later without changing the host side.
- **Keep one pair and wait for GitHub support.** Leaves the agents stopped for as long as the appeal takes.

## Consequences

- Switching is one command for the author and about a minute for the agents; nothing in the sandbox restarts.
- `januswtlin` now owns agent Apps and can generate their keys. It is already the repository's admin, so this adds no power, only identities to keep track of. A fallback bot is still not the author: it cannot merge, and its comments are not the author's instructions.
- A compromised `agent` account still yields the active set's keys, as before ADR-0015; `off` stops new tokens but does not undo a copy, so after a suspected compromise the author also suspends the installations and rotates that set's keys. A lost or compromised Mac now exposes every set: `lost-device.md` deletes the keys of every set's Apps.
- The VM can no longer assume the bot names `januslin-agent[bot]` and `januslin-reviewer[bot]`; `identity.json` names the active ones. Docs keep the `machine` set's names as the default.
- The broker revokes on every switch, so a switch costs two revocations and two mints; GitHub's limits are far above that.
- Commits in the VM keep their configured author email (the `machine` implementer bot's) whichever set pushes them; the push identity is the active set's.
- Cloud sessions are unaffected: they act as the machine account through the vendors' Apps, not through these sets.

## Revisit when

- The host should never hold a key (then the vault alternative).
- More than one set should be active at once, for example one per role from different owners.
- GitHub offers a way to restrict an App key or token further than an installation on one repository.
