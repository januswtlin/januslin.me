# ADR-0009: Agent identity: an isolated macOS account, two role Apps, and a machine account
- Status: accepted
- Date: 2026-10-29
- Deciders: Janus, coordinator session

## Context
Agents should not act with the author's GitHub identity: PR threads would read like one person arguing with themselves, GitHub refuses self-approval, and an agent would hold admin rights. They also should not reach the author's local credentials (SSH keys, `gh`, Keychain, browser sessions).

Agents run in three places: locally on the author's Mac (Claude Code and Codex CLIs), in the vendors' clouds (Claude Code cloud, Codex cloud, scheduled tasks), and through the tools' own logins, which can start cloud sessions. Vendor cloud agents reach GitHub through the vendor's GitHub App acting for a GitHub user; there is no supported way to make them use our own Apps. A vendor App acting for a user gets the intersection of the App's permissions, that user's access, and the repositories the installation selects, so the user behind the vendor connection sets the ceiling.

Claude Code's subscription quota alone is not enough, so Codex runs too, on the author's ChatGPT subscription (no API key). The author supervises from the phone, so cloud sessions and Remote Control are first-class.

## Decision

### Local agents: the `agent` macOS account
- A dedicated **standard** (non-admin) macOS account, `agent` (short name `Agent`). The operating system keeps the author's files, Keychain, and processes out of reach; the author's home is `chmod 700`. No shared folders, File Sharing and Remote Login off, no cron jobs or LaunchAgents. The token broker is no exception: the author starts it with each session (`scripts/sandbox-session.sh`), so no live App token exists while no session runs, the host only runs code the author has just fast-forwarded to `main`, and any scheduled job in the account is a finding by definition.
- Sessions open from the author's Terminal with `sudo -iu agent` and end with `sudo pkill -u Agent`.
- **The account holds the keys but runs no AI.** Claude Code and Codex run only inside a Docker Sandbox started from this account, which never sees a key (ADR-0013).
- Nothing written by an agent runs in the author's account: the author never runs `pnpm install`, scripts, hooks, or editor tasks from the agent's working tree.
- Root-owned Claude Code managed settings on macOS (claude.ai connectors disabled, bypass-permissions mode disabled, the cron tools denied) stay as a backstop on the host; they do not reach inside the sandbox (ADR-0013).

### Local agents act through two role Apps
| App | Role | Repository permissions | Key lives |
|---|---|---|---|
| `januslin-agent` | Implementers | Contents RW, Pull requests RW, Issues RW, Workflows RW, Actions R, Checks R, Metadata R | `agent` account |
| `januslin-reviewer` | Reviewers | Pull requests RW, Contents R, Issues R, Actions R, Checks R, Metadata R | `agent` account |

- None has Administration, Secrets, Variables, Environments, Deployments, or Members. Webhooks off. Each is installed by `januswtlin` on this repository only.
- Tokens are one-hour installation tokens minted on the host by `scripts/agent-token.sh` (from T03 through a token broker) and used per process by `scripts/agent-gh` and the git credential helper, which read them from a read-only mount inside the sandbox (ADR-0013); never in exported environment variables or argv.
- **Workflow changes need no separate identity.** `januslin-agent` has Workflows write. A branch workflow cannot read any secret (the deploy and Access tokens are environment secrets limited to `main`, ADR-0003), and a workflow change takes effect on `main` only after the author reviews and merges it. `.github/CODEOWNERS` names the author for `.github/`, `wrangler.jsonc`, `worker/`, and the smoke-test script, so those diffs are flagged for the author, and reviewers give them extra scrutiny. A third App, `januslin-platform`, with a per-task token hand-over, is deleted (T02): it added a manual step for little protection here, and a cloud agent could push workflows anyway if the vendor App has Workflows permission (V6).
- **Agent versus reviewer is advisory:** both identities are available inside the one sandbox. Acceptable, because an approval is not a security control here; only the author merges.
- Commits carry an `Agent: claude` or `Agent: codex` trailer.

### The machine account `januslin-agent`
- A GitHub user account (id 349746030) operated by the author. Its web login is used only in the author's own browser (a separate profile), never in the `agent` macOS account, a container, or a cloud environment. It has no SSH keys, PATs, or OAuth apps.
- It is the only collaborator on this repository, with Write. On a personal repository a collaborator gets Write; the `main` ruleset and the environment branch policies (ADR-0003) keep it off `main` and away from the deploy token.
- **It owns the two Apps.** They are made public (GitHub installs a private App only on its owner's account) and transferred from `januswtlin`; new private keys are generated there and the old ones deleted, so every agent credential is issued by the machine account and `januswtlin` holds nothing agent-specific. The installations stay on `januswtlin` with this repository only, so any permission increase needs `januswtlin` to accept it. Whether the transfer keeps the IDs is V5.
- **It is the GitHub identity of cloud agents and tool logins.** The author's claude.ai and ChatGPT accounts connect to GitHub as the machine account; `januswtlin`'s own authorizations of those vendors are revoked; the vendor Apps are installed by `januswtlin` on this repository only. Ceiling: the vendor App's permissions intersected with Write on this repository.
- **Name clash.** The App `januslin-agent` (`januslin-agent[bot]`, user id 349177542) and the machine account `januslin-agent` (id 349746030) are different identities. Docs always qualify which; scripts compare numeric ids.

### Tool logins (inside or through the sandbox)
- **Claude Code:** a full claude.ai login (`/login` in the sandbox, T05), replacing a model-only `setup-token`. It allows Remote Control and could start cloud sessions; those act as the machine account.
- **Codex:** the author's ChatGPT login through `sbx secret set openai --oauth`, kept on the host (T06). V8 checks what can be enforced.
- Local agents still act on GitHub only through the Apps, not through the tools' GitHub connections.

### Cloud agents
- One environment per tool for this repository: no secrets, no credential variables, the narrowest network access that lets `pnpm install` work.
- **Only the author starts cloud sessions and scheduled tasks.** No local session does (`claude --cloud`, Codex cloud tasks, `/schedule`), the coordinator included. No managed setting can block this per device; it is a rule.
- They follow `AGENTS.md` like local agents. A review by the identity that opened the PR is posted as `COMMENT` with the verdict first.

## Remaining risks
1. **The machine account can do what Write allows, and AI tools hold it.** An injected or faulty cloud session can push branches, open and close PRs, delete unprotected branches, close or relabel issues (including `incident` issues), and, if the vendor App has Workflows permission (V6), push branch workflows. It cannot update `main` or read the deploy token. Accepted.
2. **The full tool logins** reach more of the author's claude.ai and ChatGPT accounts than a model-only token: cloud sessions, environments, Remote Control, and connectors. T05 and T06 list the connectors; the author removes those holding personal data or accepts them.
3. **The machine account's own login** can generate App keys. It lives only in the author's browser with a passkey or 2FA.
4. **Public Apps** can be installed by others. Harmless to this repository; the quarterly review expects exactly one installation each.
5. **Workflow changes by an agent** run on branches without secrets, but a workflow can raise its own `GITHUB_TOKEN` with a `permissions:` block (the repository default only applies when none is given). A workflow pushed to some branch could therefore write issues or comments, or post a passing check or status named `ci` on another PR's head commit, and that workflow never appears in the PR the author reviews. So the green `ci` on a PR is trusted only when it comes from a `ci.yml` run for that exact commit: the coordinator and the author check `gh run list --workflow ci.yml --commit <sha>` (or the run link in the checks tab) before merging, and T16 tests whether a fake check is possible. A branch workflow is also a way to run networked code outside the sandbox allowlist. **Decided (the author, 2026-10-30):** every implementer token keeps Workflows write for now, together with the real-run check. **Trigger:** if T16's test shows a branch workflow can post a passing `ci` check or status on another PR's head commit, switch to the narrow option: the broker mints the everyday token without `workflows`, and the author enables it for a workflow task with one host command (`scripts/token-broker.sh workflows on|off`). The switch is recorded here. Workflow changes reach `main` only through the author's review of a CODEOWNERS-flagged diff.
6. **Theft of the Mac.** Revoke the App keys, the tool logins, the author's sessions, and the machine account's sessions (`docs/admin-guide.md`, "Lost device").

## Alternatives considered
- A third App for workflow changes with a per-task, author-minted token: replaced by Workflows on `januslin-agent` plus the author's review, see Decision.
- Agents running directly in the `agent` macOS account: the App keys were readable by the agent; replaced by ADR-0013.
- Agents in the author's own macOS user with sandboxing and managed settings: a long tail of escapes (settings files, hooks, MCP servers, the Keychain, the author's logins).
- Agents acting as the author: no separation and no real reviews.
- Only a machine account, no Apps: one identity for every role and a long-lived credential in the `agent` account.
- Keeping the Apps under `januswtlin`: tokens would be identical; the author chose the transfer so that `januswtlin` holds nothing agent-specific.
- Fine-grained PATs or our own Apps inside cloud environments: not supported by Claude's GitHub proxy; untested for Codex.
- A model-only `setup-token` for Claude Code locally: smallest scope, but no Remote Control.

## Consequences
- PR threads show who is speaking; reviewer verdicts are real reviews; the author can approve agent PRs.
- Opening a local agent session costs one `sudo -iu agent`.
- Push events show `januslin-agent[bot]` for local agents and the machine account for cloud agents (`docs/operations.md`, "Suspicious commit or PR").
- claude.ai and ChatGPT can no longer reach the author's other repositories through GitHub unless the machine account is added there.

## Revisit when
- A vendor lets cloud sessions use a fine-grained token or our own App.
- The reviewer role needs enforcing (a second macOS account).
- An incident involves the machine account or a tool login.
