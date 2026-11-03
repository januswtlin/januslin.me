# januslin.me

Personal website of Janus Lin. Writing on tech, AI, travel, coffee, and life, in Traditional Chinese, with English versions written by each entry's writer.

- Framework: Astro 7 with the Retypeset theme (vendored)
- Hosting: Cloudflare Workers static assets
- Publishing: Markdown and Git, no CMS
- Maintained by AI agents; Janus writes, reviews, and merges

This repository is public. The site's code and docs are MIT; the writing and photos are not (see License).

Start here:

- Overview: [`docs/overview.md`](docs/overview.md)
- Agents: [`AGENTS.md`](AGENTS.md)
- Decisions: [`docs/decisions/`](docs/decisions/README.md)
- Admin guide (author): [`docs/admin-guide.md`](docs/admin-guide.md)

## For the author

Returning after a break:

- **Catch up:** [Progress](docs/overview.md#progress) summarizes completed, current, and planned tasks; [plan #53](https://github.com/januswtlin/januslin.me/issues/53) has the live execution order.
- **Resume coordination:** [Start the coordinator](docs/admin-guide.md#start-the-coordinator) explains the sandbox session; the [runbook](docs/runbooks/start-coordinator.md) covers starting, stopping, and restarting it, and the [coordinator procedure](docs/agents/coordinator.md) contains its prompt and loop.
- **Your part:** approve tasks, merge reviewed PRs, and complete assigned human tasks. Follow [your queue](docs/admin-guide.md#your-queue) for the details and [after a Mac restart](docs/admin-guide.md#after-a-restart-of-the-mac) to restore the setup.

## Contributing

Pull requests and issues are limited to collaborators. If you found a problem on the site, contact the author through the links on https://januslin.me.

## License

- Code and docs (everything outside `content/` that is not third-party and not the author's media): MIT. See [`LICENSE`](LICENSE).
- Third-party code, themes, and fonts keep their own licenses, listed in `THIRD_PARTY_NOTICES.md` (added when the theme is vendored).
- Content: © Janus Lin, all rights reserved, unless an entry's `license` field says otherwise. This covers `content/` (writing and photos), the published site, and the author's own media anywhere in the repository. See [`LICENSE-CONTENT.md`](LICENSE-CONTENT.md).
