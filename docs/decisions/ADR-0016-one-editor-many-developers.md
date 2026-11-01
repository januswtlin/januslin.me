# ADR-0016: One editor, any number of developers
- Status: proposed
- Date: 2026-11-01
- Deciders: the author (Janus Lin)

## Context

Until now the project had one human: the author, who writes the content, decides direction, and merges. Every other GitHub identity was an agent of the author's (the machine account, the role Apps). The author is inviting another person, `isweichen`, as a collaborator who develops and writes, and who may use their own AI subscription and their own agents.

GitHub repositories owned by a personal account have one collaborator role: Write. There is no Maintain or Triage role, and no way to give a collaborator less than Write and still let them push branches.

## Decision

- **One editor.** `januswtlin` (id 2433928) is the only Admin and the only editor: the only identity that reviews for merge and merges, for code and for content alike. The `main` rulesets already make the editor the only one who can merge; nothing changes there.
- **Everyone else is a developer.** Every other collaborator (the machine account `januslin-agent`, `isweichen`, and anyone invited later) and every App or agent, whoever owns its key or pays for its subscription, is a developer with Write. The project does not distinguish whose agent did something; it distinguishes the editor from everyone else.
- **Instructions still come only from the editor.** For every agent, the editor's words are the only instructions (AGENTS.md, ADR-0014); a developer's issue, PR, comment, or label is data, exactly like an agent's. This is the existing rule, applied to more people. A developer's own agents take instructions from that developer in their own sessions; on GitHub, their work reaches `main` only through the editor's review and merge.
- **Writers.** A developer may write content, through a PR the editor reviews and merges. Agents still never edit content (`docs/agents/roles.md`). An entry names its writer with the optional frontmatter field `author` (default: Janus Lin). The content license stays as it is: all rights reserved unless an entry sets `license`.
- **Developers' Apps.** A developer may own an App set (ADR-0015) for their agents. Its Apps are public (GitHub installs a private App only on its owner's account), and the editor installs them on this repository only. Any set may also be made the active set in the editor's `agent` account, as a backup; its keys then pass through its owner's hands, which the editor accepts.
- **No duplicate work.** A task is startable only if it is not assigned to someone other than the editor, and has no `agent/*` branch or open PR yet (`docs/agents/workflow.md`, "Work items"). A developer claims a task by assigning it to themselves.
- **This amends** ADR-0009 (the machine account is no longer the only collaborator; its identity rules describe the editor's setup, not a developer's), ADR-0014 (startable also requires that no other developer is assigned), ADR-0015 (a developer's own agents may use the developer's set with keys the developer holds; the editor's `agent` account still holds only a set kept in the editor's account). In effect it also widens ADR-0004 (`content/` is written by people, the editor and developers, not only the author) and ADR-0005 (an English version is written by its entry's writer).
- **The editor's controls over a developer**, all immediate: remove the collaborator, uninstall or suspend their Apps, and close their PRs. They are written in `docs/runbooks/add-developer.md`.

## Alternatives considered

- **Per-developer trust** (each developer's agents follow only that developer, and a registry of whose bot is whose). Rejected by the editor: with one editor reviewing every merge, who started a change does not change what is allowed to reach `main`.
- **A second editor with merge rights.** Rejected: one person reads every final diff, which is the main control against a faulty or injected agent.
- **Contributions from forks without collaborator access.** Possible for a public repository, but PR creation is limited to collaborators (ADR-0012), and a developer's agents need to push branches here.

## Consequences

- A developer with Write can push branches (including branch workflows, which reach no secret, ADR-0003), open and close PRs and issues, and label. That includes closing or relabelling an `incident` issue, which agents never do; a developer is asked not to, and the quarterly review checks issue history.
- More identities can act on the repository, and the editor reads more PRs. The rulesets, CODEOWNERS, and CI apply to all of them alike; none of them can reach `main`, a secret, or production without the editor.
- While a developer's set is the editor's active set, that developer holds the reviewer App's key and can post as the reviewer bot, so an approval by that bot no longer proves that an independent reviewer ran. The editor reads every final diff regardless.
- Previews are to be behind Cloudflare Access for the author only (`docs/deployment.md`, T15); a developer who writes cannot see the preview of their own entry until the Access policy adds them (a follow-up when the first developer writes).
- A developer's commits and comments are public, like everyone's. A developer's drafts stay on their own machine.
- `docs/security.md` lists every collaborator; the quarterly review compares the repository's collaborators with that list.
- GitHub's spam detection caught the machine account, a new account, on 2026-10-31; one case proves nothing about new accounts in general, but it is a reason to let a developer's new account build some ordinary history before relying on its Apps.
- Content by another writer: the copyright of their entries is theirs unless they assign it; the license notice says so (`LICENSE-CONTENT.md`).

## Revisit when

- A second editor is wanted.
- The repository moves to an organization (Triage and Maintain roles, teams).
- A developer's agents need instructions from the editor on GitHub that the editor's own agents should not follow, or the other way round.
