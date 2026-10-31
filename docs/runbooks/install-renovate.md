# Install the Renovate App
Where: GitHub as `januswtlin` · Time: about 5 min

1. https://github.com/apps/renovate → Install → `januswtlin` → Only select repositories → `januswtlin/januslin.me`.
2. Renovate opens an onboarding PR; merge it when the agent says it is ready.

## Check
```sh
gh pr list --repo januswtlin/januslin.me --author 'app/renovate'
```
Expected: the onboarding PR is listed. Reply "installed".
