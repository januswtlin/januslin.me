# ADR-0007: Posts, topics, and tags, with topic-based URLs
- Status: accepted
- Date: 2026-10-29
- Deciders: Janus, coordinator session

## Context
The site covers every part of the author's life: tech, AI, travel, third-wave coffee, and more to come. One collection per subject would multiply routes and schemas and force a schema decision for every new interest.

Evidence considered (Google Search Central, 2026): keywords in URL paths have hardly any effect beyond breadcrumbs; directories matter for crawl scheduling only at much larger scale; AI Overviews need nothing beyond being indexable with a snippet; internal links are how most pages are discovered. So URL shape should optimize for clarity and stability, and what matters is topical hubs with real content, internal linking, first-hand content, and language coverage.

## Decision
- One `posts` collection for all long-form writing. New collections only for genuinely different schemas.
- A curated `topics` collection; every post has exactly one `topic`; every topic has a hub page with a written introduction and curated "start here" posts.
- Tags are cross-cutting attributes.
- URLs: `/<topic>/<slug>/` for posts, `/<topic>/` for hubs, `/en/` prefix for English (ADR-0005). Breadcrumbs Home › Topic › Post.
- Initial topics: `tech`, `ai`, `travel`, `coffee`, `life`. AI is separate from tech from the start because splitting later would need redirects.
- Moving a post between topics is allowed with a 301 redirect, enforced by CI's slug-history check.

## Alternatives considered
- `/posts/<slug>/`: maximally stable, but the hub relationship is invisible in URLs and breadcrumbs.
- One collection per subject: schema sprawl.
- Chinese slugs: see ADR-0005.

## Consequences
- `run_worker_first` patterns depend on the topic list; they are generated from `content/topics/` and checked in CI.
- Topic ids and page slugs share the first URL segment; a reserved-word list and a uniqueness check prevent collisions.
- A new topic needs a written hub introduction before it ships.

## Revisit when
- A subject needs structured data (for example a coffee brew log, roadmap R21).
