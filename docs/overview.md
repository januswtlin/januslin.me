# Overview and architecture

Last reviewed: 2026-10-31

**What exists today:** the repository, its rules and settings, the agent identities, and the local AI sandbox with its coordinator (`docs/infra-current-state.md`). The site, the Worker, CI/CD, and the automation described below are the **target architecture**, built by the tasks in the plan issue [#11](https://github.com/januswtlin/januslin.me/issues/11); the old site still serves `januslin.me` until cutover (T17).

## Purpose

A personal publishing site for Janus Lin at `https://januslin.me`, covering every part of the author's life worth writing about. Initial topics: tech, AI, travel, third-wave coffee, and life. Topics will grow; one `posts` collection with curated topics and tags is designed for that (ADR-0007). Standalone pages (`pages`) start with About.

The site should read like a well-typeset book: typography-first, calm, fast, and readable on a phone. Retypeset's original design delivers that (ADR-0001).

## Goals

1. **Author focus.** People write (the author, and developers through PRs the author merges, ADR-0016); agents do everything else (engineering, operations, upgrades, SEO).
2. **Write anywhere.** Laptop (iA Writer, Obsidian) and, when needed, mobile (iA Writer and Working Copy on iOS). Plain Markdown and Git on every device; no CMS (ADR-0004).
3. **Preview before release.** Every PR gets a protected preview URL; the author's merge to `main` is the release.
4. **Readable by humans and machines.** Static HTML, structured data, sitemap, RSS, a Markdown version of every published page, and a permissive AI access policy (ADR-0006).
5. **Bilingual.** `zh-TW` first; `en` versions written by each entry's writer. A deterministic check opens an issue for each missing English version (`docs/i18n-and-translation.md`).
6. **Near-zero cost.** Free tiers only.

## Non-goals (for now)

- Comments, newsletter, members-only content, server-side features beyond the tiny Worker. Ideas wait in `docs/roadmap.md`.
- Tracking or analytics beyond Cloudflare Web Analytics.
- Hosting anywhere other than Cloudflare.

## People and roles

- **Janus (author, the only editor):** writes content, sets direction, approves tasks, reviews and merges every PR, and does the steps that need the author's credentials, raised as `human-task` issues (`docs/admin-guide.md`).
- **Agents:** `docs/agents/roles.md`. A coordinator session runs the task loop (ADR-0010).

## Limits to keep in mind

Verify current numbers in the vendors' docs before relying on them.

| Limit | Value | Why it matters |
|---|---|---|
| Workers free plan, script invocations | 100,000 per day | Only requests that need code go through the Worker script (`run_worker_first` kept narrow). Static asset requests that skip the script are not counted that way. |
| Workers static assets | 20,000 files per version, 25 MiB per file | Image variants multiply file count. CI reports it; moving images to R2 is roadmap R06. |
| GitHub Actions, public repo | Standard hosted runners are free for public repositories | Minutes are no longer the constraint; keep builds lean for speed. |
| Cloudflare Zero Trust free plan | Up to 50 users | Only the author needs access to previews. |

## System diagram

```
                         ┌──────────────── Cloudflare (zone januslin.me) ────────────────┐
 Readers ───────────────▶│ AI Crawl Control / bot policies                               │
 Search + AI crawlers ──▶│        │                                                      │
 AI agents ─────────────▶│        ▼                                                      │
                         │ Worker "januslin-me"                                          │
                         │   ├─ static assets (dist/): HTML, images, fonts, *.md, feeds  │
                         │   └─ script (worker/): runs only for run_worker_first paths   │
                         │        · Accept: text/markdown → serve the page's index.md    │
                         │        · Link headers                                         │
                         │ Cloudflare Access: all preview URLs                           │
                         │ Redirect rule: www.januslin.me → januslin.me (301)            │
                         └───────────────────────────────────────────────────────────────┘
                                         ▲ wrangler deploy / versions upload
                                         │ (token: environment secret, main only)
 Author (phone or laptop)             GitHub Actions ◀── PR / merge ── GitHub public repo
   ├─ laptop: iA Writer / Obsidian ── branch + PR ────────────────────▶ januswtlin/januslin.me
   └─ phone: iA Writer + Working Copy ── branch + PR (deploy key) ────▶   main: only the author merges
 Local agents (Docker Sandbox) ───── branch + PR as role Apps ──────▶
 Cloud agents ── branch + PR as the machine account januslin-agent ───▶
 Renovate / Actions (detect) ─▶ scheduled agent tasks (act) ── PR ────▶
```

Key property: **all writes go to GitHub, never to Cloudflare**, and only the author's merges reach `main`. Cloudflare serves files and gates previews.

## Components

### Astro site (`src/`, `content/`)
- Astro 7, `output: 'static'`, no SSR adapter.
- Theme: Retypeset, vendored at upstream `a636b6d` and kept to its original design (fonts including Snell Roundhand, UI sound effects, styles). UnoCSS. ADR-0001.
- Content collections load from `content/` with the glob loader (`docs/content-model.md`).
- Markdown: the unified (remark/rehype) pipeline through `@astrojs/markdown-remark`, because KaTeX, Mermaid, and the theme's directive plugins are unified-only. Mermaid renders to inline SVG at build time with headless Chromium, so every environment that runs `pnpm build` needs `pnpm exec playwright install chromium` (ADR-0001).
- Tests (`pnpm test`): Vitest unit tests, shell script tests, checks over the built `dist/`, and Playwright tests against a local static server (page loads, cross-origin requests, accessibility, visual snapshots).
- Build outputs besides HTML: per-page `index.md`, `sitemap-index.xml`, per-locale RSS, `robots.txt`, `llms.txt`, Pagefind index, OG images (`docs/seo-aeo.md`).

### Worker (`worker/`, `wrangler.jsonc`)
- Name `januslin-me`. Serves `dist/` as static assets.
- The script exists only for what static assets cannot do: Markdown content negotiation and per-page `Link` headers. Security headers and redirects use `public/_headers` and `public/_redirects`.
- **Keep `run_worker_first` narrow.** Only article and page HTML paths invoke the script; `/_astro/*`, `/fonts/*`, images, and feeds never do. ADR-0002.

### CI/CD (`.github/workflows/`)
- `ci.yml` on every PR and on push to `main`: install, check, lint, validate, build, test, secret scan; uploads the built site. No secrets. On `main`, a `deploy` job in the `production` environment deploys the artifact, smoke-tests it, and rolls back on failure.
- `preview.yml` (`workflow_run` after `ci` on a PR): uploads the PR's built site as a preview version with `main`'s Worker and config, in the `preview` environment, and comments the URL.
- The Cloudflare token is an environment secret that only `main` can use. A `main` ruleset lets only the author merge and blocks direct and force pushes. ADR-0003, `docs/deployment.md`.

### Automation
Renovate and GitHub Actions detect work; scheduled agent tasks perform it; the author merges. `docs/automation.md`, ADR-0008.

### Cloudflare zone configuration (outside the repo)
Access applications, AI Crawl Control, the `www` redirect rule, Web Analytics, and Crawler Hints cannot live in `wrangler.jsonc`. The Platform Engineer manages them through the Cloudflare API with a short-lived token from the author and records the desired and current state in `docs/infra-current-state.md`; any change updates that file in the same PR.

## Request flows

1. **Reader, HTML page:** edge → AI Crawl Control (allows humans) → Worker. On a `run_worker_first` path the script checks `Accept`; for browsers it passes through to the asset and adds `Link: <…/index.md>; rel="alternate"; type="text/markdown"`.
2. **AI agent asking for Markdown:** same path with `Accept: text/markdown` → the script returns `…/index.md` with `Content-Type: text/markdown; charset=utf-8` and `Vary: Accept`.
3. **Static asset:** served directly; the script does not run.
4. **Publish:** the author pushes a branch, opens a PR, checks the preview, and squash-merges → `ci` builds and deploys from `main` → live in a few minutes.

## Environments

| Environment | URL | Content | Protection |
|---|---|---|---|
| Local | `http://localhost:4321` | includes `draft: true`; `drafts/` only with `pnpm dev:drafts` | n/a |
| Preview (per PR) | `pr-<n>-januslin-me.<account-subdomain>.workers.dev` | includes `draft: true` | Cloudflare Access ("Previews only") |
| Production | `https://januslin.me` | published only | public |

Entries with `draft: true` are committed and therefore public in the repository; they are only kept off the production site. Writing that must stay private stays in `drafts/`.

## Design principles

- Static first. Worker code only when a feature cannot be done at build time or with `_headers`/`_redirects`.
- Config as code. If it can live in the repo, it lives in the repo.
- Theme-independent site features. SEO/AEO outputs, the content model, and i18n routing live in site code (`src/lib/`, `src/pages/`, `scripts/`), so replacing the theme does not lose them.
- Portable content. `content/` stays usable without Astro: standard Markdown, documented frontmatter, co-located images, no framework components in prose.

## Where things are decided

- Technology and process choices: [`docs/decisions/`](decisions/README.md) (ADRs).
- Work to do now: the plan issue [#11](https://github.com/januswtlin/januslin.me/issues/11) and its task and human-task sub-issues (ADR-0014).
- Steps for the author: [`docs/admin-guide.md`](admin-guide.md).
- Ideas and future work: [`docs/roadmap.md`](roadmap.md).
- Writing and publishing: [`docs/authoring-guide.md`](authoring-guide.md).
