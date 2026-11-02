# ADR-0017: Reduce task context while preserving completion gates
- Status: proposed
- Date: 2026-11-02
- Deciders: Janus (requested objective), Codex (proposal)

## Context
The author wants tasks completed with all tests passing and the least total token usage. The first model-guidance proposal added instructions without demonstrating a reduction. Mandatory startup loaded duplicated architecture and the entire coordinator procedure into implementer and reviewer contexts.

## Decision
Keep all agent boundaries in AGENTS.md. Summarize architecture there and retain the required architecture overview. Move the coordinator procedure intact into its own required document for coordinators; keep the workflow's trust checks, handoff, verification, and repair rules mandatory for every role. Model evaluation remains optional during ordinary dispatch.

Use focused checks during implementation and the full required gate on the final implementation and after changes. Keep complete local logs; report status, summaries, and relevant failures. Preserve acceptance tests first, independent review, CI checks when available, and author-only merging. Shorten dispatch text by referencing these rules rather than copying them.

Evaluate total tokens through accepted completion, including failures, repair, coordination, and review. Provider recommendations and smaller documents alone do not demonstrate an end-to-end saving. No runtime defaults change in this proposal.

## Alternatives considered
- More instructions on every dispatch: increases recurring context without measured benefit.
- Lowest effort or hard token caps everywhere: can increase retries or truncate work.
- Skip tests or independent review: violates the completion requirement and existing decisions.

## Consequences
Ordinary sessions load less documentation. Coordinators must follow the new link and still read their full procedure. Model comparisons require actual usage evidence; the initial study measures document size only.

## Revisit when
A context omission causes a missed requirement, or matched task evaluations show worse completion or higher total usage.
