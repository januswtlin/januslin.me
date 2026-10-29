# T07: Bootstrap the Node project and `pnpm verify`

- Role: Platform Engineer
- Depends on: T04, T06 · Human steps: none
- Identity: app (`januslin-agent[bot]`)
- Branch: `agent/platform/T07-bootstrap`
- Size: S

## Goal
A minimal Node project at the root with pinned tooling and a working `pnpm verify`, so every later task has a gate to pass and extend.

## Read first
`AGENTS.md` (Commands, Definition of done), ADR-0010, `docs/agents/workflow.md` ("Verification and self-repair").

## Scope
- `package.json`: `"private": true`, `"type": "module"`, `"license": "MIT"`, `packageManager` (pnpm, latest stable), `engines.node` (active LTS 24.x); `.nvmrc`; `pnpm-workspace.yaml` only if pnpm needs it for settings (for example allowed build scripts).
- `.editorconfig`; `.gitattributes` (LF line endings; images and fonts binary).
- Lint and format: ESLint (flat config) for `scripts/` and `tests/`, with a format check; no rules that the vendored theme would fail wholesale (T09 extends the config to `src/`).
- Unit tests: Vitest, with one real test (for example the `prepare-commit-msg` trailer logic or a small helper), not a placeholder.
- Scripts: `check` (`tsc --noEmit` over a minimal `tsconfig.json` for `scripts/` and `tests/` until Astro arrives), `lint`, `format`, `test` (`sh tests/scripts/run.sh` first, then Vitest), `verify` (`check`, `lint`, `test`, failing on the first failure). T09 adds `build` and `astro check`; T10 adds `validate`.
- No `prepare` script that changes git config. Agent clones set `core.hooksPath` by hand (`docs/agents/local-agent-account.md`).
- `README.md`: nothing to change unless a command differs from `AGENTS.md`.

## Out of scope
Astro and the theme (T09). CI workflows (T16).

## Human steps

None.

## Acceptance criteria
- [ ] `pnpm install --frozen-lockfile && pnpm verify` passes on Node 24 in the sandbox (output in the PR).
- [ ] `pnpm verify` fails when a script test fails, when lint fails, and when a unit test fails (one deliberate break each, output in the PR).
- [ ] `packageManager`, `engines`, and `.nvmrc` agree on versions.

## Automated verification
- `pnpm verify` exists and runs everything above.
