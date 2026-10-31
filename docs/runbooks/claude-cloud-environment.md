# Create or check the Claude Code cloud environment
Where: claude.ai → Claude Code → Environments, in the browser profile whose claude.ai GitHub connection is `januslin-agent` · Time: about 5 min

1. Name: `januslin.me`. Network access: **Limited** (Full only by a decision recorded in an ADR). Environment variables: none. Secrets: none.
2. Setup script, exactly:
   ```bash
   #!/bin/bash
   set -euo pipefail
   if [ -f pnpm-lock.yaml ]; then
     corepack enable
     pnpm install --frozen-lockfile
   fi
   ```

## Check
Expected: the environment shows the values above. Reply with a screenshot of its settings.
