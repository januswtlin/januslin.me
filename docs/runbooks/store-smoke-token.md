# Create and store the Access service token `ci-smoke-test`
Where: Cloudflare Zero Trust, your own Terminal (your own `gh`) · Time: about 5 min

1. Zero Trust → Access → Service credentials → Create service token `ci-smoke-test`, duration one year.
2. In your own Terminal (each prompts for the value shown once in the dashboard):
   ```sh
   gh secret set CF_ACCESS_CLIENT_ID --env smoke --repo januswtlin/januslin.me
   gh secret set CF_ACCESS_CLIENT_SECRET --env smoke --repo januswtlin/januslin.me
   ```

## Check
```sh
gh secret list --env smoke --repo januswtlin/januslin.me
```
Expected: both names. Reply with that and the expiry date.
