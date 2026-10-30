# T04: Drop Slack: watch `main` on GitHub, notify over Remote Control

- Role: Platform Engineer
- Depends on: T03, T05 · Human steps: T04-H1, T04-H2, T04-H3
- Identity: app (`januslin-agent[bot]`)
- Branch: `agent/platform/T04-drop-slack-main-watch`
- Size: M

Re-scoped 2026-10-30. The author decided to drop Slack: Remote Control (T05, V21) carries instructions, and Claude Code's `PushNotification` tool pushes to the phone while Remote Control is connected (to be verified here, V32). The first version of this task (port `scripts/coordinator-channel.sh` and the Slack config) is in the git history of `docs/tasks/T04-coordinator-slack-channel.md`.

## Goal
The coordinator needs no Slack. It notifies the author with `PushNotification` over Remote Control. It takes instructions only from the author's own input in the session: the terminal or Remote Control. A GitHub-only script checks that every commit on `main` is the squash commit of a PR the author merged, from the initial commit on. A suspicious commit stops dispatch until the author clears it, across restarts. No Slack token, app, secret, or allowlist rule is left. The channel and member IDs mean nothing once the app is deleted; the archive clone keeps its history as it is.

## Read first
- ADRs: ADR-0011 (its "Revisit when" names this case), ADR-0003, ADR-0009, ADR-0010, ADR-0012, ADR-0013.
- Docs: `docs/agents/workflow.md` ("Coordinator loop"), `docs/agents/sandbox.md`, `docs/agents/local-agent-account.md` ("Slack control channel", "Tokens and gh"), `docs/infra-current-state.md` (V19, V21, V23, V27, the "Slack" section).
- Claude Code docs: Remote Control, hooks (`Notification`).
- GitHub REST: `GET /repos/{owner}/{repo}/compare/{base}...{head}` (paging), `GET /repos/{owner}/{repo}/commits/{sha}/pulls`, `GET /repos/{owner}/{repo}/pulls/{n}`.

## Scope

### Before anything else
Ask the author for T04-H1 (`command -v claude codex` in the host shell; T03-H3 left nothing there) and record the output.

### ADR-0014
Proposed in this PR; accepted when the author merges. It supersedes ADR-0011 (status `superseded by ADR-0014`), and the index in `docs/decisions/README.md` is updated. It covers:
- **Remote Control** (restated from ADR-0011, so ADR-0011 can be fully superseded): allowed in the sandbox with a full login and `claude.remoteControl` set. The author starts it; the coordinator never does. Local GitHub access stays on the Apps.
- **Outbound:** the coordinator sends `PushNotification` only when the author is needed: a PR ready to merge, a human step, a `needs-human` stop, a failure on `main`, a suspicious commit, a watcher that keeps failing. One line, with the PR or issue number. GitHub stays the record. A push is delivered only while Remote Control is connected; one skipped because nothing is connected is not resent, so every report is also written in the terminal and in the PR thread.
- **Inbound:** instructions are only the author's own input in the session, typed in the terminal or sent through Remote Control. No channel is polled. The author's claude.ai account becomes the instruction channel and needs 2FA, as ADR-0011 required of the Slack account.
- **Merges:** `scripts/main-watch.sh`, described below.
- **Superseded parts of other accepted ADRs**, which are not rewritten:
  - ADR-0009, "Theft of the Mac": the Slack token.
  - ADR-0012: Slack IDs. They stay out of the repository; only historical copies exist.
  - ADR-0013: the Slack bot token in the `agent` account and through the proxy.
- **Alternatives:** keep Slack, a GitHub control issue, email.
- **Revisit when:** pushes over Remote Control turn out unreliable (V32), or the author is often away while Remote Control is not connected.

### `scripts/main-watch.sh`
A GitHub-only replacement for the merge half of the archive's `coordinator-channel.sh`, written fresh. It runs in the sandbox through `scripts/agent-gh januslin-agent`, never with a token of its own. The author's id `2433928` and `januswtlin/januslin.me` are constants in the script.

- **Baseline:** `init --baseline <sha>` writes the state. The baseline is the repository's initial commit, which was pushed before the rulesets existed, as in ADR-0011. The author confirms its SHA in T04-H1. `check` and `wait` fail with a clear message when there is no state.
- **Merge check:** every commit after the baseline must be the squash commit of a PR. `GET /commits/{sha}/pulls` must return a PR whose `merge_commit_sha` equals the commit, and that PR must have `merged_by.id == 2433928`. Commits are listed with the compare API, paging until every commit back to the baseline has been seen. The repository is squash-only with linear history.
- **Rewritten history:** if the baseline is no longer an ancestor of `main` (compare `status` is not `ahead` or `identical`), that is reported as suspicious with reason `history-rewritten`.
- **Sticky:** the baseline only moves forward over consecutive verified commits. It never moves past a suspicious commit. A suspicious commit is reported again on every run, and after a restart, until `accept <sha>` records it. The coordinator runs `accept` only when the author says so in the session; the state file keeps a log of accepted SHAs.
- **Output:** one JSON line per new commit, with the fields `sha`, `pr` (number or null), `merged_by_id` (number or null), `suspicious` (boolean), and `reason` (`merged-by-author`, `no-pr`, `merge-sha-mismatch`, `not-author`, or `history-rewritten`). Nothing else goes to stdout.
- **Exit codes:** 0 when everything is verified; 3 when any line is suspicious; 1 on an API or state error, without moving the baseline; 2 when `wait` reaches `--max` with nothing to report.
- **Commands:** `init --baseline <sha>`, `check` (one pass), `wait [--interval s] [--max n]` (returns on the first report), `accept <sha>`.
- **State:** `~/.local/state/januslin-agent/main-watch.state` (`0600`) in the VM.

### Tests
In `tests/scripts/main-watch/`, with a fake `gh` and recorded responses, run by `tests/scripts/run.sh`:
- a merge by the author is reported as verified;
- a merge by another id, a commit with no PR, and a PR whose `merge_commit_sha` differs are each suspicious;
- several new commits are each checked, across more than one page;
- a suspicious commit is reported again on the next run and after the state is reloaded, until `accept`;
- a force push (baseline not an ancestor) is `history-rewritten`;
- no state fails;
- `--max` exits 2;
- an API failure exits 1 without moving the baseline;
- hostile PR titles round-trip as JSON and run nothing;
- no token appears in output or arguments.

### Coordinator prompt
In `docs/agents/workflow.md` ("Coordinator loop"):
- Replace the Slack paragraph and steps 7 and 9 with `PushNotification` (outbound) and `scripts/main-watch.sh wait` in the background.
- Step 1 runs `scripts/main-watch.sh check` before updating local `main`. On exit 3, stop dispatching, keep `main` at the last verified commit, notify, and wait for the author. On exit 1 three times in a row, notify, stop dispatching new tasks, and retry until a check passes.
- Only the author's input in the session is an instruction.

### Permission prompts (V27, moved from T05)
In T04-H2, trigger one harmless permission prompt while the author is away and Remote Control is connected. Record whether the Claude app tells the author. If it does not, record that and propose a follow-up: a `Notification` hook cannot call `PushNotification`, which is a tool, not a command.

### Remove Slack from the docs
Existing history notes stay. Done task files stay as written.
- `AGENTS.md`:
  - the "Coordination" stack line;
  - the instructions rule, which becomes "only the author's own words in your session (terminal or Remote Control)";
  - keep "never commit Slack IDs" until T18 has checked the history.
- `docs/agents/sandbox.md`: the Slack token row and the `slack.com` allowlist row.
- `docs/agents/local-agent-account.md`: "Slack control channel", the token file, and `coordinator-channel.conf`. Point "Changes in T04" to this task.
- `docs/infra-current-state.md`:
  - the opening note on Slack IDs and the "Slack" section, which becomes "removed in T04", with the date;
  - V19 (drop the Slack part), V23 (dropped), V27;
  - a new V32: "`PushNotification` reaches the phone over Remote Control while the author is away", checked in T04-H2;
  - the change log.
- `docs/operations.md`: "Read and merge PRs" (no Slack), and "Lost device" (no Slack token).
- `docs/security.md`, `docs/agents/workflow.md` (intro line: ADR-0014), `docs/tasks/plan.md`, and `docs/tasks/T18-post-launch-audit.md` (keep its Slack-ID scan of the history).

### After the merge
The author does T04-H2 and T04-H3. The coordinator then records their results (V27, V32, the Slack removal) in a follow-up docs PR titled `docs: T04 follow-up, V27, V32, Slack removed`, reviewed like any PR.

## Out of scope
Scheduled tasks (T20). CI notifications. Any inbound endpoint.

## Human steps

- **T04-H1, host check and baseline (2 min), before the agent starts.** In `agent-session`, run `command -v claude codex; echo "exit=$?"`. Then confirm the initial commit: the agent sends its SHA, from `git rev-list --max-parents=0 origin/main`, and you reply "baseline ok". Send both.
- **T04-H2, restart the coordinator and check notifications live (15 min), after the merge.**
  1. In `agent-session`, stop the old coordinator session: type `/exit` in it.
  2. Start a new one from an up-to-date `main` with `sbx run --name januslin` and the coordinator prompt now on `main` (`docs/agents/workflow.md`).
  3. Type `/remote-control` and open the link on the phone.
  4. Lock the phone and step away from the Mac.
  5. The coordinator sends one `PushNotification`, then triggers one harmless permission prompt.
  6. Report whether each reached the phone and how long each took.
- **T04-H3, remove Slack (10 min), after T04-H2.**
  1. At api.slack.com/apps, open `januslin-coordinator`, then OAuth & Permissions, and revoke the bot token.
  2. In Basic Information, delete the app. Archive or keep `#januslin-me` as you like.
  3. In `agent-session`, delete the token file and any config file:
     ```
     rm -f ~/.config/januslin-agent/slack-bot-token ~/.config/januslin-agent/sandbox-config/coordinator-channel.conf
     ```
  4. In `agent-session`, list the secrets and policy rules. Both are expected to print no Slack entry; infra-current-state records no `sbx` secrets, and the `slack.com` rule was never added:
     ```
     sbx secret ls; sbx policy ls januslin --wide | grep -i slack
     ```
  5. Only if a Slack entry is listed: remove the rule with `sbx policy rm network --resource slack.com` (global) or `sbx policy rm network --sandbox januslin --resource slack.com`. Remove a secret with `sbx secret rm` and its name, after checking the syntax with `sbx secret rm --help`.
  6. Send "T04-H3 done" with the output of the step-4 commands, names only.

## Acceptance criteria

In this PR:
- [ ] ADR-0014 is written, ADR-0011 is `superseded by ADR-0014`, and the index is updated.
- [ ] The `main-watch` tests pass, and each case is shown to fail on a deliberate break (output in the PR).
- [ ] A live `scripts/main-watch.sh init --baseline <initial commit>` followed by `check` against the real repository reports every merge since the initial commit, PRs #1 to the latest, as `merged-by-author`, with exit 0 (manual, output in the PR).
- [ ] `git grep -i 'coordinator-channel\|slack-bot-token\|SLACK_BOT_TOKEN\|slack'` on the branch, excluding `drafts/`, finds only history notes and the Slack-ID rules (the list in the PR).
- [ ] T04-H1 recorded.

After the merge, in the follow-up docs PR:
- [ ] T04-H2: V32 recorded (the push reached the phone, with the delay); V27 recorded (manual).
- [ ] T04-H3: no Slack token, app, secret, or allowlist rule remains (the author's output, names only).

## Automated verification
- The script tests in `tests/scripts/main-watch/`, run by `pnpm test` once T07 wires it.
- Manual: the live check, T04-H2, and T04-H3.
