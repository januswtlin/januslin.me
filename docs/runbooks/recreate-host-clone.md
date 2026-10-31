# Re-create the host clone
Where: `agent-session` · Time: about 5 min

1. ```sh
   git clone https://github.com/januswtlin/januslin.me.git ~/januslin.me
   cd ~/januslin.me
   git config --local credential.helper ''
   git config --local --add credential.helper "!$HOME/januslin.me/scripts/agent-git-credential"
   git config --local credential.useHttpPath true
   git config --local user.name 'januslin-agent[bot]'
   git config --local user.email '349177542+januslin-agent[bot]@users.noreply.github.com'
   ```
2. Never set `core.hooksPath`, fetch `sandbox-januslin`, or check out an agent branch here.

## Check
```sh
cd ~/januslin.me && git config --local --list | grep -E 'credential|user|hooks'; git status -sb | head -1
```
Expected: the helper and user lines above, no `core.hookspath`, on `main`.
