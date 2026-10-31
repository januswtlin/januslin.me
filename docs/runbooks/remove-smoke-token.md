# Remove `ci-smoke-test` and the `smoke` environment
Where: Cloudflare Zero Trust, your own Terminal (your own `gh`), repository Settings · Time: about 5 min

1. Zero Trust → Access → Service credentials → delete `ci-smoke-test`.
2. In your own Terminal:
   ```sh
   gh secret delete CF_ACCESS_CLIENT_ID --env smoke --repo januswtlin/januslin.me
   gh secret delete CF_ACCESS_CLIENT_SECRET --env smoke --repo januswtlin/januslin.me
   ```
3. This repository → Settings → Environments → `smoke` → Delete environment.

## Check
```sh
gh api repos/januswtlin/januslin.me/environments --jq '.environments[].name'
```
Expected: `preview` and `production` only.
