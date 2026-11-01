# Connect ChatGPT to GitHub as the machine account
Where: your own browser profile (`januswtlin`, ChatGPT), then the `januslin-agent` profile · Time: about 20 min

1. ChatGPT → Settings → Apps / Connectors: note the names; remove those holding personal data.
2. As `januswtlin`: GitHub → Settings → Applications → Authorized GitHub Apps → ChatGPT / Codex → Revoke.
3. As `januswtlin`: Installed GitHub Apps → the Codex connector → Configure → Only select repositories → `januswtlin/januslin.me` (install it if missing).
4. In the `januslin-agent` profile: ChatGPT / Codex → connect GitHub → approve. Screenshot the permission list. Record whether Workflows, Secrets, and Variables are granted; do not infer them from the Claude App.

## Check
Expected: `januswtlin` no longer lists ChatGPT under Authorized GitHub Apps; the connector is on this repository only; the connected GitHub account is the machine account `januslin-agent` (id 349746030). Reply with connector names, each keep/remove decision, permission names, and a screenshot kept privately by the author (no email addresses, tokens, or private data in public issues). This review precedes the OAuth login; missing identity/permission evidence stays pending.
