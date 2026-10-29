# T17: Cutover and go-live

- Role: Platform Engineer
- Depends on: T12, T13, T16 · Human steps: T17-H1 to T17-H6
- Identity: app (`januslin-agent[bot]`, also for the workflow change); Cloudflare changes with the author's ops token; the author archives `januswtlin/januslin` in the browser
- Branch: `agent/platform/T17-cutover`
- Size: M

## Goal
`https://januslin.me` serves the new site from the Worker; `www` redirects to the apex; the old Pages project and dangling records are gone; search engines and AI-readiness tooling are set up.

## Read first
`docs/infra-current-state.md`, `docs/deployment.md`, `docs/seo-aeo.md` ("Off-site setup"), `docs/security.md`, ADR-0002, ADR-0006.

## Preconditions (check and record in the PR)
- The About page and the five topic hub introductions (zh-TW) are written by the author, or the author approves placeholders (T17-H2). Agents never write them.
- The latest `main` passes all checks; Lighthouse thresholds met.
- The author approves the cutover window (T17-H2). Expected disruption: a few minutes.

## Scope
1. Pre-flight: export the current DNS records and Pages project settings into the PR description (backup).
2. Remove the custom domain `januslin.me` from the Pages project `januslin`.
3. Add `routes` to `wrangler.jsonc` (`januslin.me` and `www.januslin.me` as custom domains); the author merges; the deploy job deploys. Confirm Cloudflare created the DNS records and certificates.
4. Remove the old `www` CNAME to `januswtlin.github.io`. Create the Single Redirect rule `www.januslin.me/*` → `https://januslin.me/${1}` (301, keep the query string).
5. Verify (acceptance criteria). If anything fails and cannot be fixed within 30 minutes, roll back: remove the routes, re-add the custom domain to the Pages project, report.
6. Post-launch settings: AI Crawl Control (Search, Agent, Training = Allow; Bot Preference Sync off); Bot Fight Mode, AI Labyrinth, Email Obfuscation, Rocket Loader off (or documented why not); Crawler Hints on; Web Analytics on for `januslin.me` with the manual beacon snippet in the layout and the CSP updated for it; Google Search Console and Bing Webmaster Tools verified by DNS TXT (the author completes interactive steps), `sitemap-index.xml` submitted; optional email anti-spoofing records (null MX, `v=spf1 -all`, DMARC `p=reject`) if the author approves; rescan Agent Readiness.
7. Smoke tests move to `https://januslin.me`: delete the Service Auth policy for `ci-smoke-test`, remove the pre-cutover smoke path and its `CF_ACCESS_*` references from `ci.yml`, ask the author to revoke the token and delete the two `smoke` environment secrets and the `smoke` environment, remove the token from the operations calendar.
8. After 48 hours of stable production: delete the Pages project `januslin`; the author archives `januswtlin/januslin` (archive, not delete).
9. Docs: `docs/infra-current-state.md` (desired state becomes current, change log), `docs/deployment.md`, `docs/security.md`, `docs/operations.md`.

## Out of scope
Content. Renovate and scheduled tasks (T19, T20).

## Human steps

Only the author can do these. The agent prepares each one with the exact values before it is needed and waits for the reply. Never paste a secret into a chat; where a secret is involved, the step stores it directly.

- **T17-H1, ops token (10 min)** as in T14-H1, with the scopes the agent sends (DNS, redirect rules, zone settings, Access, Workers routes); revoke as in T14-H3 at the end.
- **T17-H2, content and window (your time).** Write `content/pages/about/index.zh-tw.md` and the five topic hub introductions, or reply "use placeholders". Reply with a cutover time.
- **T17-H3, optional email hardening (2 min).** Reply "yes" or "no" to the null MX, `v=spf1 -all`, and DMARC `p=reject` records.
- **T17-H4, search consoles (15 min).** Sign in to Google Search Console and Bing Webmaster Tools, add `januslin.me` as a domain property, and click Verify after the agent says the TXT records are live; submit `https://januslin.me/sitemap-index.xml`. Send screenshots.
- **T17-H5, remove the smoke-test token (5 min).** Zero Trust → Access → Service credentials → delete `ci-smoke-test`; `gh secret delete CF_ACCESS_CLIENT_ID --env smoke --repo januswtlin/januslin.me`, the same for `CF_ACCESS_CLIENT_SECRET`; then repo Settings → Environments → `smoke` → Delete.
- **T17-H6, archive the old Hugo repository (2 min), 48 hours after cutover.** `januswtlin/januslin` → Settings → Archive this repository.

## Acceptance criteria
- [ ] `https://januslin.me/` serves the new site (a build id meta tag or header proves it is the Worker build).
- [ ] `https://www.januslin.me/some/path?x=1` → 301 → `https://januslin.me/some/path?x=1`.
- [ ] `curl -H 'Accept: text/markdown' https://januslin.me/<entry>/` returns Markdown.
- [ ] `/robots.txt`, `/sitemap-index.xml`, `/rss.xml`, and `/llms.txt` are served correctly.
- [ ] Preview URLs still require Access.
- [ ] `ci-smoke-test`, its policy, the `CF_ACCESS_*` secrets, and the code that reads them are gone (`grep -rn CF_ACCESS .github/workflows` is empty).
- [ ] No DNS record points to `github.io`; the Pages project is deleted after 48 h; `januswtlin/januslin` is archived.
- [ ] Agent Readiness Quick Wins 5/5, or a documented reason for each miss.
- [ ] Search Console and Bing show the sitemap submitted.

## Automated verification
- `scripts/smoke-live.ts` checks the first four criteria and the redirect against `https://januslin.me`; run after each step and after 48 hours; the deploy job's post-cutover smoke test reuses it.
- Manual: DNS and Pages changes, Search Console and Bing, Agent Readiness.
