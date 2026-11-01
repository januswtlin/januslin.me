# Codex login through `sbx`
Where: `agent-session`, and your browser for the ChatGPT sign-in · Time: about 10 min

1. Only after `connect-chatgpt-github.md` is done.
   Confirm the machine-account connection and connector decisions first. This
   login does not install Codex or prove that the Claude-template VM uses it.
2. ```sh
   sbx secret set openai --oauth
   ```
   Finish the ChatGPT sign-in in your browser; if none opens, open the URL it prints.
3. Record the sbx version and OAuth scoping supported by its help. The existing
   0.50.1 help says `openai/global only`: do not add `--sandbox januslin` unless a
   newer installed version explicitly supports that combination. Do not fall back
   to an API key or copy `auth.json` into the VM. Adding the new OAuth mixin/binding
   follows the separately reviewed `codex-runtime.md`, not this login command.

## Check
```sh
sbx secret ls; sbx secret ls --sandbox januslin
```
Expected: `openai` with OAuth configured.
Reply with service name, configured status, version, and scoping outcome only;
never tokens or the credential file. V22/V28 remain pending until proxy behavior
and VM sentinel isolation are actually tested.
