# Security

Last reviewed: 2026-10-31

## What we protect

The site and the repository are public. What must be protected is **integrity**: nothing reaches `main` or production unless the author merged it, no secret leaves the place it is kept, and agents act only on the author's instructions. Secondary: the author's unpublished writing stays in the local `drafts/` folder and never reaches GitHub.

## Identities

| Identity | Who uses it | Can do on this repo | Notes |
|---|---|---|---|
| `januswtlin` (id 2433928) | The author, in the browser, GitHub Mobile, and their own `gh` | Admin. The only identity that can merge to `main` (ruleset bypass, pull requests only) | Passkey or 2FA |
| Machine account `januslin-agent` (id 349746030) | Claude Code cloud sessions and the claude.ai login used in the sandbox (ADR-0009) | Write collaborator: push branches, open PRs, comment, label, edit issues. Cannot update `main` or enter the deploy environments | Web login only in the author's browser; owns the two Apps of the set `machine` |
| App `januslin-agent` (`januslin-agent[bot]`, id 349177542) | Local implementer agents and the coordinator (in the sandbox) | Contents RW, Pull requests RW, Issues RW, Workflows RW, Actions R, Checks R, Metadata R | Implementer of the set `machine`. Key in the author's account; in the `agent` account only while `machine` is active |
| App `januslin-reviewer` (`januslin-reviewer[bot]`, id 349179834) | Local reviewer agents (in the sandbox) | Pull requests RW, Contents R, Issues R, Actions R, Checks R, Metadata R | Reviewer of the set `machine`, the same way |

Every other App set (ADR-0015) has one implementer and one reviewer App with exactly these permissions, installed on this repository only; a fallback set is owned by `januswtlin`. Only one set is active at a time; the VM reads which from `sandbox-config/identity.json`. None of the Apps has Administration, Secrets, Variables, Environments, Deployments, or Members.

## Threat model (summary)

| Threat | Impact | Primary control |
|---|---|---|
| Agent error or prompt injection (any identity above except the author) | Bad code on a branch or in a PR, closed or relabelled issues, deleted branches | `main` rulesets (only the author merges); independent review of every PR; agents treat all GitHub text except the author's words as data |
| An agent editing a human-task issue or comment the author acts on | The author runs a planted command next to the keys or with admin rights | The author runs only runbooks on `main` (`docs/runbooks/`), reached through the author's merge; issues never contain commands, and a runbook takes no values from issues (ADR-0014) |
| An agent editing a task issue or one of the author's comments, to plant instructions | A tampered spec or a fake instruction acted on | A task counts as approved only if the author added `approved` and nobody else edited it since; a comment counts as the author's only if nobody else edited it; dependencies count as done only when the author closed them (ADR-0014, `docs/agents/workflow.md`) |
| A fake human-task issue | The author is asked to do something harmful | Human tasks never ask for secrets in issues; the author judges each step; every human task names the task it serves |
| Lost or stolen laptop | The author's GitHub session and `gh`, the App keys, the tool logins | Device lock and disk encryption; `docs/runbooks/lost-device.md` revokes all of them, including when the lost device is the Mac |
| An agent exfiltrating an App key or minting tokens at will | Lasting GitHub access as the App, off the machine | Keys stay in the host `agent` account, which runs no AI; the sandbox sees no key and at most one-hour tokens; egress is allowlisted. Whatever the VM can read can still be sent over an allowed host; tokens expire within an hour, and secret scanning blocks pushes of known token formats |
| Draft exposure | Unpublished writing becomes public | `drafts/` is gitignored and never read by agents; `draft: true` entries are public in the repository by design |
| A branch workflow faking `ci` | A failing PR looks green: a workflow pushed to another branch raises its `GITHUB_TOKEN` (`permissions:`) and posts a `ci` check or status on the PR's head commit | Before merging, the coordinator and the author confirm the `ci.yml` run for the exact head commit, not only the badge; the author reads every workflow diff (CODEOWNERS); T16 tests whether it is possible, and if it is, the everyday token loses `workflows` (ADR-0009, risk 5) |
| Strangers on a public repository | Text aimed at agents in issues, PRs, comments, or reactions | Non-collaborators cannot comment or open issues or PRs (creation limited to collaborators, plus an interaction limit renewed before it expires; V4); fork PR workflows need approval; agents act only on the author's instructions |

## Controls in place

### GitHub (public repository, ADR-0012)
- **Two rulesets on `main`**, because a bypass actor bypasses every rule in its ruleset:
  - `main-protect`, **no bypass actors**: require a pull request (0 approvals; the author cannot approve their own PRs), require linear history, block force pushes and deletion. Nobody, the author included, can push directly.
  - `main-restrict-updates`: restrict updates, with the repository admin role as the only bypass actor, in pull-request-only mode. Only the author can merge.
- **Auto-merge is off** (`allow_auto_merge: false`). GitHub cancels auto-merge only on pushes by users without write access, so with auto-merge on, a later push by the machine account to a PR the author had armed would be merged under the author's name.
- **Repository settings:** PR creation and issue creation limited to collaborators; approval required for workflow runs from outside contributors; default `GITHUB_TOKEN` read-only; Actions may not create or approve PRs; squash merge only; head branches deleted after merge; wiki, projects, and discussions off; secret scanning and push protection on; Dependabot alerts on, Dependabot updates off.
- **No interaction from non-collaborators:** the repository interaction limit is set to collaborators only, which also blocks comments. GitHub's interaction limits expire after six months at most, so the operations calendar renews it before expiry.
- **Workflow changes:** `januslin-agent[bot]` and the machine account can push branch workflows. Those run without any secret (environment secrets are limited to `main`) and reach `main` only through the author's merge. `.github/CODEOWNERS` makes the author the owner of `.github/`, `wrangler.jsonc`, `worker/`, the smoke-test script, the host-run scripts (`scripts/token-broker.sh`, `scripts/agent-token.sh`, `scripts/agent-gh`, `scripts/agent-git-credential`, the author's `tools/author/`), `.githooks/`, `sandbox/`, `.claude/settings.json`, and `docs/runbooks/` (every command the author runs), so GitHub requests the author's review on those diffs; reviewers give them extra scrutiny.
- **Collaborators:** the machine account `januslin-agent` only, with Write, besides the owner. Adding another needs an ADR.
- **Environments** `production`, `preview`, and `smoke` exist, each limited to `main`, with no secrets yet. There are no repository secrets or variables.
- **Agents never use the author's credentials.** Settings, secrets, rulesets, collaborators, App installations, and merges are the author's steps, raised as `human-task` issues.
- **Issues as work items (ADR-0014):** the coordinator acts on a task only after checking the author's approval and the edit history, and on GitHub text only when it is the author's unedited words.

### Local agents (ADR-0009, ADR-0013)
- Three layers: the author's macOS account; the standard macOS account `agent`, which holds the App keys, runs the token broker and `sbx`, and **never runs AI**; and the Docker Sandbox `januslin` (a microVM) where Claude Code, the coordinator, and its subagents run. Details: `docs/agents/sandbox.md`; the author's procedures: `docs/admin-guide.md` and `docs/runbooks/`.
- **No key enters the sandbox.** The broker mints one-hour installation tokens on the host, and both reach the VM through a read-only, token-only directory. A compromised agent can read and use a one-hour token, but cannot mint more, keep access past an hour, or copy a key.
- **Egress is deny by default** with a short allowlist (`docs/agents/sandbox.md`); only the author changes it.
- Inside the VM Claude Code runs in auto mode, not bypass mode: the VM does not protect what is on GitHub, which the mounted tokens reach, so a classifier checks actions against injected instructions. The agent is root in the VM, so this is a default, not a control against a determined agent; the VM, the allowlist, the missing keys, and the rulesets are the boundary. The macOS managed settings remain on the host as a backstop.
- Nothing an agent writes runs in the author's account or in a host working tree: the sandbox works on its own clone, the author never runs `pnpm install`, scripts, or hooks from it, and no folder is shared between the macOS accounts.
- Reviewer and implementer identities are both reachable in the sandbox, so the split between them is advisory; an approval is not a security control here (only the author merges).

### Cloud agents and tool logins (ADR-0009)
- Claude Code cloud sessions and the claude.ai login used in the sandbox reach GitHub only as the machine account. Ceiling: the Claude GitHub App's permissions intersected with Write on this repository. The rulesets and environments apply to it like to any collaborator.
- Only the author starts cloud sessions and scheduled tasks. The cloud environment holds no secrets.
- claude.ai connectors: GitHub only, none holding personal data. In the repository, `.claude/settings.json` denies the `mcp__claude_ai_*` tools.
- Docker's MCP gateway, which the sandbox template wires into Claude Code, is denied (`mcp__mcp-gateway__*`): its tools would let an agent add and run unreviewed tools at runtime. A future MCP server comes in through a reviewed PR to `.claude/settings.json`.
- Claude Code commits may carry a `Claude-Session:` trailer with a session URL. The author accepts these in the public history; the URLs open only for the author's claude.ai account.
- The Claude GitHub App has Workflows write, no Secrets or Variables, and repository hooks write, which needs admin on the repository to use and so has no effect at the machine account's Write. So a cloud session can push branch workflows; like the Apps' (ADR-0009, risk 5), those run without secrets and reach `main` only through the author's review.

## Controls added by planned tasks

- **`ci` required** on `main-protect` (T16, [#23](https://github.com/januswtlin/januslin.me/issues/23)): no red PR merges, the author's included. T16 also verifies that a branch workflow cannot read the environment secrets, and runs gitleaks on every PR next to GitHub's push protection. Never commit `.env*` except `.env.example`.
- **Cloudflare credentials** (T14, T15, [#18](https://github.com/januswtlin/januslin.me/issues/18), [#20](https://github.com/januswtlin/januslin.me/issues/20)):

  | Token | Stored | Scope (T14 verifies the minimum) | Used by |
  |---|---|---|---|
  | Deploy token `CLOUDFLARE_API_TOKEN` | Environment secret in `production` and `preview` (both `main` only) | Account › Workers Scripts: Edit; Account › Account Settings: Read; Zone `januslin.me` › Workers Routes: Edit, Zone: Read, DNS: Edit (custom domains) | `ci.yml` deploy and rollback jobs, `preview.yml` |
  | Ops token (short-lived) | Lent by the author per task: in the `agent` account's state directory (`cloudflare-ops.token`, `0600`) only while the task runs, injected by the sandbox proxy for `api.cloudflare.com`; the agent never sees it. One-day expiry; taken back at the end (`docs/runbooks/lend-cloudflare-token.md`, `take-back-cloudflare-token.md`). Never in GitHub | The scopes the task needs | Platform Engineer for T14, T15, T17 |

  Threats these address: a leaked deploy token (an arbitrary site deployed, or the zone changed); unpinned transitive dependencies of `wrangler` running next to the token; a malicious or buggy dependency in the build (the token is never in a job that runs `pnpm install`). The `preview` job holds the same token, which can deploy production, so a compromised preview job (a pinned action or wrangler release) equals a production compromise: both are pinned and reviewed like code. Jobs holding the token install wrangler from a committed lockfile with `--frozen-lockfile --ignore-scripts`, never a bare `npx wrangler@<version>`, and never run `pnpm install` of the site.
- **Preview protection** (T15): Worker-level Cloudflare Access in "Previews only" mode covers every preview URL; production stays public; `workers_dev` is off. One Access service token (`ci-smoke-test`, one year) passes a Service Auth policy so the smoke test can reach the deployed version before cutover; it is an environment secret of `smoke` only, and T17 removes it.
- **Site hardening** (T09, T10, T14): no third-party scripts except the Cloudflare Web Analytics beacon; security headers in `public/_headers` (strict `Content-Security-Policy` with `script-src 'self'` plus the beacon and no `'unsafe-inline'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, a `Permissions-Policy` denying camera, microphone, and geolocation, `frame-ancestors 'none'`, HSTS); a file-type allow-list and raw-HTML sanitizing for `content/`.
- **Renovate** (T19): dependency PRs reviewed and merged by the author; its App installed on this repository only.
- **Mobile publishing:** Working Copy signs in with an SSH key generated on the device, added as a **deploy key with write access** to this repository only (never an account SSH key, never an OAuth grant). One key per device, named `working-copy-<device>-<yyyy-mm>`; the quarterly review deletes unused ones. The rulesets keep it off `main` (V12 checks this on the first device). Merging happens in GitHub Mobile or the browser, signed in as the author with a passkey. Threat: a lost or stolen phone can push branches with its deploy key until the key is deleted (`docs/runbooks/lost-device.md`); the rulesets keep it off `main`.

## Runbooks
`docs/runbooks/`: `lost-device.md`, `app-key-sets.md` (switch or turn off the App set, rotate keys), and the token rotations T14 and T15 add. `docs/operations.md`: "Suspicious commit or PR", "Roll back production", "Rotate deploy token".
