# T18: Post-launch independent audit

- Role: Reviewer (a session that implemented none of T01 to T17)
- Depends on: T17 · Human steps: T18-H1
- Identity: app (`januslin-agent[bot]` for the report PR)
- Branch: `agent/review/T18-audit`
- Size: S

## Goal
An independent check that the live system matches the documentation, so the next agent can trust `docs/`.

## Read first
Everything under `docs/`, then `AGENTS.md`.

## Scope
For each doc, check claims against reality (repository files, CI runs, the live site, Cloudflare settings through a read-only API token from the author or the author's screenshots):
- `docs/overview.md` flows; `docs/deployment.md` workflows; `docs/security.md` controls, with negative tests: a preview URL without Access; a push to `main` and a merge by `januslin-agent[bot]` (expect the ruleset to refuse; push only a throwaway commit that the refusal keeps off `main`); a branch workflow pushed by `januslin-agent[bot]` trying the `production` environment and its secrets (expect the branch policy to refuse and no secret to be readable); a repeat of T16's fake-`ci` test, to confirm its result still holds; the only collaborator is the machine account with Write; only expected deploy keys; no repository secrets or variables.
- `docs/seo-aeo.md` checklist on the live site; `docs/content-model.md` against the schema; `docs/infra-current-state.md` against Cloudflare and GitHub.
- Follow `docs/authoring-guide.md` literally on a phone-sized viewport for one throwaway entry, then revert it by PR.
- Check that nothing private is in the public repository: `git log -p` scanned for secrets (gitleaks over full history), Slack IDs, and GPS EXIF in committed images.

## Out of scope
Fixing medium or larger findings (they become tasks).

## Human steps

- **T18-H1, settings screenshots (10 min).** Send the agent screenshots of: repo Settings → Collaborators, Deploy keys, Secrets and variables (repository and each environment), Rules → Rulesets, Moderation options → Interaction limits; and the Cloudflare pages the agent names. Run the branch-workflow negative test the agent prepares, and send its result.

## Acceptance criteria
- [ ] `docs/reports/audit-YYYY-MM-DD.md` lists each claim checked, the result (match, mismatch, could not verify), severity, and a proposed fix.
- [ ] Every doc in `docs/` (excluding ADRs and tasks) has at least one verified claim.
- [ ] All negative security tests ran and are recorded.
- [ ] A new task exists for every mismatch of medium or higher severity; trivial doc fixes are in the same PR.

## Automated verification
- Run `pnpm verify` on `main` and record the result; any check that `docs/` claims but neither `verify` nor `ci` runs is a finding.
