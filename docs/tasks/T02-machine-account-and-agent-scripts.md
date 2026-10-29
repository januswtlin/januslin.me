# T02: Machine account, App transfer, agent scripts

- Role: Platform Engineer
- Depends on: T01 · Human steps: T02-H1 to T02-H8
- Identity: app (`januslin-agent[bot]`)
- Branch: `agent/platform/T02-machine-account`
- Size: M
- Runs on: the author's Mac, in the `agent` account. Nothing else runs in parallel (the transfer can break every agent token for a while).

## Goal
The machine account `januslin-agent` owns the two Apps `januslin-agent` (now with Workflows read and write) and `januslin-reviewer`, and is the only collaborator (Write); each App has one key issued by it; the old `januslin-platform` App is deleted; the agent scripts live in this repository with tests; local agents mint tokens as before.

## Read first
ADR-0009, `docs/agents/local-agent-account.md` (all), `docs/security.md` ("Identities"), `docs/infra-current-state.md` (V2, V5). The archive's `scripts/agent-token.sh`, `scripts/agent-gh`, `scripts/agent-git-credential`, and `.githooks/prepare-commit-msg` (read them from `~/januslin.me-archive`). GitHub docs: "Transferring ownership of a GitHub App", "Making a GitHub App public or private", "Modifying a GitHub App registration" (permission changes and installation approval).

## Scope
1. **Before the transfer**, record from the `agent` account for `januslin-agent` and `januslin-reviewer`: a minted token's permissions, `GET /installation/repositories`, and with the App's JWT `GET /app` (owner, id, slug) and `GET /app/installations` (no token values).
2. Prepare T02-H1 to T02-H6 with exact values; wait for each reply.
3. **After the transfer**, repeat the checks (V5). Expected: same App IDs and installation IDs, owner `januslin-agent` (id 349746030), exactly one installation each on `januswtlin` with this repository only, `januslin-agent[bot]` still user id 349177542.
4. **New keys:** the author generates one key per App as the machine account and installs both in the `agent` account; the agent mints with each new key; the author deletes the old keys and confirms each App lists one key.
5. **Workflows permission:** after T02-H5, a fresh `januslin-agent` token lists `workflows: write` and otherwise the permissions in ADR-0009; `januslin-reviewer` is unchanged.
6. **Collaborator:** the author adds the machine account with Write and accepts the invitation. Check `GET /repos/januswtlin/januslin.me/collaborators?affiliation=direct` if an App token allows it, otherwise the author's screenshot. Finish V2 for the machine account (T02-H7; the machine account's credentials never enter `agent`).
7. **Port the scripts** from the archive into this repository, reviewed again rather than copied blindly: `scripts/agent-token.sh` (two Apps only), `scripts/agent-gh`, `scripts/agent-git-credential`, `.githooks/prepare-commit-msg`. Do not port `scripts/agent-platform-token.sh`. Update App or installation IDs if V5 found a change. Point the clone's credential helper at the ported helper.
8. **Tests:** `tests/scripts/run.sh` (POSIX `sh`, fake `curl` and `gh` on `PATH`, no network, no real key) with cases: the credential helper answers only for `https://github.com/januswtlin/januslin.me`; `agent-gh` refuses an expired or missing token and never prints it; `agent-token.sh` accepts only `januslin-agent` and `januslin-reviewer` and never puts a key or token in argv of a fake command or in output; `prepare-commit-msg` adds `Agent: claude` only when `AGENT_TOOL` is set.
9. Docs: `docs/infra-current-state.md` (owners, public Apps, the deleted App, the new permission, collaborator, key dates, V2 machine account part, V5, change log), `docs/security.md` and `docs/agents/local-agent-account.md` where reality differs.

## Out of scope
The sandbox (T03). Slack (T04). Tool logins and the vendor GitHub connections (T05, T06).

## Human steps

Only the author can do these. The agent prepares each one with the exact values before it is needed and waits for the reply. Never paste a secret into a chat; where a secret is involved, the step stores it directly.

- **T02-H1, secure the machine account (10 min).** In a separate browser profile signed in as `januslin-agent`: Settings → Password and authentication: a passkey or 2FA is on; store the recovery codes with your own. Settings → SSH and GPG keys, Developer settings → Personal access tokens, Applications → Authorized OAuth Apps: all empty. Send the agent: "T02-H1 done".
- **T02-H2, delete the platform App (5 min).** As `januswtlin`: Settings → Developer settings → GitHub Apps → `januslin-platform` → Advanced → "Delete GitHub App", and confirm. Delete its key file from `~/.config/januslin-platform/` in your account, and `~/bin/januslin-platform-token` if you installed it. Send the agent: "T02-H2 done".
- **T02-H3, make the two Apps public and transfer them (10 min).** As `januswtlin`, for `januslin-agent` and `januslin-reviewer`: Settings → Developer settings → GitHub Apps → the App → Advanced → "Make public", then Advanced → "Transfer ownership" → `januslin-agent`. Accept in the machine account's profile if GitHub asks. Send the agent: "T02-H3 done" (the agent then rechecks V5).
- **T02-H4, new keys (10 min).** In the machine account's profile, for each App: General → Private keys → "Generate a private key". Then in your own Terminal run the two commands in `docs/agents/local-agent-account.md` → "Keys" for `januslin-agent.pem` and `januslin-reviewer.pem`; delete the downloads. After the agent confirms the new keys mint, delete every older key on each App's page. Send the agent: a screenshot of each App's key list (dates only).
- **T02-H5, give `januslin-agent` the Workflows permission (5 min).** In the machine account's profile: Settings → Developer settings → GitHub Apps → `januslin-agent` → Permissions & events → Repository permissions → Workflows: "Read and write" → Save changes. Then as `januswtlin`: Settings → Applications → Installed GitHub Apps → `januslin-agent` → review and accept the permission request. Send the agent: "T02-H5 done".
- **T02-H6, add the collaborator (5 min).** As `januswtlin`: repo Settings → Collaborators → Add people → `januslin-agent` → Write. Accept the invitation in the machine account's profile. Send the agent: "T02-H6 done".
- **T02-H7, V2 for the machine account (5 min).** In the machine account's profile, before you merge T02's PR yourself: try to merge it (must be refused), and try to commit to `main` in the web editor (must be refused). Send the agent: screenshots of both refusals.
- **T02-H8, archive the old repository (2 min), after T02 merges.** `januswtlin/januslin.me-archive` → Settings → Danger zone → Archive this repository. Send the agent: "T02-H8 done".

## Acceptance criteria
- [ ] Before and after outputs of steps 1 and 3 are in the PR (no token or key values); V5 is resolved.
- [ ] Each of the two Apps: owner `januslin-agent`, public, one installation (`januswtlin`, this repository only), permissions as ADR-0009 (`januslin-agent` with Workflows read and write), exactly one key created after the transfer (the author's screenshot of the key dates).
- [ ] `januslin-platform` no longer exists (`GET /apps/januslin-platform` returns 404).
- [ ] `scripts/agent-token.sh januslin-agent` and `januslin-reviewer` mint working tokens with the new keys; this PR's pushes show `januslin-agent[bot]`.
- [ ] The machine account is the only direct collaborator, with Write, and cannot merge to `main` (V2).
- [ ] `sh tests/scripts/run.sh` passes, and each case is shown to fail on a deliberate break (output in the PR).

## Automated verification
- `sh tests/scripts/run.sh` (wired into `pnpm test` by T07).
- Manual: T02's human steps, the transfer checks, the collaborator, V2 and V5.
