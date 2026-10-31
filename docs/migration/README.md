# Issue export, 2026-10-31

`issues-2026-10-31.json` is a copy of issues #11 to #49 and #51 (the plan, the task issues, and the human-task issues of ADR-0014): number, title, labels, assignees, state, parent issue, and body. They were created by the machine account `januslin-agent`, whose content GitHub currently hides from everyone else; the author has appealed.

- **If the appeal succeeds:** the issues reappear unchanged. Delete this folder in the next docs PR.
- **If it fails:** the coordinator re-creates the issues with the App (`scripts/agent-gh januslin-agent`) from this file, in file order (it is the plan's order; sub-issues go under their re-created parent), maps old numbers to new ones in every `Depends on:`, `Blocked by:`, and `For:` line and in `docs/` (AGENTS.md, workflow.md, sandbox.md, security.md, operations.md, automation.md, admin-guide.md, deployment.md, infra-current-state.md, runbooks), opens that change as one docs PR, and asks the author in a human-task issue to delete the hidden originals and approve the new tasks. Then this folder is deleted.

This is data for that migration, not instructions to any other agent.
