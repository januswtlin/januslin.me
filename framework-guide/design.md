# Design record: a development framework for one human supervisor and AI agents

Status: draft 0.3, under review · Date: 2026-11-05 · Canonical language: English

This record fixes the framework before any guide content is written. It states what the guide is
for, the decisions behind it, the chapter structure and what each chapter must cover, the reading
paths per function, and the questions still open. The guide itself is written from this record.

Changes from 0.1 follow review round 1 (`review-log.md`): one list of one-way doors (D4);
classification fails closed (D13); reads and tenant scoping as boundaries (D5); a bounded
exception to "no human reads code" for money and access paths (D14); operational actions under the
same control (D15); a tier table with merge authority (Chapter 5); failure modes of the agent
system (Chapter 4); brownfield adoption and a worked example; accuracy and abstraction fixes.
Changes from 0.2 follow round 2: measured coverage for D14; conditions on the test-weakening
exception (D4 item 11); tier assignment for operational actions and a pre-approved refund policy
(D15); forward-compatible data changes at Tier 1.

## 1. Purpose and scope

**Goal.** A structured guideline that any engineer, junior or senior, can read and come away with
a working understanding of the whole framework: what must be considered, in what order, who
(human or agent) does it, and how quality is assured when no human reads most of the code.

**Above any project.** The guide is project-independent. It names no specific stack, cloud, or
vendor as required. Concrete projects appear only as examples inside profiles (Chapter 8) and in
the worked example.

**Target range.** From a static site up to a multi-tenant SaaS that moves money. The heaviest
profile, SaaS with payments, sets the bar for what the core must be able to express.

**Not in scope.**
- A tutorial for any language, framework, or cloud.
- The agent rule file itself (`AGENTS.md` or equivalent). That is a derived projection (D9),
  produced with the boilerplate.
- The boilerplate (installable starter kit). Chapter 7 describes its model; building it is a
  separate effort.
- Localization. The Traditional Chinese version is a translation for scanning (D10).

## 2. Decisions

Each decision is stated with its reason. The guide must be consistent with all of them; changing
one means changing this record first.

**D1. Three axes, with control and evidence as the primary one.** The framework is described on
three axes: concerns (what must be considered, Chapter 2), lifecycle (when, Chapter 3), and control
and evidence (who decides, what checks it, whether it can be undone, Chapters 4 and 5). The first
two are checklists; the third is what lets the system run while the human is not watching.

**D2. Design around the scarce resources.** Agents make specialization cheap: another expert is
another context. What stays scarce is (a) human attention and judgment, (b) verification that can
be trusted, and (c) memory across sessions. Every mechanism in the guide must say which of these it
saves or protects.

**D3. Evidence over inspection.** Humans do not read implementation code by default (the one
bounded exception is D14). Human line review does not scale with agent output and was never the
real source of quality. Quality comes from three things, in the manner of process control in
manufacturing:
- **Constrain**: make errors hard to make or limited in effect (architecture rules, invariants
  enforced in the data layer, least privilege, small blast radius).
- **Detect**: notice errors quickly (acceptance tests, boundary reports, independent review,
  production signals, reconciliation).
- **Recover**: undo cheaply (rollback, feature flags, backups that have been restored in practice).

Style preferences (spacing, naming taste, paradigm choice) are never raised by humans: what is
mechanical belongs to formatters and linters, and the rest does not affect correctness.
Maintainability still matters, because future agents read the code; it is measured by machine
metrics (complexity, duplication, coupling, churn in hot spots), not human taste.

**D4. Reversibility sets human involvement; the non-skippable set is defined once, here.** Two-way
doors (reversible, limited blast radius) are decided by agents and recorded. One-way doors are
decided by the human. The one-way doors form **the non-skippable set**, the single list every other
chapter refers to. Core members:
1. Moving money, and changes to money paths.
2. Authentication, authorization, permission, and tenant-scoping changes.
3. Data deletion, retention changes, and bulk data export.
4. Destructive or locking schema changes.
5. Secrets, identities, credentials, and infrastructure access.
6. Loosening any security control.
7. Breaking changes to a published external contract (an API others consume, a data format others
   read).
8. New flows of personal data to third parties.
9. Agent rule files and prompts (code for agents, with a larger blast radius than any function).
10. Assurance tooling and its configuration: the verify gate, CI, architecture lint rules, the
    path ownership file, tier rules, and test-weakening detection. An agent that can change the
    classifier can change its own tier.
11. Tests deleted or weakened (assertions removed, tolerances or thresholds loosened, baselines
    updated). One exception, Tier 1 with the reason stated: the mutation score is unchanged or
    higher, measured over the same mutant set (the same production code and the same mutation
    operators on base and head). The exception does not apply when mutation testing did not run
    (D13), to tests of paths that are themselves in this set (money, access), or to visual
    baselines and numeric tolerances, which have no mutation score.

Profiles may add members; they never remove core members.

**D5. Boundaries over implementation, and boundaries made visible.** What a human checks is the
boundary of the system, not its insides: API contracts, inputs and outputs, error behavior, data
writes and their sources, reads of sensitive data and new response fields carrying personal data,
tenant scoping, schema, external calls, permissions, money paths. The architecture must make these
boundaries syntactically visible (for example, only one layer may touch the database; only one
module may call the payment provider; no query can be issued without tenant context), enforced by
architecture lint. Then "did this change add a write path or widen a read?" becomes a cheap diff
instead of an expensive analysis. Each change produces a boundary report (Chapter 5).

**D6. Core plus profiles.** The core states principles and mechanisms that hold for every project.
A profile states which concerns are mandatory, which gates apply, and what joins the non-skippable
set for a project type. Initial profiles: static site, SaaS, SaaS with payments.

**D7. Functions versus agent roles.** Two different senses of "role" must not be mixed. A
*function* is a traditional responsibility a reader may come from (developer, QA, designer, and so
on, Section 0). An *agent role* is a role in the framework (coordinator, implementer, reviewer, and
so on, Chapter 4). The 12 functions are perspectives for decomposing the problem; in a one-person
team the supervisor wears each of them in turn. Compliance and finance responsibilities (for
example, owning reconciliation and the auditor relationship) are folded into the business owner
function rather than added as a thirteenth.

**D8. Two operating modes.** The human works in one of two modes (Chapter 6): *interactive*, where
the human keeps typing and reviewing output and finishes a major piece of work in 30 to 60 minutes;
and *fire-and-forget*, where the human gives one instruction and leaves, and the agents finish
everything that does not need a human. Anything that does need the human is batched into one
notification, not a series of interruptions. Exception: incidents and security findings notify
immediately.

**D9. The guide is for humans; the agent rule file is a projection.** The guide explains why; the
agent rule file states rules tersely. A project's rule file is the union of three projections: the
core, the selected profile, and project-specific rules. Core and profile rules trace to a section
of the guide; project rules trace to the project's own decision records. Every rule has a stable
ID and a link to its source anchor; a check verifies that every link resolves, and each normative
guide section either names its rules or states that it has none. The check runs in the template's
update path.

**D10. Language.** English is canonical. Traditional Chinese (Taiwan) is a translation for the
author to scan quickly; when in doubt the reader goes to the English. No localization: same
examples, same laws, same vendors. Layout: parallel directories `en/` and `zh-tw/`, one file per
chapter, same file names. Each `zh-tw/` file records the English commit it was translated from, and
a check flags translations that are behind. A glossary fixes which terms stay in English (PR, AC,
deploy, rollback, boundary report) and which are translated with the English on first use.

**D11. Four-layer installation model.** Setting up a project is split by how often each part
changes: workstation (once per machine), account or organization (once per code-hosting account),
repository template (once per project), stack pack (once per language and framework). Chapter 7
describes it.

**D12. Independent review is by agents, not by human reading.** Every change gets an independent
agent review in a fresh context, preferably from a different model vendor than the implementer.
Multiple reviewers raise the detection rate but share failure modes, so review is one detection
mechanism among several, not the guarantee. Its catch rate is measured, not assumed (seeded-defect
canaries, Chapter 4).

**D13. Classification fails closed.** Tiers are assigned from tool output, so the classifier is a
single point of failure. Any analyzer that did not run, cannot parse a file, or does not support a
language raises the tier of the affected change to at least Tier 1, and to Tier 2 if the
unanalyzed file sits on a path in the non-skippable set. Changes to the classifier's own inputs are
in the non-skippable set (D4, item 10).

**D14. The bounded exception: executable examples, then the diff.** For a Tier 2 change to a money
path or an access-control path, the human approves executable examples: concrete inputs with the
expected amounts, ledger entries, or allow and deny outcomes, run as tests, plus property tests on
the relevant invariants. Coverage is measured by tooling, never asserted by an agent: the approved
examples and property tests must execute every changed line and branch of the money or access
module, and kill the mutants generated on those lines. Lines not executed and mutants that survive
are listed for the human, who either approves an added example that covers them or reads those
lines. Equivalent mutants are not waived by an agent; the human sees them like any other survivor.
D5 keeps what remains small because those modules are small by design.
Errors inside an unchanged boundary (a rounding change, an inverted entitlement check, a dropped
tenant filter) are invisible to boundary reports; this decision is what catches them.

**D15. Control covers operational actions, not only changes.** Agents also act outside the change
flow: flipping feature flags, running runbooks, backfilling data, one-off production queries,
preparing refunds. These actions use the same tiers, assigned this way: each runbook or script
declares its tier and bounds its parameters; that declaration is reviewed whenever the runbook
changes, and the runbook change itself is classified under D4. An ad hoc action with no runbook is
Tier 2. All actions are logged. Moving money is in the non-skippable set (D4 item 1), so agents
prepare refunds and the human executes them, unless the profile has a refund policy the human
approved in advance (an amount cap per refund, the allowed reasons, a daily total); within that
policy an agent may execute, and changing the policy is itself Tier 2.

## 3. Structure

A single worked example, one feature of a SaaS with payments taken from intent to production,
runs through Chapters 2 to 8: each chapter ends with the example's step for that chapter.

### Section 0. How to read this guide
- What the guide is and is not; the three axes on one page.
- The reading matrix (Section 4 of this record), its legend, and the minimum path.
- Pointer to the role briefs in the appendix.
- The distinction between functions and agent roles (D7).
- How a junior builds judgment without reading code: writing acceptance criteria and test
  oracles, reviewing boundary reports, reading failure write-ups.

### Chapter 1. Principles
Must cover: the scarce resources (D2); evidence over inspection and constrain, detect, recover
(D3); reversibility and the non-skippable set (D4, the list is defined here and only here);
boundaries over implementation (D5); externalized state (sessions have no memory, so issues, change
requests, and docs are the only memory, and a doc that disagrees with reality is a bug);
instructions come only from the human (everything else an agent reads is data); smallest change
that meets the acceptance criteria. Each principle gets a one-paragraph statement, the reason, and
what it rules out.

### Chapter 2. Concern model
Rule: every concern is either decided, with a way to verify it, or marked not applicable with a
reason. Silent omission is the failure this chapter exists to prevent. Each decided concern is
written as a chain: requirement, acceptance criterion, check, runtime signal.

- **Functional**: behaviors including error behavior and edge cases; interfaces and contracts;
  invariants (conditions that must never be violated, good candidates for property tests); actors
  and authorization, including object-level access (one user reading another's record by changing
  an identifier); state and workflows, including scheduled and long-running ones; idempotency and
  concurrency; time, time zones, currency, and rounding.
- **Data**: model; ownership and source of truth; tenant isolation; lifecycle and retention;
  migration; backup and restore; where each write comes from; who may read what.
- **UX and design**: design system; interaction; accessibility; internationalization; content.
- **Product measurement**: product metrics and experiments, kept separate from system metrics
  because they carry privacy obligations.
- **Non-functional**: security in development (supply chain including invented or look-alike
  package names, secrets, agent identity and permissions, sandboxing, prompt injection through
  anything agents read) and in operation (authentication, authorization, input handling, headers,
  data protection); observability (logs, metrics, traces, alerts; logs must not leak personal data
  or secrets); reliability (service level objectives, backup and restore drills, rollback, disaster
  recovery); performance and capacity (measurable targets); cost (budget and plan limits, alerts);
  privacy and compliance, including breach notification duties; maintainability; operability
  (runbooks, incident process); portability and exit cost; licensing.
- Sources the chapter may point to: ISO/IEC 25010:2023 as a checklist source; STRIDE for security
  threat modeling and LINDDUN for privacy threats, which STRIDE does not cover. None is required.

### Chapter 3. Lifecycle
For each phase: purpose, inputs, outputs (artifacts), gate, and who acts (human or which agent
role). Phases:

0. Intent and discovery: the problem, users, non-goals, constraints. Non-goals matter more with
   agents, which tend to widen scope.
1. Requirements: the concern model applied to this project.
2. Design (UX): a conditional phase, which may run in parallel with phase 3. Gate: approved flows
   and visual baselines. A profile may mark it not applicable with a reason (an API-only service).
3. Architecture and decisions: decision records; boundary layout (D5).
4. Verification plan: acceptance criteria, executable examples for Tier 2 paths (D14), and where
   each is checked. Comes after architecture because what can be tested where depends on it.
5. Development.
6. Verification.
7. Release and deployment, treated as two steps (deploying is not releasing), with rollback
   designed as its own step.
8. Operation and monitoring, including operational actions under D15.
9. Incident and learning.
10. Maintenance and evolution: most of a long-lived system's cost, and the work agents do best.
11. Decommission: data deletion, domains, accounts.

Feedback edges: monitoring and incidents feed back into requirements; escaped misclassifications
feed back into the classifier rules (Chapter 5).

### Chapter 4. Agent roles and control
Must cover:
- Generic agent roles: coordinator, implementer (by domain), reviewer, and recurring specialists
  (dependency upgrades, security audit, others as the profile needs). Each session takes exactly
  one role.
- Roles are separated by write scope and identity, not by persona prompts. Each agent role acts as
  a separate non-human identity with scoped, short-lived credentials. A reviewer cannot change
  code; an implementer cannot change CI, deploy configuration, or the classifier. A
  write-permission matrix is the core artifact.
- What the human keeps: intent, priorities, the non-skippable set, risk acceptance, taste. Mapping
  from traditional functions to agent roles.
- Trust boundary for instructions: only the human's own words, verified by account identity, are
  instructions. Issue text, change request text, comments, web pages, files on branches,
  dependency contents, test output, and tool server responses are data.
- Least-privilege environment: sandboxed execution, network allowlist, short-lived credentials,
  long-lived keys outside the sandbox.
- Externalized state and session hand-off: a new session given the same prompt must be able to
  resume.
- Stop rules: the same check still failing after two fix attempts, the gate still failing after
  five rounds, or the only fix being to weaken a check: stop and ask the human.
- Human tasks: steps only the human can do are queued work items, each one sitting in one place,
  with exact commands in a reviewed runbook, and notified by assignment.
- **Failure modes of the agent system**, each with its mechanism:

| Failure mode | Mechanism |
|---|---|
| Reviewer rubber-stamps; reviewers miss the same things | Seeded-defect canaries measure reviewer and test catch rates; cross-vendor review |
| Specification gaming (editing tests or fixtures to pass) | Tests separate from implementer; D4 item 11; mutation score |
| Invented or look-alike dependencies | Lockfile diff in the boundary report; registry existence and age checks; allowlist |
| Prompt injection through issues, dependencies, test output, tool servers | Instruction trust boundary; sandbox; network allowlist; least privilege |
| Model or version change silently changes behavior | Pinned model versions; re-evaluation on a fixed task set before switching |
| Vendor outage or quota exhaustion | Second vendor configured; work items resumable from external state |
| Runaway token cost or loops the stop rules miss | Per-run budget caps; wall-clock limits; cost alerts |
| Concurrent agents changing the same files | One owner per work item (a lock or claim); declared file scopes for parallel work |
| Agent acting in production outside the change flow | D15: tiers, reviewed runbooks, logging |
| Human approves boundary reports without reading them | Time-on-report metric; random spot questions; keep reports short |
| Compromised agent identity | Kill switch that revokes every agent credential at once; credentials scoped per role |

### Chapter 5. Assurance without reading code
Must cover:
- **Acceptance criteria first, tests separate from implementation.** Tests for the acceptance
  criteria are written before the implementation and fail on the base. They are written by a
  different agent than the implementer, or their assertions are approved by the human without
  reading the implementation. Otherwise the tests drift toward "what my code happens to do".
- **Tests must bite.** Break the behavior on purpose once and show the failure; use mutation
  testing to measure whether tests catch injected faults. Never weaken a check quietly (D4 item 11).
- **Architecture rules** that keep boundaries visible (D5), enforced in CI.
- **The boundary report**, generated for every change. Sections and the class of tool that fills
  each, with their limits stated:
  - API contract changes: OpenAPI, protobuf, or GraphQL diff tools that classify breaking changes.
  - Schema and migrations: migration diff, plus migration linters that flag locking or destructive
    operations; these linters are largely engine-specific (mostly PostgreSQL), so other engines
    fail closed (D13).
  - New database write sites and widened reads: architecture lint plus a diff of the data-access
    layer. Taint analysis (CodeQL, Semgrep) can show where values come from, but only with custom
    source and sink definitions; Semgrep's open-source taint mode is limited to single functions,
    and cross-file analysis needs its commercial tier.
  - New response fields carrying personal data.
  - New external calls and dependencies: outbound allowlist, lockfile diff.
  - Paths in the non-skippable set: path ownership rules.
  - Tests deleted or weakened: test diff, mutation score change.
  - Analyzer coverage: which analyzers ran, which files they could not analyze (D13).
- **Behavioral boundary diff** (a proposed technique, not an existing product): run integration and
  end-to-end tests with standard tracing auto-instrumentation (database and HTTP client spans) on
  base and head; normalize identifiers, timestamps, and ordering; diff each entry point's set of
  (table, operation) and (host, route). It misses untested paths, asynchronous jobs without trace
  propagation, uninstrumented clients, production-only configuration and flags, value-level errors
  (the right write with the wrong amount, which D14 covers), and nondeterminism noise. It
  complements static analysis. AI may summarize the diff for the human, after the deterministic
  tools have run.
- **Independent agent review** (D12): fresh context, cross-vendor where possible; findings ranked
  blocking or not; the reviewer never fixes.
- **Risk tiers.** A predicted tier is recorded when work is ready; the actual tier is assigned from
  the boundary report when it is done (D13 applies). The default table, which profiles may
  tighten:

| Tier | Assigned when | Human role | Merge | Deploy | Blocks |
|---|---|---|---|---|---|
| 0 | No boundary touched, all analyzers ran | None | Agent, after the gate and independent review pass (see "Decision needed" 1) | Normal pipeline; canary in SaaS profiles | No |
| 1 | A boundary touched, nothing in the non-skippable set | Reads the boundary report | Agent for internal changes, with a veto window in which the human may revert; human acknowledgement first when the change is externally visible (an additive change to a published contract, a user-visible change) | Normal pipeline | Only when externally visible |
| 2 | Anything in the non-skippable set | Approves executable examples (D14), reads the boundary report and invariants, decides | Human | Staged rollout where the profile requires it | Yes |

  A revert undoes code, not data. So a Tier 1 change that adds a data write or a schema change
  must be forward-compatible (expand-then-contract migrations, so that reverting leaves the data
  usable); if it cannot be, its veto window closes before the production deploy.

  D4 and Tier 1 do not conflict: D4 says who decides (a two-way door is the agent's), the tier says
  how much attention the decision receives.
- **Sampling audit of Tier 0.** A random sample of Tier 0 changes is re-examined after the fact by
  a different-vendor agent with an adversarial brief; in the payments profile, the human also reads
  a small sample of reports. Any escaped misclassification raises the sampling rate and adds a
  classifier rule.
- **Frontend**: the human does not read frontend code. Acceptance is behavioral: visual regression
  baselines (approved by the design function), end-to-end tests of critical flows, accessibility
  checks, and a look at the preview.
- **Production as verification**: service level objectives, canary or staged rollout, feature
  flags, reconciliation jobs.
- **Maintainability by metrics** (D3).

### Chapter 6. Operating modes
Must cover: interactive and fire-and-forget (D8); a definition of ready for unattended work
(acceptance criteria complete, executable examples approved for Tier 2 paths, predicted tier
recorded); under fire-and-forget, an actual tier above the predicted one stops that work item and
goes into the batched notification; incidents and security findings notify immediately; what an
agent does while waiting (continue independent work, never guess on a one-way door).

Operating metrics for the system of work itself: the DORA software delivery metrics (deployment
frequency, change lead time, change failure rate, failed deployment recovery time, and the rework
rate added in 2024; distinguish these from the EU Digital Operational Resilience Act, which shares
the acronym and which payments readers may meet), plus human minutes per accepted change, tokens
per accepted task, defects found after merge, reviewer and test catch rates on seeded defects, and
time spent on boundary reports.

### Chapter 7. Environment and bootstrap
Must cover the four layers (D11):

| Layer | Frequency | Contents | Automatable |
|---|---|---|---|
| Workstation | Once per machine | Sandbox runtime, agent CLIs, managed agent settings, network allowlist, version-control hooks, credential broker | Mostly, by an idempotent bootstrap script |
| Account or organization | Once per code-hosting account | A separate non-human identity per agent role with scoped credentials; branch protection templates; work-item categories | Partly; creating identities and holding keys need the human, delivered as human tasks with runbooks |
| Repository template | Once per project | Agent rule file skeleton (D9), docs skeleton, change request and work-item templates, path ownership file, CI with the verify gate and secret scanning, dependency update configuration, agent role definitions, classifier rules | Yes |
| Stack pack | Once per language and framework; a polyglot repository uses several | The implementation of the verify gate, lint and test configuration, analyzers for the boundary report | Yes |

Also: the verify gate is a language-agnostic contract (one command that is the gate, implemented
by the stack pack); templates must have an update path, because the framework will change and
projects generated from a copy-once template drift; the rule-traceability check (D9) runs in that
update path.

Starting a project:
- **Greenfield**: the first task is a kickoff interview that walks the concern model with the human
  and produces requirements, decisions, the boundary layout, and the plan.
- **Brownfield**: boundaries are not yet visible. Start with an inventory (entry points, data
  writes and sensitive reads, external calls, money and access paths), add architecture rules
  incrementally, and run with a higher default tier (Tier 1 minimum) until the analyzers cover the
  code base.

### Chapter 8. Profiles
For each profile: mandatory concerns, mandatory gates, additions to the non-skippable set, and a
short example.
- **Static site**: no runtime data or accounts; focus on build verification, discoverability by
  search engines and AI crawlers, cost, and supply chain.
- **SaaS**: tenancy and isolation, with tenant scoping enforced structurally (database row-level
  security, or a data-access layer that cannot query without tenant context) and cross-tenant
  denial tests as a mandatory gate; authentication and authorization; data lifecycle; service level
  objectives; incident process; on-call expectations for a one-person team; canary deployment for
  Tier 0.
- **SaaS with payments**: keep card data out of the system with a hosted payment page or redirect,
  which typically puts the merchant in the smallest self-assessment scope (SAQ A); payment forms
  built with JavaScript or posting directly raise it (SAQ A-EP). What remains in scope must be
  stated: the page that embeds or redirects to checkout, every identity that can change it
  (including the agents' CI and deploy identities), and the yearly attestation. Also: idempotent
  webhook handling; ledger invariants (for example, balanced entries) enforced in the data layer;
  daily reconciliation against the payment provider; refunds and disputes as workflows; every money
  path and money-moving operation in the non-skippable set (D15); a human sample in the Tier 0
  audit.

### Chapter 9. Appendix
- Glossary (English, with the Traditional Chinese term where one is used).
- Role briefs, one page per function: what you did before, what agents do now, what you own now,
  the three chapters to read first.
- Templates: task spec (with predicted tier), decision record, human task, boundary report,
  executable-example sheet for Tier 2, change request evidence and hand-off report.
- Checklists: concern model, definition of ready, definition of done, greenfield kickoff, brownfield
  inventory.

## 4. Reading paths

Legend: ● must read · ◐ should read · ○ skim · blank: may skip.
Columns: 1 Principles · 2 Concerns · 3 Lifecycle · 4 Agent roles · 5 Assurance · 6 Operating
modes · 7 Environment · 8 Profiles · 9 Appendix.

**Minimum path, for anyone:** Chapter 1, the tier table in Chapter 5, and the summary of Chapter 6.

| Function | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| Supervisor / founder | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| Engineering manager | ● | ● | ● | ● | ● | ● | ○ | ● | ◐ |
| Tech lead / architect | ● | ● | ● | ◐ | ● | ○ | ◐ | ● | ◐ |
| Software developer | ● | ◐ | ● | ● | ● | ◐ | ● | ◐ | ◐ |
| QA / test engineer | ● | ◐ | ● | ◐ | ● | ○ | ○ | ◐ | ● |
| Designer | ● | ◐ | ◐ | | ◐ | ◐ | | ○ | ◐ |
| Product manager | ● | ● | ◐ | ○ | ◐ | ● | | ● | ◐ |
| SRE / platform | ● | ● | ● | ● | ◐ | ○ | ● | ● | ○ |
| Security engineer | ● | ● | ◐ | ● | ● | ○ | ● | ● | ○ |
| Data engineer | ● | ● | ◐ | ○ | ◐ | | ○ | ● | ○ |
| Technical writer | ● | ○ | ◐ | ● | ○ | ○ | | | ● |
| Non-technical business owner | ● | ○ | ○ | ○ | ○ | ● | | ● | |

Role-brief notes to carry into the appendix:
- QA becomes more central: from running tests to designing acceptance criteria, executable
  examples, and test oracles; owning test independence, mutation testing, seeded-defect canaries,
  and the boundary report review.
- Design moves its output into machine-checkable forms (design tokens, component specs, visual
  baselines) and owns approval of visual baselines; taste stays human.
- The technical writer becomes a policy author: agent rule files are code for agents.
- The developer moves from writing code to writing specs, designing boundaries, directing and
  unblocking agents.
- The product manager approves acceptance criteria and accepts risk.
- The engineering manager maps to the supervisor; environment setup can be delegated.
- The business owner also holds compliance and finance duties: reconciliation ownership, the
  auditor relationship, breach notification decisions.

## 5. Writing rules for the guide

- Plain, precise prose; no dramatic framing; reasons stated with every rule.
- Each chapter opens with what it answers and who should read it, and ends with its step of the
  worked example and its checklist where one applies.
- Tools are named only as examples of a class, never as requirements, and their limits are stated
  where the guide relies on them.
- Claims about external standards and tools are checked against primary sources when the chapter is
  written. Already flagged for checking: the 2025 revision of SAQ A eligibility, the split between
  Semgrep's open-source and commercial taint analysis, the status of DORA's rework rate, and the
  ISO/IEC 25010:2023 characteristic names.

## 6. Decisions needed from the author

1. **May an agent merge and deploy Tier 0 and internal Tier 1 changes?** The table assumes yes,
   after the gate and independent review pass. If not, the human merges without reading, which
   keeps a human click in every change and limits fire-and-forget.
2. **D14 accepts a bounded exception to "no human reads code".** For Tier 2 money and access
   changes not covered by approved executable examples, the human reads that module's diff. The
   alternative is to refuse such changes until examples cover them.

## 7. Review process

- An independent reviewer with a fresh context reviews this record. The authoring session answers
  each finding: accept and revise, or rebut with reasons.
- At most three rounds. Agreement means the reviewer has no open blocking finding.
- Anything still disputed after three rounds goes to the author, stated as the competing positions
  and their reasons, for the author to decide.
- The rounds are logged in `review-log.md`.
- After the guide is written, the guide goes through the same process.
