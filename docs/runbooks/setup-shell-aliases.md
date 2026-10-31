# Set up the shell aliases for the `agent` account
Where: your own Terminal · Time: about 2 min

1. Append the aliases to your own `~/.zshrc` (once):
   ```sh
   cat >> ~/.zshrc <<'ZSH'
   alias agent-session='sudo -iu agent env GIT_TERMINAL_PROMPT=0 sh -c '\''cd ~/januslin.me && exec zsh -l'\'''
   alias agent-end='sudo pkill -u Agent'
   ZSH
   source ~/.zshrc
   ```

## Check
```sh
alias agent-session agent-end
```
Expected: both aliases as above.
