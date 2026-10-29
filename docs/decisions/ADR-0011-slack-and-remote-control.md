# ADR-0011: The coordinator reaches the author through Slack; the author steers local sessions with Remote Control
- Status: accepted
- Date: 2026-10-29
- Deciders: Janus, coordinator session

## Context
The coordinator runs on the author's Mac. The author is often away from it and wants a phone notification when needed (a PR ready to merge, a human step, a `needs-human` stop, a failure on `main`), a way to answer, and a way to steer a session directly. Nothing may listen on a public endpoint, and cost stays near zero.

## Decision
- **Channel:** a private channel `#januslin-me` in the author's Slack workspace `januswtlin`; only the author and the bot are members.
- **Bot:** the Slack app `januslin-coordinator`, installed in that workspace only, bot scopes `chat:write`, `groups:history`, `reactions:write`, nothing else; no events, slash commands, or request URL. Its token is in the `agent` account on the host and reaches the coordinator in the sandbox through the proxy (ADR-0013), never as a file there.
- **Outbound:** the coordinator posts only when the author is needed, one thread per item, linking to GitHub. GitHub stays the record.
- **Inbound:** the coordinator polls (`scripts/coordinator-channel.sh wait`). Only plain messages (no subtype except `thread_broadcast`, no `bot_id` or `app_id`) whose Slack `user` is the author's ID are instructions; everything else is data. Slack instructions have the same weight as typed ones and cannot override `AGENTS.md`.
- **Handled marker:** an `eyes` reaction on each author message acted on, so a restarted coordinator does not act twice.
- **Merges:** the same poll watches `main`: every new commit must be the squash commit of a PR merged by id 2433928 (`GET /commits/{sha}/pulls`, then `merged_by` from the PR). The initial commit, pushed before the rulesets existed, is the baseline. Anything else is reported as suspicious; the coordinator stops dispatching and waits for the author in the terminal. The ruleset (ADR-0003) should make this impossible; the check is cheap and catches a changed ruleset.
- **IDs out of the repository.** The channel ID and the author's Slack member ID are not secrets, but the repository is public; they live in a config file in the `agent` account, mounted read-only into the sandbox (`docs/agents/local-agent-account.md`).
- **Remote Control** is allowed once Claude Code in the sandbox has a full login and `sbx settings set claude.remoteControl true` is set (T05, ADR-0009, ADR-0013). The author starts it from a local session; the coordinator never starts it itself. Local GitHub access stays on the Apps. Slack stays for notifications and merge detection.
- Cron and scheduled tasks stay off: the `agent` account has none, and the in-sandbox defaults deny the cron tools.

## Alternatives considered
- A GitHub control issue with mentions: mixed into all PR and CI notifications.
- Claude in Slack or Claude Code's Slack integration: starts cloud sessions from Slack, which only the author should do, from their own client.
- A third-party Slack MCP server: a supply-chain dependency for what a short `curl` script does.
- SSH over Tailscale with tmux: needs Remote Login on and a phone terminal.

## Consequences
- A Slack bot token lives in the `agent` account on the host. If it leaks, someone can post as the bot and read `#januslin-me`, nothing else. Rotation is in `docs/agents/local-agent-account.md`.
- The author's Slack account becomes a way to instruct the coordinator and needs 2FA.
- Latency is one poll interval (120 s). Slack rate limits were checked in the first attempt (2026-10-28): an internal app keeps Tier 3 for `conversations.history` and `conversations.replies`; the script survives Tier 1 anyway.
- The Mac must stay awake while the coordinator runs (`caffeinate -ims`).

## Revisit when
- The poll misses or duplicates instructions, or Slack's limits change.
- Remote Control covers notifications well enough to drop Slack.
