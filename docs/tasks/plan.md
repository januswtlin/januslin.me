# Task plan

> **First, right after pushing the initial commit:** the new public repository has default settings until you lock it. Do **T01-H1** immediately (interaction limit to collaborators only, PR and issue creation limited to collaborators, auto-merge off). Steps in `T01-repo-settings-and-ruleset.md` → "Human steps".

Who does what next, in order: each task lists the author's steps (`Txx-Hn`, defined in that task file's "Human steps" section) and the agent's work together. Status, dependencies, and PR links live only in the board in `README.md`. Every task ends the same way: the agent opens a PR, a separate reviewer approves it, and you merge it.

## How to pick the next task

- **Dependencies are the constraint; this order is the preference.** A task is startable by the rule in `README.md`.
- **Next task:** the first startable task in the order below, reading phases top to bottom. With room for more than one, take the next startable ones in order, as far as "Parallelism" allows.
- A later task may start while an earlier phase is unfinished, when it is startable and nothing earlier is.
- The agent prepares each human step with exact values before it is needed and waits for the author's reply on that step only.
- **Adding a task:** the next free ID (IDs are never reused or renumbered), a row in `README.md`, a task file (with its human steps, if any), and a place here after every task it depends on. **Reordering:** a coordinator docs PR that changes this file; the author approves it by merging.
- From T08, `pnpm tasks` prints the next task with its open human steps, and `pnpm tasks --check` fails when this file, the board, and the task files disagree.

## Phase 0: Repository and identity
Protect `main` first, then give the machine account Write, then move local AI into the sandbox.
1. T01 Repository settings, `main` rulesets, App installations. You: T01-H1 right after the push. Agent: re-clones in `agent` and prepares the settings commands. You: T01-H2 (apply them), T01-H3 (install the Apps here). Agent: verifies and opens the PR. You: T01-H4 (verification pushes), merge.
2. T02 Machine account, App transfer, agent scripts. You: T02-H1 (secure the machine account), T02-H2 (delete the `januslin-platform` App). Agent: records the two Apps before the transfer. You: T02-H3 (public, transfer), T02-H4 (new keys), T02-H5 (Workflows permission for `januslin-agent`), T02-H6 (collaborator). Agent: rechecks, ports the scripts and tests, opens the PR. You: T02-H7 (V2 as the machine account), merge, then T02-H8 (archive the old repo).
3. T03 Sandbox runtime and token broker. You: T03-H1 (install `sbx`), T03-H2 (Docker login, network policy). Agent (still in the host shell, the last time): writes the broker, creates the sandbox, runs the canary and the other checks, opens the PR. You: merge, then T03-H3 (remove AI from the host), T03-H4 (rotate the App keys), T03-H5 (start the broker and the sandbox). From here on, every local agent runs in the sandbox.
4. T04 Coordinator Slack channel, config outside the repo. Agent (in the sandbox): checks the host has no AI CLI left, ports the script and tests. You: T04-H2 (config file and Slack secret on the host). Agent: posts a test. You: T04-H1 (reply from the phone), T04-H3 (rotate the Slack token), merge.

## Phase 1: Agent tooling
Every login changes here, so later tasks run on the final setup. Claude before Codex.
0. T21 Claude login in the sandbox (added 2026-10-30, after T05-H5 failed). You: T21-H1 (inspect the kit), T21-H2 (credential binding, `/login`, checks). Agent (a cloud session, because the sandbox could not log in): records the finding, opens the PR. You: merge.
1. T05 Claude Code in the sandbox and in the cloud. You: T05-H1 to T05-H3 (connectors, Claude App scope, connection check). Agent: checks each. You: T05-H4 (allow Remote Control in the sandbox), T05-H5 (`/login` inside the sandbox), T05-H6 (cloud environment), T05-H7 (phone checks). Agent: records V6, V7, V20, V21, V24, opens the PR. You: merge.
2. T06 Codex in the sandbox and in the cloud. You: T06-H1 to T06-H3. Agent: checks each, installs Codex in the sandbox. You: T06-H4 (`sbx secret set openai --oauth` in the host shell), T06-H7 (save the sandbox as a template), T06-H5 (cloud environment), T06-H6 (phone checks). Agent: builds the dispatch script, runs the end-to-end Claude-to-Codex dispatch and review (V30), records V8, V10, V22, V28, V29, opens the PR. You: merge.

## Phase 2: Site
1. T07 Bootstrap the Node project and `pnpm verify`. Agent only. You: merge.
2. T08 `pnpm tasks`. Agent only. You: merge.
3. T09 Vendor Retypeset, upgrade to Astro 7. Agent: imports and strips the theme, builds the tests. You: T09-H1 (asset licenses, look), merge.
4. T10 Content layer. Agent only. You: merge.
5. T14 Worker, wrangler config, headers. You: T14-H1 (short-lived token). Agent: builds the Worker, verifies the token scopes with a test upload. You: T14-H3 (revoke the short-lived token); after the agent reports the verified scopes, T14-H2 (create and store the deploy token); merge.
6. T11 Routing, topic hubs, tags, i18n UI. Agent only. You: merge.
7. T15 Cloudflare Access for previews. You: T15-H1 (ops token, Zero Trust). Agent: configures Access. You: T15-H2 (service token), T15-H3 (revoke), merge.
8. T12 Images, rich content, search. Agent: builds it. You: T12-H1 (the photo Shortcut on a real photo), merge.
9. T13 SEO and AEO outputs. Agent only. You: merge.
10. T16 CI, previews, production deploy. Agent: writes the workflows. You: review the workflow diff closely (CODEOWNERS), merge the workflows PR (first production deploy), then T16-H1 (require `ci`). Agent: verification PR. You: T16-H2 (forced rollback, V3), merge.

## Phase 3: Launch
1. T17 Cutover and go-live. You: T17-H2 (About page, hub introductions, window), T17-H3 (email records), T17-H1 (ops token). Agent: cutover. You: merge the routes PR, T17-H4 (search consoles), T17-H5 (remove the smoke token), after 48 h T17-H6 (archive the Hugo repo), merge.
2. T18 Post-launch independent audit. Agent: audits. You: T18-H1 (settings screenshots), merge the report.

## Phase 4: Automation
1. T19 Renovate, maintenance tooling, missing-English check. You: T19-H1 (install Renovate). Agent: builds the tooling and workflows. You: merge the onboarding PR, review the workflow diffs, merge the task PR.
2. T20 Scheduled agent tasks and prompt files. Agent: writes the prompt files and the task table. You: merge, T20-H1 (create the tasks), T20-H2 (throwaway test).

Not tied to a task (Working Copy per device, reviewing and merging PRs, `needs-human` answers): `docs/operations.md` → "Author's recurring steps".

## Dependencies

Read as "task ← what it waits for". The board in `README.md` is the source; `pnpm tasks --check` keeps the two equal.

```
T01
T02                  ← T01
T03                  ← T02
T04                  ← T03
T05                  ← T03, T21
T06                  ← T05
T07                  ← T04, T06
T08                  ← T07
T09                  ← T08
T10                  ← T09
T11                  ← T10
T12                  ← T11
T13                  ← T11
T14                  ← T09
T15                  ← T14
T16                  ← T10, T14, T15
T17                  ← T12, T13, T16
T18                  ← T17
T19                  ← T16
T20                  ← T05, T16, T19
T21                  ← T03
```

## Parallelism

- **Phases 0 and 1 run one task at a time.** They change the settings, identities, and logins every other task uses. T04 may run alongside T05 only if T05 is waiting on the author and T04 touches no file T05 touches.
- **Phase 2**, after T09 merges, has two streams that do not edit the same files:
  - Site: T10 → T11 → T12 and T13 (T12 and T13 may run in parallel; both edit `astro.config.ts`, so the second to merge merges `main` and is re-reviewed).
  - Platform: T14 → T15, then T16 once T10 is merged.
- Shared files across streams: `package.json` scripts, the lockfile, `docs/tasks/README.md`, and snapshot baselines (the second PR to merge regenerates its baselines after merging `main`, says why, and is re-reviewed). Open PRs merge `main` after each merge.
- No stacked PRs: a task starts only after every dependency is merged, from `main` at that point.

## Ordering notes (2026-10-29)

- Fresh start in a public repository (ADR-0012). The archive keeps the old board. Old to new task IDs:

  | Old (archive) | New | Note |
  |---|---|---|
  | T00 Bootstrap the repository | T01 (settings, ruleset), T07 (scaffolding) | Split |
  | T16 Agent GitHub Apps and `agent` account | T01, T02 | Account and Apps exist; re-pointed and ported |
  | T17 Slack channel | T04 | IDs move out of the repo; runs in the sandbox |
  | (new) | T03 | Sandbox runtime and token broker (ADR-0013) |
  | T18 Machine account | T02 | |
  | T19 Claude Code local and cloud | T05 | |
  | T20 Codex local and cloud | T06 | |
  | T21 `pnpm tasks` | T08 | |
  | T01 Vendor Retypeset | T09 | Redone, original design kept |
  | T02 Content layer | T10 | |
  | T03 Routing and i18n | T11 | |
  | T04 Typography specimen and CJK fonts | dropped | Roadmap R11; font budget moved to T09 |
  | T05 Images, rich content, search | T12 | |
  | T06 SEO and AEO outputs | T13 | |
  | T07 Worker hosting | T14 | |
  | T10 Access for previews | T15 | |
  | T08 CI/CD | T16 | Without the GitHub-Free controls |
  | T11 Cutover | T17 | |
  | T13 Post-launch audit | T18 | |
  | T12 Renovate and maintenance | T19 | Adds the Retypeset upstream watch and the missing-English check |
  | T14 Scheduled agent tasks | T20 | |
  | T15 Translation queue | dropped | The author writes English; T19 opens issues for missing versions |
  | T09 Sveltia CMS | not carried | Dropped in the archive already |
- T01 comes before T02 so the `main` ruleset exists before the machine account becomes a Write collaborator.
- Phase 1 comes after the sandbox (T03), so the full tool logins are made inside it, and before site work because Claude Code's quota alone is not enough and the author supervises from the phone (ADR-0009).
- T08 comes right after T07, because `pnpm tasks` needs a Node project and the plan should be checked before it grows.
- T15 (Access) comes before T16 because preview URLs are public by default and previews include `draft: true` entries.
- The first attempt's CJK font specimen task is dropped while Retypeset's original design is kept (ADR-0001, roadmap R11).
