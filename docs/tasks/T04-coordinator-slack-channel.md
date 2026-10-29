# T04: Coordinator Slack channel, config outside the repo

- Role: Platform Engineer
- Depends on: T03 · Human steps: T04-H1, T04-H2, T04-H3
- Identity: app (`januslin-agent[bot]`)
- Branch: `agent/platform/T04-slack-channel`
- Size: S

## Goal
The coordinator can post to `#januslin-me`, take the author's replies as instructions, and notice the author's merges, with no Slack ID in the public repository (ADR-0011).

## Read first
ADR-0011, ADR-0013, ADR-0009, `docs/agents/sandbox.md` (Credentials), `docs/agents/local-agent-account.md` ("Slack control channel"), `docs/agents/workflow.md` ("Coordinator loop"). The archive's `scripts/coordinator-channel.sh`, `scripts/coordinator-channel.conf`, and `tests/scripts/coordinator-channel/`. Slack API docs: `chat.postMessage`, `conversations.history`, `conversations.replies`, `reactions.add`, rate limits.

## Scope
- First, before anything else: ask the author for `command -v claude codex` in the host shell (T03-H3 left nothing there) and record it.
- Port `scripts/coordinator-channel.sh` and its tests from the archive, reviewed again. Change: the channel ID and the author's Slack member ID are read from `coordinator-channel.conf` in the read-only config directory mounted into the sandbox (`~/.config/januslin-agent/sandbox-config/` on the host; path overridable for tests), parsed as `KEY=VALUE` lines, never sourced. The author's GitHub id (2433928) and `januswtlin/januslin.me` are constants in the script. A missing or malformed config file fails with a clear message.
- The author writes that config file on the host (T04-H2); the agent in the sandbox cannot write host files. Tell the author the two values from the archive's `scripts/coordinator-channel.conf` (they are not secrets). The script runs inside the sandbox; the bot token reaches it through the proxy (`sbx secret set-custom --host slack.com --env SLACK_BOT_TOKEN`, V23), so the script sends `Authorization: Bearer $SLACK_BOT_TOKEN` and never reads a token file there. If V23 fails, the fallback is a token copy that the author puts in the read-only `sandbox-config/` directory, read through `curl` stdin as in the archive. No Slack ID appears in this repository, its history, or the PR.
- Merge check: every new commit on `main` since the last verified head is the squash commit of a PR (`GET /commits/{sha}/pulls`, `merge_commit_sha` equal to it) with `merged_by.id == 2433928`, otherwise `"suspicious": true`. The repository is squash-only with linear history, so there are no merge commits; adapt the archive's check. The first run records the current head (at least the initial commit) as the baseline.
- Tests (fake `curl` and `gh`, recorded responses), run by `tests/scripts/run.sh`: everything the archive's tests covered (author replies found; bot, other users, already-reacted, `channel_join`, and `bot_id` messages ignored; replies in threads started by either side; merge by the author reported, by a bot or a direct push suspicious; first run reports nothing historical; `--max` exits 2; hostile text round-trips as JSON and runs nothing; no token in output or arguments), plus: the config file is read, a missing one fails, and a config line like `CHANNEL_ID=$(touch canary)` is not executed.
- Live check with the author (T04-H1): `post`, a reply from the phone, `wait`, `react`, `wait` again.
- After the live check, the author rotates the Slack bot token (T04-H3), because AI ran in the host account where it was stored until T03.
- Docs: `docs/agents/sandbox.md` and `docs/agents/local-agent-account.md` if the interface differs; V23 in `docs/infra-current-state.md` change log.

## Out of scope
Inbound endpoints (Events API, slash commands). CI notifications.

## Human steps

- **T04-H1, live check (5 min).** When the agent says it posted "test" to `#januslin-me`, reply in that thread from Slack on your phone. Send nothing else; the agent reports what it received.
- **T04-H2, config and secret on the host (5 min), before T04-H1.** In `agent-session`: `( umask 077; mkdir -p ~/.config/januslin-agent/sandbox-config && printf 'CHANNEL_ID=%s\nAUTHOR_USER_ID=%s\n' <channel id> <your member id> > ~/.config/januslin-agent/sandbox-config/coordinator-channel.conf )` with the values the agent sends, then `sbx secret set-custom --sandbox januslin --host slack.com --env SLACK_BOT_TOKEN --command 'cat /Users/Agent/.config/januslin-agent/slack-bot-token'`. Send "T04-H2 done".
- **T04-H3, rotate the Slack bot token (5 min), after T04-H1.** api.slack.com/apps → `januslin-coordinator` → OAuth & Permissions → rotate or reinstall; store the new token as in `docs/agents/local-agent-account.md` → "Slack control channel" (Rotation). The secret command reads the file, so nothing else changes. Send "rotated".

## Acceptance criteria
- [ ] The tests pass, and each new case is shown to fail on a deliberate break (output in the PR).
- [ ] `git grep` on this branch finds neither Slack ID (count only, no values), and the PR description has none.
- [ ] Live check: a reply from the phone is reported within two intervals and not again after `react`; a bot message is never reported as an instruction (manual).
- [ ] No token value in the repository or transcripts (counts only).

## Automated verification
- The script tests in `tests/scripts/`, run by `pnpm test` once T07 wires it.
- Manual: the live check.
