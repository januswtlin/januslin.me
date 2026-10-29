# ADR-0006: Open AI access policy
- Status: accepted
- Date: 2026-10-29
- Deciders: Janus

## Context
The author wants the site to be found and cited by AI systems from day one. Cloudflare AI Crawl Control separates AI bots into Search, Agent, and Training categories and supports Content Signals in `robots.txt` (`search`, `ai-input`, `ai-train`). Googlebot, BingBot, and Applebot are evaluated under both Search and Training.

## Decision
- AI Crawl Control: allow all three categories. Bot Preference Sync off; our `robots.txt` is authoritative.
- `robots.txt`: `Content-Signal: search=yes, ai-input=yes, ai-train=yes`.
- Publish a Markdown version of every published page and support `Accept: text/markdown`.
- What we protect is integrity, not secrecy: published content may be read in any format; only the author changes it.

## Alternatives considered
- `ai-train=no`: the author chose to allow training.
- Blocking the Training category at the edge: would also block major search crawlers.

## Consequences
- No paywall or members-only content (roadmap R05 if ever wanted).
- Content Signals state a preference; they do not license reuse (`LICENSE-CONTENT.md`).

## Revisit when
- The author changes their view on training use, or Cloudflare changes defaults for existing zones.
