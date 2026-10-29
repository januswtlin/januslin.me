# CLAUDE.md

@AGENTS.md

`AGENTS.md` is the single source of truth for every agent, Claude or otherwise. Do not duplicate its content here; add Claude-specific notes only.

## Claude-specific notes

- When dispatched with a task ID, first read `AGENTS.md`, `docs/tasks/README.md`, `docs/tasks/plan.md`, the task file, and every doc the task file lists under "Read first".
- Mirror the task file's steps in your task list so the coordinator and the author can follow progress.
- As the coordinator session (the long-running local session that dispatches tasks, `docs/agents/workflow.md`), start implementers and reviewers with the Agent tool and `isolation: "worktree"`, one per task or review, and start the reviewer yourself; do not ask an implementer to start one.
- As a reviewer, never review a PR whose changes you wrote in this context. A reviewer subagent with a fresh context, started by the authoring or coordinator session, is a separate reviewer (`docs/agents/workflow.md`).
- In a cloud session, your GitHub identity is the machine account `januslin-agent`, not the App. Start every comment with your role in bold.
