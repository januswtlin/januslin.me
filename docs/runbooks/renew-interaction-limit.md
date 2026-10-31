# Renew the collaborators-only interaction limit
Where: GitHub as `januswtlin` · Time: about 2 min

1. This repository → Settings → Moderation options → Interaction limits → "Limit to repository collaborators" → six months.

## Check
```sh
gh api repos/januswtlin/januslin.me/interaction-limits --jq '.limit, .expires_at'
```
Expected: `collaborators_only` and a date about six months ahead. Reply with that date.
