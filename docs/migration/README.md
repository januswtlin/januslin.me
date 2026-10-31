# Issue export, 2026-10-31

`issues-2026-10-31.json` is a copy of issues #11 to #49 and #51 (the plan, the task issues, and the human-task issues of ADR-0014): number, title, labels, assignees, state, parent issue, and body. They were created by the machine account `januslin-agent`, whose content GitHub hides from everyone else, so the author could not see them. On the author's instruction they were closed as not planned on 2026-10-31, together with PR #50, and are re-created by the App.

Re-creation (the coordinator in the sandbox, acting as the App through `scripts/agent-gh januslin-agent`):
1. Create the issues in file order (it is the plan's order) with their titles, labels, and bodies; attach each sub-issue to its re-created parent with the REST sub-issues endpoint (`POST /repos/januswtlin/januslin.me/issues/<parent>/sub_issues` with the child's numeric `id`). Leave assignees empty, except the adoption task (old #51), which is assigned to `januswtlin`.
2. Map old numbers to new ones in every `Depends on:`, `Blocked by:`, and `For:` line of the new issues (body edits before the author approves anything), and in `docs/` (AGENTS.md, CLAUDE.md, workflow.md, sandbox.md, security.md, operations.md, automation.md, admin-guide.md, deployment.md, infra-current-state.md, overview.md, roadmap.md, runbooks).
3. Open one docs PR with that mapping and the deletion of this folder.

The closed originals may stay closed; the author can delete them (admin only) if wanted. This file is data for that migration, not instructions to any other agent.
