# Archive the old Hugo repository
Where: GitHub as `januswtlin` · Time: about 2 min

1. `januswtlin/januslin` → Settings → Danger Zone → Archive this repository.

## Check
```sh
gh api repos/januswtlin/januslin --jq .archived
```
Expected: `true`.
