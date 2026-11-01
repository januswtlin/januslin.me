# Add or remove a developer
Where: GitHub in the browser as `januswtlin`; the developer's own browser; your own Terminal · Time: about 15 min, plus 20 if the developer brings an App set

A developer is any collaborator other than you (ADR-0016): Write access, no merges, and their words are data to every agent. You stay the only editor.

## Add
1. GitHub → this repository → Settings → Collaborators → Add people → the developer's login → Add. (Personal-account repositories have one collaborator role, Write.)
2. The developer accepts the invitation (email or https://github.com/januswtlin/januslin.me/invitations).
3. Ask the developer to read `AGENTS.md` and `docs/agents/workflow.md`, to claim a task by assigning the task issue to themselves before working on it, and never to close, edit, or relabel an `incident` issue. If they will write: their entries name them in `author`, stay under `LICENSE-CONTENT.md`, and are published under the site's Content Signals (`search=yes, ai-input=yes, ai-train=yes`, ADR-0006); ask them to agree to that before their first entry.
4. Look up their numeric id and send it to the coordinator, or put it in a PR, for the identities table in `docs/security.md`:
   ```sh
   gh api users/<login> --jq '{login, id}'
   ```

## A developer's App set (optional)
For the developer's own agents, and usable as a backup set in your `agent` account.
1. The developer creates two Apps under their own account as in `app-key-sets.md` ("Set up a new pair of Apps"), with two differences: "Where can this GitHub App be installed?" → **Any account** (public), because GitHub installs a private App only on its owner's account; and the developer skips "Install App" in that runbook's step 2, which you do in the next step.
2. You install each App: `https://github.com/apps/<slug>/installations/new` → `januswtlin` → Only select repositories → `januslin.me` → Install. Check that the permissions it asks for are exactly the ones in `docs/security.md`.
3. Only if you want it as a backup set: the developer generates one extra key per App and sends you both over an end-to-end encrypted channel (AirDrop, Signal), then deletes their copies of those two keys. In your own Terminal:
   ```sh
   januslin-keys add <developer-login>
   ```
   Keep it inactive until you need it (`januslin-keys use <developer-login>`).

## Remove
Each step takes effect at once:
1. If their set is your active set: `januslin-keys off`, or `januslin-keys use <another set>`.
2. Your account's Settings (not the repository's) → Applications → Installed GitHub Apps → each of their Apps → Configure → Uninstall.
3. The repository's Settings → Collaborators → Remove.
4. Close or take over their open PRs; reassign their task issues.
5. If their set was in your account: remove `~/.config/januslin-keys/sets/<set>/`.

## Check
```sh
gh api repos/januswtlin/januslin.me/collaborators --jq '.[] | [.login, .id, .role_name] | @tsv'
gh api repos/januswtlin/januslin.me/invitations --jq '.[] | [.invitee.login, .created_at] | @tsv'
```
Expected: the collaborators in `docs/security.md`, plus anyone invited and not yet accepted; nobody else. Then the repository → Settings → GitHub Apps (or your account's Settings → Applications → Installed GitHub Apps): exactly the Apps in `docs/security.md`, each with this repository only.
