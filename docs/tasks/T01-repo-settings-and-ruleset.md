# T01: Repository settings, `main` rulesets, App installations

- Role: Platform Engineer
- Depends on: none · Human steps: T01-H1 (right after the initial push), T01-H2, T01-H3, T01-H4
- Identity: author for every setting (agents never hold admin rights); app (`januslin-agent[bot]`) for this task's PR
- Branch: `agent/platform/T01-repo-settings`
- Size: S
- Runs on: the author's Mac, in the `agent` account. Nothing else runs in parallel.

## Goal
`main` of the public repository can change only through a PR the author merges, the repository settings match `docs/security.md`, the two role Apps are installed here, and the `agent` account has a clean clone of this repository.

## Read first
`AGENTS.md`, ADR-0003, ADR-0009, ADR-0012, `docs/security.md` ("Controls", GitHub), `docs/deployment.md` ("Secrets and environments"), `docs/agents/local-agent-account.md` ("Setting up the clone"), `docs/infra-current-state.md` (V1, V2, V4). GitHub docs: rulesets (restrict updates, bypass modes), "Limiting PR creation to collaborators", issue creation limits, environments and deployment branch policies, interaction limits.

## Scope
Right after the author pushes the initial docs commit, the repository is public with default settings, so the author does T01-H1 first. Then, in the `agent` account, with the archive clone's scripts (they mint tokens for a repository named `januslin.me`):
1. Move the archive clone to `~/januslin.me-archive` and remove its credential helper config. Clone this repository into `~/januslin.me` as in `docs/agents/local-agent-account.md`, pointing the credential helper at the archive copy of `scripts/agent-git-credential` until T02 ports it.
2. Prepare, as exact `gh api` commands (and the matching browser clicks) for the author to read and run in their own account (T01-H2):
   - Settings: squash merge only, default commit message from the PR title and body, auto-merge off, delete head branches on merge, wiki and projects off, issues on, discussions off; PR creation and issue creation limited to collaborators; approval required for workflow runs from all outside contributors; default `GITHUB_TOKEN` permissions read-only; Actions may not create or approve PRs; secret scanning and push protection on; Dependabot alerts on, Dependabot security updates off.
   - Ruleset `main-protect` (active, target the default branch, **no bypass actors**): require a pull request (0 approvals), block force pushes, restrict deletions, require linear history. No required status check yet (T16 adds `ci`).
   - Ruleset `main-restrict-updates` (active, default branch): restrict updates. Bypass: the repository admin role only, in pull-request-only mode. Two rulesets, because a bypass actor bypasses every rule in its ruleset.
   - **No comments, issues, or PRs from non-collaborators (a requirement; reactions as V4 finds).** The PR and issue creation limits do not cover comments, so also set the repository interaction limit to collaborators only for the longest period GitHub allows (`PUT /repos/januswtlin/januslin.me/interaction-limits` with `{"limit": "collaborators_only", "expiry": "six_months"}`, or Settings → Moderation options → Interaction limits). If GitHub offers a permanent setting that achieves the same by the time of the task, use it instead and say so. A temporary limit gets a renewal row in the `docs/operations.md` calendar with its expiry date.
   - Labels: `needs-human`, `translation-needed`, `incident`, `upgrade`, `maintenance`, `roadmap` (keep GitHub's defaults).
   - Environments `production`, `preview`, and `smoke`, each with a deployment branch policy "Selected branches" containing only the branch rule `main` (no tag rule), no secrets yet, no required reviewers.
   - App installations: `januslin-agent` and `januslin-reviewer` installed on `januswtlin` with this repository only; the archive deselected. `januslin-platform` is not installed here (T02 deletes it).
3. After T01-H2 and T01-H3, verify from the `agent` account and record (with T01-H4):
   - Each App's installation token lists exactly this repository (`GET /installation/repositories`) with the permissions in ADR-0009.
   - V1 (Apps): this task's PR is opened by `januslin-agent[bot]` while PR creation is limited to collaborators, and `januslin-reviewer[bot]` can post a review on it.
   - V2: `git push origin HEAD:main` as `januslin-agent[bot]` is refused; `gh pr merge` as `januslin-agent[bot]` and `januslin-reviewer[bot]` is refused; the author's direct push of a no-op commit to `main` from their own clone is refused (the author runs it); the author's merge of this PR succeeds; enabling auto-merge on a PR is unavailable. The machine account part of V2 is checked in T02 (it is not a collaborator yet); the deploy-key part is V12.
   - V4: a signed-in non-collaborator cannot comment on an issue or PR, open an issue or PR, or react. The author checks with a second GitHub account that is not a collaborator (not the machine account, which is one); without such an account, `GET /repos/januswtlin/januslin.me/interaction-limits` shows `collaborators_only` with its expiry, and the PR records that the live test is pending. Also confirm that the two Apps still open PRs and post reviews with the limit on (V1). If either App, Renovate, or `github-actions[bot]` is blocked by the limit, stop with `needs-human`: the requirement and the agent design conflict, the author decides, and ADR-0012 records the outcome.
   - The settings as applied (`gh api repos/januswtlin/januslin.me`, `.../rulesets`, `.../environments`), outputs in the PR.
4. Docs: `docs/infra-current-state.md` (current state, V1 for the Apps, V2, V4, change log), and any correction to `docs/security.md` or `docs/deployment.md` if a setting works differently from what they say.

## Out of scope
The machine account, App transfer, and porting the agent scripts (T02). The `ci` required check (T16). Workflows of any kind.

## Human steps

Only the author can do these. The agent prepares each one with the exact values before it is needed and waits for the reply. Never paste a secret into a chat; where a secret is involved, the step stores it directly.

- **T01-H1, right after the push that creates `main` (`git push <remote for januswtlin/januslin.me> fresh-main:main`), before anything else (5 min).** Signed in as `januswtlin` at `https://github.com/januswtlin/januslin.me`:
  1. Settings → Moderation options → Interaction limits → "Limit to repository collaborators" → 6 months.
  2. Settings → General: limit pull request creation to collaborators, and limit issue creation to collaborators if GitHub offers that option (the interaction limit in step 1 already blocks issues from non-collaborators).
  3. Settings → General → Pull Requests: uncheck "Allow auto-merge".
  Send the agent: "T01-H1 done" and the interaction-limit expiry date GitHub shows.
- **T01-H2, apply the settings (20 min).** Read the `gh api` commands the agent sends (settings, the rulesets `main-protect` and `main-restrict-updates`, labels, environments `production`, `preview`, `smoke`), then run them in your own Terminal account (or click the same in Settings). Send the agent: the output of each command.
- **T01-H3, install the two Apps here (5 min).** For each of `januslin-agent` and `januslin-reviewer`: GitHub → Settings → Applications → Installed GitHub Apps → the App → Configure → Repository access: "Only select repositories" → select `januswtlin/januslin.me`, deselect `januslin.me-archive` → Save. Send the agent: "T01-H3 done".
- **T01-H4, verification (10 min).** In your own clone, make a no-op commit and run `git push origin HEAD:main`; it must be refused (send the message). Merge T01's PR when the agent reports it ready. If you have a second GitHub account that is not a collaborator, try to comment on an issue and react to one with it, and send what happened (V4).

## Acceptance criteria
- [ ] `gh api repos/januswtlin/januslin.me --jq .visibility` is `public`, and the settings above match (API output in the PR; manual).
- [ ] Both rulesets exist as specified: `main-protect` with no bypass actors, `main-restrict-updates` with the repository admin role as the only bypass actor in pull-request-only mode (API output; manual).
- [ ] V2 evidence: the App's push and merge to `main` are refused with GitHub's messages; the author's direct push is refused; the author's merge works (manual).
- [ ] Each App's installation lists exactly `januswtlin/januslin.me` (manual).
- [ ] The three environments exist with the `main`-only branch policy and no secrets (manual).
- [ ] Non-collaborators cannot comment or open issues or PRs (reactions recorded as V4 found): the interaction limit (or a permanent equivalent) is set, and its expiry is on the operations calendar if it has one (API output; manual).
- [ ] V1 (Apps), V2, and V4 are recorded in `docs/infra-current-state.md` with dates.
- [ ] The `agent` account's clone of this repository has the config in `docs/agents/local-agent-account.md` (`git config --local --list`, without values that are secrets; there are none).

## Automated verification
- None: no Node project exists yet, and everything here is GitHub configuration. All criteria are manual with command output in the PR.
