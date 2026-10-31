# Put an App private key into the `agent` account
Where: your own Terminal · Time: about 2 min

Run the block for the App whose key you just downloaded (GitHub names it `<app>.<date>.private-key.pem` in `~/Downloads`).

`januslin-agent`:
```sh
F=$(ls -t ~/Downloads/januslin-agent.*.private-key.pem | head -1); test -f "$F" && echo "$F"
cd / && sudo -u Agent sh -c 'umask 077; mkdir -p /Users/Agent/.config/januslin-agent; cat > /Users/Agent/.config/januslin-agent/januslin-agent.pem' < "$F" && rm "$F"
```

`januslin-reviewer`:
```sh
F=$(ls -t ~/Downloads/januslin-reviewer.*.private-key.pem | head -1); test -f "$F" && echo "$F"
cd / && sudo -u Agent sh -c 'umask 077; mkdir -p /Users/Agent/.config/januslin-agent; cat > /Users/Agent/.config/januslin-agent/januslin-reviewer.pem' < "$F" && rm "$F"
```
`cd /` avoids `sudo` warnings when your current directory is your own home, which `Agent` cannot enter.

## Check
Run the Check in `rotate-app-keys.md`.
