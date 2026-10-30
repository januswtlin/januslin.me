# januslin.me

Personal website of Janus Lin. Writing on tech, AI, travel, coffee, and life, in Traditional Chinese, with English versions written by the author.

- Framework: Astro 7 with the Retypeset theme (vendored)
- Hosting: Cloudflare Workers static assets
- Publishing: Markdown and Git, no CMS
- Maintained by AI agents; Janus writes, reviews, and merges

This repository is public. The site's code and docs are MIT; the writing and photos are not (see License).

Start here:

- Overview: [`docs/overview.md`](docs/overview.md)
- Agents: [`AGENTS.md`](AGENTS.md)
- Decisions: [`docs/decisions/`](docs/decisions/README.md)

## Starting the coordinator (author)

The coordinator is the long-running Claude Code session that runs the task loop (`docs/agents/workflow.md`, "Coordinator loop"). It runs only inside the sandbox. Never run `claude` in `agent-session`: Claude Code is not installed on the host. `sbx run` starts it with the kit's flags (`--permission-mode auto`), so you type none.

1. In your own Terminal: `agent-session`.
2. Only after a restart of the Mac: `security unlock-keychain ~/Library/Keychains/sbx.keychain-db`.
3. Update the host clone: `cd ~/januslin.me && git checkout main && git fetch origin && git merge --ff-only origin/main`.
4. Start the token broker: `scripts/token-broker.sh start`, then `scripts/token-broker.sh status` (both Apps about an hour ahead).
5. In a second Terminal, in your own account, keep the Mac awake while the coordinator runs: `caffeinate -dims` (Ctrl-C when you stop it). The coordinator cannot do this from the VM.
6. Back in `agent-session`: `sbx run --name januslin`. The status line must say `auto mode on`.
7. Paste the coordinator prompt verbatim from [`docs/agents/workflow.md`](docs/agents/workflow.md#coordinator-loop-adr-0010), then one message with anything it cannot read from `main`: human steps you have done, which tools exist yet (Codex from T06, the Slack script from T04).

To stop: tell it to stop, `/exit`, then `sbx stop januslin` and `scripts/token-broker.sh stop` in `agent-session`, and Ctrl-C the `caffeinate`. A new coordinator started the same way resumes from `main` and the open PRs. If `/login` is ever needed again, the sandbox needs the credential binding in `docs/agents/sandbox.md` ("Starting it").

## Contributing

Pull requests and issues are limited to collaborators. If you found a problem on the site, contact the author through the links on https://januslin.me.

## License

- Code and docs (everything outside `content/` that is not third-party and not the author's media): MIT. See [`LICENSE`](LICENSE).
- Third-party code, themes, and fonts keep their own licenses, listed in `THIRD_PARTY_NOTICES.md` (added when the theme is vendored).
- Content: © Janus Lin, all rights reserved, unless an entry's `license` field says otherwise. This covers `content/` (writing and photos), the published site, and the author's own media anywhere in the repository. See [`LICENSE-CONTENT.md`](LICENSE-CONTENT.md).
