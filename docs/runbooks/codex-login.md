# Codex login through `sbx`
Where: `agent-session`, and your browser for the ChatGPT sign-in · Time: about 10 min

1. Only after `connect-chatgpt-github.md` is done.
2. ```sh
   sbx secret set openai --oauth
   ```
   Finish the ChatGPT sign-in in your browser; if none opens, open the URL it prints.

## Check
```sh
sbx secret ls; sbx secret ls --sandbox januslin
```
Expected: `openai` with OAuth configured.
