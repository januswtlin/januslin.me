# T08: `pnpm tasks`: check the board, print the next task

- Role: Platform Engineer
- Depends on: T07 · Human steps: none
- Identity: app (`januslin-agent[bot]`)
- Branch: `agent/platform/T08-task-plan-check`
- Size: S

## Goal
The order in `docs/tasks/plan.md` and the board in `docs/tasks/README.md` cannot drift apart unnoticed, and one command shows which tasks are startable and which comes next.

## Read first
`docs/tasks/README.md`, `docs/tasks/plan.md`, `docs/agents/workflow.md` ("Lifecycle of a task", "Coordinator loop").

## Scope
- `scripts/tasks.mjs` (Node, no new dependencies), run as `pnpm tasks`:
  - Parses the board (ID, Depends on, Human steps, Status, PR), the "Human steps" sections of the task files, and the numbered lists in `plan.md`.
  - Prints the tasks in plan order with status and whether each is startable (status not `done` or `dropped`, every task ID in "Depends on" is `done`). Human steps are shown, not evaluated. Last lines: the next task and the open human steps (`Txx-Hn` with their titles from the task file) of the next startable tasks, so the author sees what to do next.
  - `pnpm tasks --check` exits non-zero with one line per problem: an unknown status; a `done` row without a PR link; a "Depends on" ID without a row; a dependency cycle; an ID without exactly one `docs/tasks/<ID>-*.md`; a task file whose header `Depends on:` lists different task IDs than its row (IDs before the first `·`); a non-dropped task missing from `plan.md` or listed twice; a dropped task listed in `plan.md`; a task listed before one of its dependencies; a human-step ID (`Txx-Hn`) mentioned in the board, the plan, or another task file that has no list item in the "Human steps" section of task `Txx` whose bold text starts with `Txx-Hn` (a range "`Txx-Ha` to `Txx-Hb`" in the board, plan, or headers counts as every ID from a to b); a board "Human steps" cell that differs from the IDs defined in that task file.
- Tests in `tests/unit/tasks/` (or `tests/scripts/`) with small fixture boards: the real files pass; each check fails on a fixture built to break it; the next-task line is right for a fixture with parallel streams.
- Docs: `docs/tasks/README.md` and `plan.md` already mention `pnpm tasks`; correct them if the interface differs. The coordinator prompt already uses it.

## Out of scope
Changing the order or the phases (a coordinator docs PR). GitHub Issues or Projects.

## Human steps

None.

## Acceptance criteria
- [ ] `pnpm tasks --check` passes on `main`'s files, and each check fails on a deliberate break (output in the PR).
- [ ] `pnpm tasks` output on the current board is in the PR, and its next task and open human steps match `plan.md`.
- [ ] The tests run in `pnpm verify`, including `pnpm tasks --check` on the real files.

## Automated verification
- The tests above, in `pnpm verify`.
