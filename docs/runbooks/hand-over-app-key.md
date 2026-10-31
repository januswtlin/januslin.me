# Put an App private key into the `agent` account
Where: your own Terminal · Time: about 2 min

1. Replace `<app>` with `januslin-agent` or `januslin-reviewer`, and `<file>` with the downloaded `.pem`:
   ```sh
   cd /
   sudo -u Agent sh -c 'umask 077; mkdir -p /Users/Agent/.config/januslin-agent'
   sudo -u Agent sh -c 'umask 077; cat > /Users/Agent/.config/januslin-agent/<app>.pem' < <file>
   rm <file>
   ```

## Check
Run the Check in `rotate-app-keys.md`.
