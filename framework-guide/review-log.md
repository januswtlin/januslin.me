# Review log: design record

Reviewer: an independent Claude subagent with a fresh context (no access to the authoring
discussion). Author of the record: the authoring Claude session. Limit: three rounds; disputes
left after that go to the author.

## Round 1 (on draft 0.1, commit 3437110)

Verdict: changes needed. Six blocking findings (R1 to R6), six non-blocking (R7 to R12), answers to
the six open questions.

| Finding | Summary | Response | Where in 0.2 |
|---|---|---|---|
| R1 (blocking) | Tier assignment fails open; classifier inputs not protected; test weakening only a report section | Accepted: fail closed, assurance tooling in the non-skippable set. Counter-proposal on test weakening: Tier 2 by default, but Tier 1 when the mutation score of the affected code is unchanged or higher, because moving or consolidating tests is routine and should not cost a human decision | D13, D4 items 10 and 11 |
| R2 (blocking) | One-way doors and the non-skippable set are two different lists | Accepted: one list, defined in D4 and Chapter 1 only | D4 |
| R3 (blocking) | Errors inside unchanged boundaries (rounding, inverted checks, dropped tenant filter, object-level access) are invisible; reads missing | Accepted (a) to (d): reads and personal-data response fields as boundaries; structural tenant scoping with denial tests; human-approved executable examples and property tests; bounded exception to reading code | D5, D14, Chapter 2, Chapter 8 SaaS |
| R4 (blocking) | Merge and deploy authority per tier undefined; D4 versus Tier 1 unclear | Accepted the table and the externally-visible rule. Whether agents may merge at all is the author's call, so it is listed as a decision needed rather than settled here | Chapter 5 tier table, Section 6 |
| R5 (blocking) | No failure modes of the agent system | Accepted, as a table in Chapter 4 | Chapter 4 |
| R6 (blocking for SaaS) | Operational actions bypass change control | Accepted | D15 |
| R7 | Traceability ignores project rules | Accepted: core plus profile plus project rules; stable IDs and link check | D9 |
| R8 | Tier needed before start but assigned after; incidents should not be batched | Accepted: predicted and actual tier; immediate notification for incidents and security | D8, Chapter 5, Chapter 6 |
| R9 | Accuracy: change failure rate is not maintainability; Semgrep, migration linter, DORA, ISO 25010, STRIDE, PCI details | Accepted; unverified items listed for checking at writing time | D3, Chapters 2, 5, 6, 8, Section 5 |
| R10 | Abstraction leaks (free tier, discoverability specialist, GitHub vocabulary, per language) | Accepted | Chapters 2, 4, 7, 8 |
| R11 | Greenfield only; no worked example; junior judgment | Accepted | Section 3 intro, Section 0, Chapter 7 |
| R12 | Reading matrix adjustments; minimum path | Accepted | Section 4 |
| Q2 | Add a compliance/finance function | Not accepted as a thirteenth function: the author fixed the set at 12. Folded into the business owner instead | D7, Section 4 notes |

## Round 2 (on draft 0.2, commit 6102fb7)

Verdict: changes needed, one blocking finding (R15). R1, R2, R4, R5, R7 to R12 resolved; R3 and R6
partly. Both counter-proposals and the R4 deferral accepted (the test-weakening one with
conditions, R13).

| Finding | Summary | Response | Where in 0.3 |
|---|---|---|---|
| R12 follow-on | Business owner holds compliance duties but skips Chapter 2 | Accepted: ○ | Section 4 |
| R13 (non-blocking) | Test-weakening exception gameable: same mutant set, mutation testing must have run, not for non-skippable paths or baselines and tolerances; "thresholds raised" is ambiguous | Accepted in full | D4 item 11 |
| R14 (non-blocking) | A Tier 1 revert does not undo data already written | Accepted: forward-compatible data changes, or the veto window closes before production deploy | Chapter 5 |
| R15 (blocking) | D14 does not say who decides that examples cover a change; fail-open again | Accepted, with one refinement: requiring every mutant killed is unattainable when equivalent mutants exist, and letting an agent waive them is fail-open. So uncovered lines and surviving mutants are listed for the human, who approves an added example or reads only those lines | D14 |
| R16 (non-blocking) | Operational actions have no boundary report to tier from; refunds contradict D4 item 1 | Accepted: runbooks declare tier and bound parameters; ad hoc actions are Tier 2; agents prepare refunds, the human executes, unless a human-approved refund policy applies | D15 |
