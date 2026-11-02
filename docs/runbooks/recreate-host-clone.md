# Re-create the host clone
Where: your own Terminal (not `agent-session`, which needs the clone to exist) · Time: about 5 min

1. Open a shell as `agent` without the clone:
   ```sh
   sudo -iu agent env GIT_TERMINAL_PROMPT=0 zsh -l
   ```
2. Move any old clone aside, then clone and configure:
   ```sh
   [ -e ~/januslin.me ] && mv ~/januslin.me ~/januslin.me.old-$(date +%F)
   git clone https://github.com/januswtlin/januslin.me.git ~/januslin.me
   cd ~/januslin.me
   git config --local credential.helper ''
   git config --local --add credential.helper "!$HOME/januslin.me/scripts/agent-git-credential"
   git config --local credential.useHttpPath true
   git config --local user.name 'januslin-agent[bot]'
   git config --local user.email '349177542+januslin-agent[bot]@users.noreply.github.com'
   ```
3. Never set `core.hooksPath`, fetch `sandbox-agent-vm`, or check out an agent branch here. Delete the `.old-` copy once the new clone works.

## Check
```sh
cd ~/januslin.me && git config --local --list | grep -E 'credential|user|hooks'; git status -sb | head -1
```
Expected: the helper and user lines above, no `core.hookspath`, on `main`.
