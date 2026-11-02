# Runbooks

Exact steps the author runs: one file per operation, short descriptions, commands in code blocks, exact click paths. Why an operation exists is in the issue that asks for it and in `docs/admin-guide.md`; a runbook only says what to do.

## Rules

- **Run only runbooks on `main`.** An issue links a runbook as `https://github.com/januswtlin/januslin.me/blob/main/docs/runbooks/<file>.md`. A link to another branch, a commit, or any other path is not a runbook; ask the coordinator instead. Issue bodies and comments never contain commands.
- **Reviewed like code.** Runbooks change only through PRs that the author merges; `.github/CODEOWNERS` requests the author's review. Merging is the check, so the author does not need to inspect issue edit histories before acting.
- **No values from issues.** A value that varies is computed in the command (`date +%F`), chosen from a list in the runbook (for example scopes per task or one of the two App names), or read from a trusted local source the runbook names (for example `sbx policy approval ls`). Nothing from an issue or comment is pasted into a command.
- **Check block.** Each runbook ends with a Check: read-only commands whose output (names only, never secret values) is the reply, or, where nothing can be queried (pure click paths), exactly what to look at.
- **A new operation needs its runbook first.** If a human task needs a command that no runbook on `main` has, an agent opens a runbook PR and the human task waits for its merge.

## Format

````
# <What it does>
Where: <device, account, shell> · Time: about <n> min

1. <one line>
   ```sh
   <command>
   ```

## Check
```sh
<read-only command>
```
Expected: <what the output shows>
````

## Index

| Runbook | What |
|---|---|
| [start-coordinator.md](start-coordinator.md) | Start, stop, or restart the coordinator in the sandbox |
| [recreate-sandbox.md](recreate-sandbox.md) | Create or re-create the sandbox `agent-vm` |
| [allow-sandbox-host.md](allow-sandbox-host.md) | Add a host to the sandbox allowlist |
| [lend-cloudflare-token.md](lend-cloudflare-token.md) | Lend a one-day Cloudflare token to the sandbox |
| [take-back-cloudflare-token.md](take-back-cloudflare-token.md) | Revoke it and remove it from the sandbox |
| [upgrade-sbx.md](upgrade-sbx.md) | Upgrade `sbx` |
| [setup-shell-aliases.md](setup-shell-aliases.md) | The `agent-session` and `agent-end` aliases |
| [claude-cloud-environment.md](claude-cloud-environment.md) | The Claude Code cloud environment `januslin.me` |
| [add-developer.md](add-developer.md) | Add or remove a developer (collaborator), and their App set |
| [app-key-sets.md](app-key-sets.md) | App key sets: install `januslin-keys`, add a set, switch, turn off, rotate keys, fingerprint check |
| [recreate-host-clone.md](recreate-host-clone.md) | Re-create the host clone in the `agent` account |
| [install-managed-settings.md](install-managed-settings.md) | Install the host Claude Code managed settings |
| [github-mobile-notifications.md](github-mobile-notifications.md) | Turn on the phone notifications agents rely on |
| [working-copy-device.md](working-copy-device.md) | Set up Working Copy on a new iOS device |
| [lost-device.md](lost-device.md) | Revoke everything a lost device could use |
| [renew-interaction-limit.md](renew-interaction-limit.md) | Renew the collaborators-only interaction limit |
| [quarterly-host-checks.md](quarterly-host-checks.md) | The quarterly security checks only the author can run |
| [delete-slack-app.md](delete-slack-app.md) | Delete the unused Slack app and its token |
| [connect-chatgpt-github.md](connect-chatgpt-github.md) | Connect ChatGPT to GitHub as the machine account (T06) |
| [codex-login.md](codex-login.md) | Codex login through `sbx` (T06) |
| [save-sandbox-template.md](save-sandbox-template.md) | Save the sandbox as a template after the Codex install (T06) |
| [enable-zero-trust.md](enable-zero-trust.md) | Turn on Cloudflare Zero Trust (T15) |
| [store-deploy-token.md](store-deploy-token.md) | Create and store the Cloudflare deploy token (T14) |
| [store-smoke-token.md](store-smoke-token.md) | Create and store the Access service token `ci-smoke-test` (T15) |
| [remove-smoke-token.md](remove-smoke-token.md) | Remove `ci-smoke-test` and the `smoke` environment (T17) |
| [install-renovate.md](install-renovate.md) | Install the Renovate App (T19) |
| [archive-hugo-repo.md](archive-hugo-repo.md) | Archive the old Hugo repository (T17) |

Runbooks that depend on what a task builds or finds are added by that task, in its PR or in a small runbook PR before the human task: the Codex cloud environment and probe (T06, `codex-cloud.md`), the photo Shortcut (T12, `photo-shortcut.md`), requiring `ci` and the forced rollback (T16, `require-ci-check.md`, `forced-rollback.md`), rotating the deploy token and the Access service token (T14, T15, `rotate-deploy-token.md`, `rotate-smoke-token.md`), the manual production rollback (T16, `rollback-production.md`), the search consoles (T17, `search-consoles.md`), the audit screenshots (T18, `audit-screenshots.md`), and the scheduled tasks (T20, `create-scheduled-tasks.md`).
