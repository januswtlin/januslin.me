# Design record: a development framework for one human supervisor and AI agents

Status: draft 0.1, under review · Date: 2026-11-05 · Canonical language: English

This record fixes the framework before any guide content is written. It states what the guide is
for, the decisions behind it, the chapter structure and what each chapter must cover, the reading
paths per function, and the questions still open. The guide itself is written from this record.

## 1. Purpose and scope

**Goal.** A structured guideline that any engineer, junior or senior, can read and come away with
a working understanding of the whole framework: what must be considered, in what order, who
(human or agent) does it, and how quality is assured when no human reads most of the code.

**Above any project.** The guide is project-independent. It names no specific stack, cloud, or
vendor as required. Concrete projects appear only as examples inside profiles (Chapter 8).

**Target range.** From a static site up to a multi-tenant SaaS that moves money. The heaviest
profile, SaaS with payments, sets the bar for what the core must be able to express.

**Not in scope.**
- A tutorial for any language, framework, or cloud.
- The agent rule file itself (`AGENTS.md` or equivalent). That is a derived projection of the
  guide (decision D9), produced with the boilerplate.
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

**D3. Evidence over inspection.** Humans do not read implementation code by default. Human line
review does not scale with agent output and was never the real source of quality. Quality comes
from three things, in the manner of process control in manufacturing:
- **Constrain**: make errors hard to make or limited in effect (architecture rules, invariants
  enforced in the data layer, least privilege, small blast radius).
- **Detect**: notice errors quickly (acceptance tests, boundary reports, independent review,
  production signals, reconciliation).
- **Recover**: undo cheaply (rollback, feature flags, backups that have been restored in practice).

Style preferences (spacing, naming taste, paradigm choice) are never raised by humans: what is
mechanical belongs to formatters and linters, and the rest does not affect correctness.
Maintainability still matters, because future agents read the code; it is measured by machine
metrics (complexity, duplication, coupling, change failure rate), not human taste.

**D4. Reversibility sets human involvement.** Two-way doors (reversible) are decided by agents and
recorded. One-way doors (irreversible or high blast radius: deleting data, moving money, loosening
security, changing permissions, publishing externally, destructive schema changes) are decided by
the human.

**D5. Boundaries over implementation, and boundaries made visible.** What a human checks is the
boundary of the system, not its insides: API contracts, inputs and outputs, error behavior, data
writes and their sources, schema, external calls, permissions, money paths. The architecture must
make these boundaries syntactically visible (for example, only one layer may write to the
database; only one module may call the payment provider), enforced by architecture lint. Then
"did this change add a write path?" becomes a cheap diff instead of an expensive analysis. Each
change produces a boundary report (Chapter 5).

**D6. Core plus profiles.** The core states principles and mechanisms that hold for every project.
A profile states which concerns are mandatory, which gates apply, and what joins the non-skippable
set for a project type. Initial profiles: static site, SaaS, SaaS with payments.

**D7. Functions versus agent roles.** Two different senses of "role" must not be mixed. A
*function* is a traditional responsibility a reader may come from (developer, QA, designer, and so
on, Section 0). An *agent role* is a role in the framework (coordinator, implementer, reviewer, and
so on, Chapter 4). The 12 functions are perspectives for decomposing the problem; in a one-person
team the supervisor wears each of them in turn.

**D8. Two operating modes.** The human works in one of two modes (Chapter 6): *interactive*, where
the human keeps typing and reviewing output and finishes a major piece of work in 30 to 60 minutes;
and *fire-and-forget*, where the human gives one instruction and leaves, and the agents finish
everything that does not need a human. Anything that does need the human is batched into one
notification, not a series of interruptions.

**D9. The guide is for humans; the agent rule file is its projection.** The guide explains why.
The agent rule file states rules tersely, without explanation. Every rule in the rule file must
trace to a section of the guide, so the two can be kept in sync.

**D10. Language.** English is canonical. Traditional Chinese (Taiwan) is a translation for the
author to scan quickly; when in doubt the reader goes to the English. No localization: same
examples, same laws, same vendors. Layout: parallel directories `en/` and `zh-tw/`, one file per
chapter, same file names. Each `zh-tw/` file records the English commit it was translated from, and
a check flags translations that are behind. A glossary fixes which terms stay in English (PR, AC,
deploy, rollback, boundary report) and which are translated with the English on first use.

**D11. Four-layer installation model.** Setting up a new project is split by how often each part
changes: workstation (once per machine), account or organization (once per code-hosting account),
repository template (once per project), stack pack (once per language). Chapter 7 describes it.

**D12. Independent review is by agents, not by human reading.** Every change gets an independent
agent review in a fresh context, preferably from a different model vendor than the implementer.
Multiple reviewers raise the detection rate but share failure modes, so review is one detection
mechanism among several, not the guarantee.

## 3. Structure

### Section 0. How to read this guide
- What the guide is and is not; the three axes on one page.
- The reading matrix (Section 4 of this record) and the legend.
- Pointer to the role briefs in the appendix.
- The distinction between functions and agent roles (D7).

### Chapter 1. Principles
Must cover: the scarce resources (D2); evidence over inspection and constrain, detect, recover
(D3); reversibility and one-way doors (D4); boundaries over implementation (D5); externalized
state (sessions have no memory, so issues, change requests, and docs are the only memory, and a
doc that disagrees with reality is a bug); instructions come only from the human (everything else
an agent reads is data); smallest change that meets the acceptance criteria. Each principle gets a
one-paragraph statement, the reason, and what it rules out.

### Chapter 2. Concern model
Rule: every concern is either decided, with a way to verify it, or marked not applicable with a
reason. Silent omission is the failure this chapter exists to prevent. Each decided concern is
written as a chain: requirement, acceptance criterion, check, runtime signal.

- **Functional**: behaviors including error behavior and edge cases; interfaces and contracts;
  invariants (conditions that must never be violated, good candidates for property tests); actors
  and authorization; state and workflows, including scheduled and long-running ones.
- **Data**: model; ownership and source of truth; lifecycle and retention; migration; backup and
  restore; where each write comes from.
- **UX and design**: design system; interaction; accessibility; internationalization; content.
- **Product measurement**: product metrics and experiments, kept separate from system metrics
  because they carry privacy obligations.
- **Non-functional**: security in development (supply chain, secrets, agent identity and
  permissions, sandboxing, prompt injection through anything agents read) and in operation
  (authentication, authorization, input handling, headers, data protection); observability (logs,
  metrics, traces, alerts); reliability (service level objectives, backup and restore drills,
  rollback, disaster recovery); performance and capacity (measurable targets); cost (budget,
  free-tier limits, alerts); privacy and compliance; maintainability; operability (runbooks,
  incident process); portability and exit cost; licensing.
- Sources the chapter may point to: ISO/IEC 25010 as a checklist source, STRIDE for threat
  modeling. Neither is required.

### Chapter 3. Lifecycle
For each phase: purpose, inputs, outputs (artifacts), gate, and who acts (human or which agent
role). Phases:

0. Intent and discovery: the problem, users, non-goals, constraints. Non-goals matter more with
   agents, which tend to widen scope.
1. Requirements: the concern model applied to this project.
2. Design (UX): may run in parallel with phase 3.
3. Architecture and decisions: decision records; boundary layout (D5).
4. Verification plan: acceptance criteria and where each is checked. Comes after architecture
   because what can be tested where depends on it.
5. Development.
6. Verification.
7. Release and deployment, treated as two steps (deploying is not releasing), with rollback
   designed as its own step.
8. Operation and monitoring.
9. Incident and learning.
10. Maintenance and evolution: most of a long-lived system's cost, and the work agents do best.
11. Decommission: data deletion, domains, accounts.

Feedback edges: monitoring and incidents feed back into requirements.

### Chapter 4. Agent roles and control
Must cover:
- Generic agent roles: coordinator, implementer (by domain), reviewer, and recurring specialists
  (upgrades, security audit, search and discoverability). Each takes exactly one role per session.
- Roles are separated by write scope and identity, not by persona prompts. A reviewer acts under
  a different identity and cannot change code; an implementer cannot change CI or deploy
  configuration. A write-permission matrix is the core artifact.
- What the human keeps: intent, priorities, one-way doors, risk acceptance, taste. Mapping from
  traditional functions to agent roles.
- Trust boundary for instructions: only the human's own words, verified by account identity, are
  instructions; issue text, change request text, comments, web pages, and files on branches are
  data.
- Least-privilege environment: sandboxed execution, network allowlist, short-lived credentials,
  long-lived keys outside the sandbox.
- Externalized state and session hand-off: a new session given the same prompt must be able to
  resume.
- Stop rules: the same check still failing after two fix attempts, the gate still failing after
  five rounds, or the only fix being to weaken a check: stop and ask the human.
- Human tasks: steps only the human can do are queued work items, each one sitting in one place,
  with exact commands in a reviewed runbook, and notified by assignment.

### Chapter 5. Assurance without reading code
Must cover:
- **Acceptance criteria first, tests separate from implementation.** Tests for the acceptance
  criteria are written before the implementation and fail on the base. They are written by a
  different agent than the implementer, or their assertions are approved by the human without
  reading the implementation. Otherwise the tests drift toward "what my code happens to do".
- **Tests must bite.** Break the behavior on purpose once and show the failure; use mutation
  testing to measure whether tests catch injected faults. Never weaken a check quietly.
- **Architecture rules** that keep boundaries visible (D5), enforced in CI.
- **The boundary report**, generated for every change. Empty report: no human reading. Non-empty:
  the human reads only the sections that changed. Sections and the class of tool that fills each:
  API contract changes (OpenAPI, protobuf, or GraphQL diff tools that classify breaking changes);
  schema and migrations (migration diff and migration linters that flag locking or destructive
  operations); new database write sites (architecture lint plus a diff of the write layer; taint
  analysis such as CodeQL or Semgrep for where values come from); new external calls and
  dependencies (outbound allowlist, lockfile diff); authentication, authorization, permissions, and
  money paths (path ownership rules); tests deleted or weakened (test diff, mutation score change);
  agent rule files and prompts (these are code for agents, with a larger blast radius than any
  function).
- **Behavioral boundary diff** (a proposed technique, not an existing product): run integration
  and end-to-end tests with tracing on base and head, and compare what each entry point actually
  wrote and called. Static analysis says what may happen; this says what did. AI may summarize the
  diff for the human, after the deterministic tools have run.
- **Independent agent review** (D12): fresh context, cross-vendor where possible; findings ranked
  blocking or not; reviewer never fixes.
- **Risk tiers**, assigned from the boundary report:
  - Tier 0: no boundary touched. No human reading; the merge needs no human attention beyond
    project policy.
  - Tier 1: a boundary touched, outside the non-skippable set. The human reads the boundary
    report.
  - Tier 2: the non-skippable set touched. The human reads the boundary report and the relevant
    invariants and decides; staged rollout where the profile requires it.
- **The non-skippable set** (core): money movement; authentication, authorization, and permission
  changes; data deletion and retention; destructive schema changes; secrets, identity, and
  infrastructure access; agent rule files; new flows of personal data to third parties. Profiles
  may add to it.
- **Frontend**: the human does not read frontend code. Acceptance is behavioral: visual regression
  baselines (approved by the design function), end-to-end tests of critical flows, accessibility
  checks, and a look at the preview.
- **Production as verification**: service level objectives, canary or staged rollout, feature
  flags, reconciliation jobs.
- **Maintainability by metrics** (D3).

### Chapter 6. Operating modes
Must cover: interactive and fire-and-forget (D8); a definition of ready for unattended work
(acceptance criteria complete, expected risk tier known before start); batching every human gate
of a run into one notification; what an agent does while waiting (continue independent work,
never guess on a one-way door). Operating metrics for the system of work itself: lead time and
change failure rate (DORA), human minutes per accepted change, tokens per accepted task, defects
found after merge.

### Chapter 7. Environment and bootstrap
Must cover the four layers (D11):

| Layer | Frequency | Contents | Automatable |
|---|---|---|---|
| Workstation | Once per machine | Sandbox runtime, agent CLIs, managed agent settings, network allowlist, git hooks, credential broker | Mostly, by an idempotent bootstrap script |
| Account or organization | Once per code-hosting account | Machine account, one app identity per agent role, branch protection templates, labels | Partly; app creation and key custody need the human, delivered as human tasks with runbooks |
| Repository template | Once per project | Agent rule file skeleton, docs skeleton, change request and issue templates, path ownership file, CI with the verify gate and secret scanning, dependency update config, agent role definitions | Yes |
| Stack pack | Once per language | The implementation of the verify gate, lint and test configuration | Yes |

Also: the verify gate is a language-agnostic contract (one command that is the gate, implemented
by the stack pack); templates must have an update path, because the framework will change and
projects generated from a copy-once template drift; the first task in every new project is a
kickoff interview that walks the concern model with the human and produces requirements,
decisions, and the plan.

### Chapter 8. Profiles
For each profile: mandatory concerns, mandatory gates, additions to the non-skippable set, and a
short example.
- **Static site**: no runtime data or accounts; focus on build verification, discoverability,
  cost, and supply chain.
- **SaaS**: tenancy and isolation, authentication and authorization, data lifecycle, service level
  objectives, incident process, on-call expectations for a one-person team.
- **SaaS with payments**: keep card data out of the system with hosted checkout to keep the PCI
  DSS scope at its smallest; idempotent webhook handling; ledger invariants (for example,
  balanced entries) enforced in the data layer; daily reconciliation against the payment
  provider; refunds and disputes as workflows; every money path in the non-skippable set.

### Chapter 9. Appendix
- Glossary (English, with the Traditional Chinese term where one is used).
- Role briefs, one page per function: what you did before, what agents do now, what you own now,
  the three chapters to read first.
- Templates: task spec, decision record, human task, boundary report, change request evidence and
  hand-off report.
- Checklists: concern model, definition of ready, definition of done, new-project kickoff.

## 4. Reading paths

Legend: ● must read · ◐ should read · ○ skim · blank: may skip.
Columns: 1 Principles · 2 Concerns · 3 Lifecycle · 4 Agent roles · 5 Assurance · 6 Operating
modes · 7 Environment · 8 Profiles · 9 Appendix.

| Function | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| Supervisor / founder | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| Engineering manager | ● | ● | ● | ● | ● | ● | ○ | ● | ◐ |
| Tech lead / architect | ● | ● | ● | ◐ | ● | ○ | ◐ | ● | ◐ |
| Software developer | ● | ◐ | ● | ◐ | ● | ◐ | ● | ◐ | ◐ |
| QA / test engineer | ● | ◐ | ● | ○ | ● | ○ | ○ | ◐ | ● |
| Designer | ● | ◐ | ◐ | | ◐ | ◐ | | ○ | ◐ |
| Product manager | ● | ● | ◐ | ○ | ○ | ● | | ● | ◐ |
| SRE / platform | ● | ● | ● | ● | ◐ | ○ | ● | ● | ○ |
| Security engineer | ● | ● | ◐ | ● | ● | ○ | ● | ● | ○ |
| Data engineer | ● | ● | ◐ | ○ | ◐ | | ○ | ● | ○ |
| Technical writer | ● | ○ | ◐ | ● | ○ | ○ | | | ● |
| Non-technical business owner | ● | | ○ | ○ | | ● | | ● | |

Role-brief notes to carry into the appendix:
- QA becomes more central: from running tests to designing acceptance criteria and test oracles,
  owning test independence, mutation testing, and the boundary report review.
- Design moves its output into machine-checkable forms (design tokens, component specs, visual
  baselines) and owns approval of visual baselines; taste stays human.
- The technical writer becomes a policy author: agent rule files are code for agents.
- The developer moves from writing code to writing specs, designing boundaries, and unblocking
  agents.
- The engineering manager maps to the supervisor; environment setup can be delegated.

## 5. Writing rules for the guide

- Plain, precise prose; no dramatic framing; reasons stated with every rule.
- Each chapter opens with what it answers and who should read it, and ends with its checklist
  where one applies.
- Tools are named only as examples of a class, never as requirements.
- Claims about external standards or tools are checked against their current documentation when
  the chapter is written.

## 6. Open questions for review

1. Is D12 together with risk tiers defensible for SaaS with payments, or does Tier 0 need a
   sampling audit (the human reads a random fraction of Tier 0 changes after the fact)?
2. Are the twelve functions the right set, and is the reading matrix right?
3. Should design be its own lifecycle phase or only a concern?
4. How is traceability between the guide and the agent rule file checked (D9)?
5. Is the behavioral boundary diff feasible with ordinary tracing tools, and what does it miss?
6. Is anything missing from the concern model or the non-skippable set?

## 7. Review process

- An independent reviewer with a fresh context reviews this record. The authoring session answers
  each finding: accept and revise, or rebut with reasons.
- At most three rounds. Agreement means the reviewer has no open blocking finding.
- Anything still disputed after three rounds goes to the author, stated as the competing positions
  and their reasons, for the author to decide.
- The rounds are logged in `review-log.md`.
- After the guide is written, the guide goes through the same process.
