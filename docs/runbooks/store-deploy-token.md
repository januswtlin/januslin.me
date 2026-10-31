# Create and store the Cloudflare deploy token
Where: Cloudflare dashboard, your own Terminal (your own `gh`) · Time: about 10 min

1. Cloudflare → My Profile → API Tokens → Create token → Custom: the scopes in `docs/security.md` ("Cloudflare credentials", deploy token) on `main`, which T14 sets to the verified minimum. Expiry: one year from today.
2. In your own Terminal (each prompts for the value):
   ```sh
   gh secret set CLOUDFLARE_API_TOKEN --env production --repo januswtlin/januslin.me
   gh secret set CLOUDFLARE_API_TOKEN --env preview --repo januswtlin/januslin.me
   ```

## Check
```sh
gh secret list --env production --repo januswtlin/januslin.me; gh secret list --env preview --repo januswtlin/januslin.me
```
Expected: `CLOUDFLARE_API_TOKEN` in both. Reply with that and the token's expiry date.
