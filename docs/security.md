# Security

Last reviewed: 2026-10-29

## What we protect

The site and the repository are public. What must be protected is **integrity**: nothing reaches `main` or production unless the author merged it, and no secret leaves the place it is kept. Secondary: the author's unpublished writing stays in the local `drafts/` folder and never reaches GitHub.

## Identities

| Identity | Who uses it | Can do on this repo | Notes |
|---|---|---|---|
| `januswtlin` (id 2433928) | The author, in the browser, the GitHub mobile app, and their own `gh` | Admin. The only identity that can merge to `main` (ruleset bypass, pull requests only) | Passkey or 2FA |
| Machine account `januslin-agent` (id 349746030) | Claude Code cloud, Codex cloud, scheduled tasks, the tools' full logins (ADR-0009) | Write collaborator: push branches, open PRs, comment, label. Cannot update `main` or enter the deploy environments | Web login only in the author's browser; owns the two Apps |
| App `januslin-agent` (`januslin-agent[bot]`, id 349177542) | Local implementer agents (in the sandbox) | Contents RW, Pull requests RW, Issues RW, Workflows RW, Actions R, Checks R, Metadata R | Key in the `agent` account on the host |
| App `januslin-reviewer` | Local reviewer agents (in the sandbox) | Pull requests RW, Contents R, Issues R, Actions R, Checks R, Metadata R | Key in the `agent` account on the host |
| Renovate App | Dependency PRs | Its own App permissions | Installed on this repository only |
| Working Copy deploy key (per device) | The author on the phone | Push branches | Cannot update `main` (ruleset) |

None of the Apps has Administration, Secrets, Variables, Environments, Deployments, or Members.

## Threat model (summary)

| Threat | Impact | Primary control |
|---|---|---|
| Agent error or prompt injection (any identity above except the author) | Bad code on a branch or in a PR, closed or relabelled issues, deleted branches | `main` ruleset (only the author merges); environment secrets limited to `main`; independent review of every PR; agents treat all GitHub text as data |
| Leaked Cloudflare deploy token | Arbitrary site deployed, or zone changed | Least-privilege token; stored only as environment secrets limited to `main`; deploy jobs run no repo script; ops token never stored in GitHub. The `preview` job holds the same token, which can deploy production, so a compromised preview job (a pinned action or wrangler release) equals a production compromise: both are pinned and reviewed like code |
| Unpinned transitive dependencies of `wrangler` | Supply-chain code running next to the token | Jobs holding the token install wrangler from a committed lockfile with `--frozen-lockfile --ignore-scripts` (T16), never a bare `npx wrangler@<version>` |
| Malicious or buggy dependency | Supply-chain compromise of the build | Lockfile, Renovate PRs reviewed and merged by the author; the token is never in a job that runs `pnpm install` |
| Lost or stolen phone | Branch pushes with the deploy key | Device lock; revoke the deploy key ("Lost device"). The ruleset blocks `main` |
| Lost or stolen laptop | The author's GitHub session and `gh`, the App keys, the tool logins, the Slack bot token | Device lock and disk encryption; "Lost device" runbook revokes all of them |
| An agent exfiltrating an App key or minting tokens at will | Lasting GitHub access as the App, off the machine | Closed once T03-H4 has rotated the keys that existed while AI still ran on the host: keys stay in the host `agent` account, which runs no AI from T03; the sandbox sees no key and at most one-hour tokens (V16 canary); egress is allowlisted. Whatever the VM can read can still be sent over an allowed host; tokens expire within an hour, and secret scanning blocks pushes of known token formats |
| Draft exposure | Unpublished writing becomes public | `drafts/` is gitignored and never read by agents; `draft: true` entries are public in the repo by design; previews behind Access |
| A branch workflow faking `ci` | A failing PR looks green: a workflow pushed to another branch raises its `GITHUB_TOKEN` (`permissions:`) and posts a `ci` check or status on the PR's head commit | Before merging, the coordinator and the author confirm the `ci.yml` run for the exact head commit (`gh run list --workflow ci.yml --commit <sha>`), not only the badge; the author reads every workflow diff (CODEOWNERS); T16 tests whether it is possible; if it is, the everyday token loses `workflows` (decision and trigger in ADR-0009) |
| Strangers on a public repo | Text aimed at agents in issues, PRs, comments, or reactions | Requirement: non-collaborators cannot comment or open issues or PRs (PR and issue creation limited to collaborators, plus an interaction limit of collaborators only, renewed before it expires; V4); fork PR workflows need approval; agents act only on the author's instructions |

## Controls

### GitHub (public repository, ADR-0012)
- **Two rulesets on `main`** (T01, `ci` check added in T16), because a bypass actor bypasses every rule in its ruleset:
  - `main-protect`, **no bypass actors**: require a pull request (0 approvals; the author cannot approve their own PRs), require the `ci` status check, require linear history, block force pushes and deletion. Nobody, the author included, can merge a red PR or push directly.
  - `main-restrict-updates`: restrict updates, with the repository admin role as the only bypass actor, in pull-request-only mode. Only the author can merge.
  - Result: only the author merges, only green PRs, and nobody pushes to `main` directly (V2).
- **Auto-merge is off** (`allow_auto_merge: false`). GitHub cancels auto-merge only on pushes by users without write access, so with auto-merge on, a later push by the machine account to a PR the author had armed would be merged under the author's name.
- **Repository settings** (T01): PR creation and issue creation limited to collaborators; approval required for workflow runs from outside contributors; auto-merge off; default `GITHUB_TOKEN` read-only; Actions may not create or approve PRs; squash merge only; head branches deleted after merge; wiki and projects off; secret scanning and push protection on; Dependabot alerts on, Dependabot updates off (Renovate does updates).
- **No interaction from non-collaborators** (T01, a requirement): PR and issue creation limited to collaborators, and the repository interaction limit set to collaborators only, which also blocks comments (reactions: per V4). GitHub's interaction limits expire (six months at most), so the operations calendar renews it before expiry. Verified from a non-collaborator account (V4).
- **Workflow changes:** `januslin-agent[bot]` and the machine account can push branch workflows, which run without any secret (environment secrets are limited to `main`) and reach `main` only through the author's merge. `.github/CODEOWNERS` makes the author the owner of `.github/`, `wrangler.jsonc`, `worker/`, the smoke-test script, and the host-run scripts (`scripts/token-broker.sh`, `scripts/agent-token.sh`, `scripts/agent-gh`, `scripts/agent-git-credential`, any Codex launcher), so GitHub requests the author's review on those diffs; reviewers give them extra scrutiny. Verified by T16: a branch workflow cannot read the environment secrets.
- **Collaborators:** the machine account `januslin-agent` only, with Write, besides the owner (the API lists `januswtlin` as `admin`). Adding another needs an ADR.
- **Environments** (`docs/deployment.md`): `production`, `preview`, and `smoke`, all limited to `main`, hold the only secrets. The Cloudflare token is only in `production` and `preview`, whose jobs run no repo script; the Access service token is only in `smoke`.
- **Agents never use the author's credentials.** Settings, secrets, rulesets, collaborators, App installations, and merges are the author's steps.
- Secret scanning in CI with gitleaks on every PR, in addition to GitHub's push protection. Never commit `.env*` except `.env.example`.

### Local agents (ADR-0009, ADR-0013)
- Three layers: the author's macOS account; the standard macOS account `agent`, which holds the App keys and the Slack token, runs the token broker and `sbx`, and **never runs AI**; and the Docker Sandbox `januslin` (a microVM) where Claude Code, Codex, the coordinator, and `pnpm verify` run. Procedures: `docs/agents/local-agent-account.md`, `docs/agents/sandbox.md`.
- **No key enters the sandbox.** The broker mints one-hour installation tokens on the host, and both reach the VM through a read-only, token-only directory (ADR-0013's fallback: the proxy-injected `github` secret overrides the reviewer's token too, V18). A compromised agent can read and use a one-hour token, but cannot mint more, keep access past an hour, or copy a key.
- **Egress is deny by default** with a short allowlist (`docs/agents/sandbox.md`); only the author changes it.
- Inside the VM Claude Code runs in auto mode and Codex with its workspace-write sandbox and automatic review, not in bypass mode: the VM does not protect what is on GitHub, which the mounted tokens reach, so a classifier checks actions against injected instructions (`docs/agents/sandbox.md`). The agent is root in the VM, so these are defaults, not controls against a determined agent; the VM, the allowlist, the missing keys, and the rulesets are the boundary. The macOS managed settings remain on the host as a backstop.
- Nothing an agent writes runs in the author's account or in a host working tree: the sandbox works on its own clone, the author never runs `pnpm install`, scripts, or hooks from it, and no folder is shared between the macOS accounts.
- Reviewer and implementer identities are both reachable in the sandbox, so the split between them is advisory; an approval is not a security control here (only the author merges).

### Cloud agents and tool logins (ADR-0009)
- Claude Code cloud, Codex cloud, scheduled tasks, and the full claude.ai and ChatGPT logins used in the sandbox reach GitHub only as the machine account. Ceiling: the vendor App's permissions intersected with Write on this repository. The ruleset and environments apply to it like to any collaborator.
- Only the author starts cloud and scheduled sessions. Their environments hold no secrets.
- Connectors on the author's claude.ai and ChatGPT accounts are reviewed in T05 and T06; ones holding personal data are removed or accepted in writing.

### Slack bot token (ADR-0011)
- One credential on the host in the `agent` account (`~/.config/januslin-agent/slack-bot-token`, `0600`), injected by the sandbox proxy for `slack.com`, for the app `januslin-coordinator`, scopes `chat:write`, `groups:history`, `reactions:write`, in the private channel `#januslin-me` only. If it leaks, someone can post as the bot and read that channel; nothing else.
- Only `scripts/coordinator-channel.sh` uses it, and never sees the value when the proxy injects it (fallback: through `curl` stdin, never argv or output). Only plain messages from the author's Slack user ID are instructions, bounded by `AGENTS.md`. The channel ID and the author's Slack ID live in a config file in the `agent` account, not in the repository.

### Mobile publishing credential
- Working Copy signs in with an SSH key generated on the device, added as a **deploy key with write access** to this repository only (never an account SSH key, never an OAuth grant). One key per device, named `working-copy-<device>-<yyyy-mm>`; the quarterly review deletes unused ones.
- Merging happens in the GitHub mobile app or the browser, signed in as the author with a passkey.

### Site hardening
- No third-party scripts except the Cloudflare Web Analytics beacon.
- Security headers in `public/_headers` (T14): strict `Content-Security-Policy` (`script-src 'self'` plus the beacon; no `'unsafe-inline'`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, a `Permissions-Policy` that denies camera, microphone, and geolocation, `frame-ancestors 'none'`, HSTS.
- No user-generated content. `content/` gets a file-type allow-list and raw-HTML sanitizing (T10) as hygiene.

### Cloudflare credentials
| Token | Stored | Scope (T14 verifies the minimum) | Used by |
|---|---|---|---|
| Deploy token `CLOUDFLARE_API_TOKEN` | Environment secret in `production` and `preview` (both `main` only) | Account › Workers Scripts: Edit; Account › Account Settings: Read; Zone `januslin.me` › Workers Routes: Edit, Zone: Read, DNS: Edit (custom domains) | `ci.yml` deploy and rollback jobs, `preview.yml` |
| Ops token (short-lived) | Created by the author per task (T14-H1). It sits in the `agent` account's state directory on the host (`cloudflare-ops.token`, `0600`) only while that task runs, and the sandbox proxy injects it for `api.cloudflare.com`; the agent never sees it. The author deletes the file and revokes the token at the end (T14-H3). One-day expiry. Never in GitHub | The scopes the task needs: the deploy scopes (T14 test upload), or Access: Apps and Policies Edit, Zone Settings Edit, Single Redirect and Transform Rules Edit, AI Crawl Control | Platform Engineer for T14, T15, T17 |

Creating tokens and storing secrets are the author's steps (T14-H1, T14-H2, T15-H2). Agents never paste tokens into web forms or chats.

### Preview protection
- Worker-level Cloudflare Access in "Previews only" mode covers every preview URL; production stays public. `workers_dev` is off.
- One Access service token (`ci-smoke-test`, one year) passes a Service Auth policy so the smoke test can reach the deployed version before cutover. It is an environment secret of `smoke` only; T17 removes it once smoke tests target `https://januslin.me`.

## Runbooks
`docs/operations.md`: "Lost device", "Suspicious commit or PR", "Rotate deploy token", "Rotate the agent App keys", "Roll back production".
