# ADR-0004: One repository with an author-owned `content/`, published with Git only
- Status: accepted
- Date: 2026-10-29
- Deciders: Janus, coordinator session

## Context
The author writes on the laptop (iA Writer, Obsidian) and sometimes on the phone. Content and code could live apart, and a web CMS could serve the phone. GitHub has no path-level write permission, so a "content only" credential for a CMS cannot be enforced, and a CI check that rejects non-content changes runs only after the credential has already written them.

## Decision
- **One repository.** The Astro project is at the root; `content/` sits at the root, outside `src/`, and is owned by the author: plain Markdown, documented frontmatter, co-located images, no MDX, no framework components. Agents' write scope on it is set by `docs/agents/roles.md` and enforced by review.
- **No CMS.** Every change is a Git commit through a PR the author merges.
- **Laptop:** iA Writer or Obsidian on `content/`; branch, commit, push, PR, merge.
- **Mobile, when needed:** iA Writer and Working Copy on iOS. Working Copy authenticates with an SSH key generated on the device and added as a deploy key with write access to this repository only. The author pushes a branch and opens and merges the PR in the GitHub mobile app. An iOS Shortcut prepares photos (JPEG, long edge 2400 px, no metadata).
- **Private drafts** stay in the local, gitignored `drafts/` folder (same layout as `content/`), shown only by `pnpm dev:drafts`. The repository is public (ADR-0012), so `draft: true` hides an entry from the site but not from GitHub.

## Alternatives considered
- Content in a separate repository pulled in as a submodule or at build time: content PRs would lose schema validation and previews without cross-repository CI, and local editing would juggle two repositories.
- Sveltia CMS or Pages CMS: a content-only credential cannot be enforced by GitHub, and a CMS token in the browser is a credential to defend.
- An Astro project in a `site/` subfolder: path configuration everywhere for little benefit.
- Editing on github.com in the phone's browser: needs nothing from this repository and stays a fallback.

## Consequences
- Every content change runs full validation and gets a preview.
- Splitting `content/` out later stays cheap because it has no dependency on the site code.
- The phone's deploy key can push any branch; the `main` ruleset keeps it off `main` (ADR-0003). A lost phone means revoking that key.

## Revisit when
- A second consumer of the content appears (another site, a book export), or history size becomes a problem.
- Working Copy proves too awkward, or GitHub adds path-scoped write permissions.
