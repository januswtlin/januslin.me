# Set up Working Copy on a new iOS device
Where: the device, then GitHub as `januswtlin` · Time: about 15 min

1. Working Copy → Settings → SSH Keys → generate a new key. Never connect a GitHub account inside Working Copy.
2. Add a repository by cloning `git@github.com:januswtlin/januslin.me.git` (SSH, not HTTPS) with that key.
3. Copy the public key. GitHub → this repository → Settings → Deploy keys → Add deploy key: title `working-copy-<device>-<yyyy-mm>`, "Allow write access" on. Never add it as an account SSH key.
4. Sign in to GitHub Mobile as `januswtlin`; turn the device lock on; install the photo Shortcut (`docs/authoring-guide.md`).
5. Tell the coordinator "Working Copy set up" so it records V12 with you.

## Check
Expected: Settings → Deploy keys lists the new key; a branch pushed from Working Copy appears on GitHub.
