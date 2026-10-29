# T15: Cloudflare Access for previews

- Role: Platform Engineer
- Depends on: T14 · Human steps: T15-H1, T15-H2, T15-H3
- Identity: app (`januslin-agent[bot]`); Cloudflare changes with the author's ops token
- Branch: `agent/platform/T15-access`
- Size: S

## Goal
Only the author can reach preview URLs. This must be in place **before** T16 starts publishing previews that can contain drafts. Preview (Version) URLs are public by default once enabled (Cloudflare docs, "Preview URLs"), and `build:preview` includes drafts.

## Read first
`docs/security.md`, `docs/infra-current-state.md`, Cloudflare docs: Access self-hosted applications, Workers "Protect with Access" for `workers.dev` and preview URLs (production URL, previews, or both).

## Scope
- Cloudflare Access (via API with the ops token; record exact calls):
  - Reusable policy "Author only": include the author's email (ask the author which email; default the GitHub/Cloudflare account email) with one-time PIN; optionally GitHub IdP.
  - Worker-level Access on `januslin-me` covering **preview URLs** (production stays public).
  - **Service Auth policy** on the preview-URL application for one Access service token named `ci-smoke-test` (duration 1 year; record the expiry in `docs/operations.md`'s calendar). Until T17 the only URL of a deployed version is its preview URL (`workers_dev: false`), so T16's post-deploy smoke test needs this token to get past Access. The author creates the token and stores it (T15-H2); the agent never sees the secret.
- Confirm Zero Trust is on the free plan and record the seat limit in `docs/infra-current-state.md`.
- Revoke the ops token at the end (ask the author) and record that it was revoked.
- Update `docs/infra-current-state.md` and `docs/security.md`.

## Out of scope
The service token is used by T16's smoke test only.
CSP and headers (verified in T14). GitHub controls (verified in T16's acceptance criteria, audited in T18).

## Human steps

Only the author can do these. The agent prepares each one with the exact values before it is needed and waits for the reply. Never paste a secret into a chat; where a secret is involved, the step stores it directly.

- **T15-H1, ops token and Zero Trust (15 min).** If Zero Trust has never been enabled: Cloudflare dashboard → Zero Trust → complete the onboarding on the free plan (it may ask for a payment method; the plan costs nothing). Then hand over an ops token as in T14-H1, with the Access scopes the agent sends. Send the agent: your choice of email for the "Author only" policy.
- **T15-H2, the smoke-test service token (5 min).** Zero Trust → Access → Service credentials → Create service token `ci-smoke-test`, duration 1 year. Store it without showing it to an agent: `gh secret set CF_ACCESS_CLIENT_ID --env smoke --repo januswtlin/januslin.me` and `gh secret set CF_ACCESS_CLIENT_SECRET --env smoke --repo januswtlin/januslin.me`. Send: "T15-H2 done" and the expiry date.
- **T15-H3, revoke the ops token (2 min)** as in T14-H3.

## Acceptance criteria
- [ ] An unauthenticated request to T14's preview URL (`--preview-alias t13`) is redirected to Access. After login as the author, the preview loads.
- [ ] The `januslin.me` home page is still served by the old site without login (cutover has not happened).
- [ ] `curl` to the T14 preview URL with the service token's `CF-Access-Client-Id` / `CF-Access-Client-Secret` headers returns 200. The author runs it, or the agent reads the values from the environment without printing them.
- [ ] `docs/infra-current-state.md` change log updated; ops token revocation confirmed by the author.

## Automated verification
What this task adds to `pnpm verify` (ADR-0010), and what stays manual.
- Adds nothing to `pnpm verify`; manual by nature (Access is Cloudflare configuration). The agent writes `scripts/check-access.ts`, which requests the preview URL without and with the service-token headers (read from the environment, never printed) and asserts the redirect and the 200, so the checks can be rerun after any change. The author only performs T15's human steps.
