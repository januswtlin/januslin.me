# januslin.me

Personal website of Janus Lin. Writing on tech, AI, travel, coffee, and life, in Traditional Chinese, with English versions written by each entry's writer.

- Framework: Astro 7 with the Retypeset theme (vendored)
- Hosting: Cloudflare Workers static assets
- Publishing: Markdown and Git, no CMS
- Maintained by AI agents; Janus writes, reviews, and merges

This repository is public. The site's code and docs are MIT; the writing and photos are not (see License).

For project status, start with the [roadmap](docs/roadmap.md). Agents start with [AGENTS.md](AGENTS.md).

## For the author

Returning after a break:

- **Catch up:** [Roadmap](docs/roadmap.md) shows completed, current, and future work with issue and PR links; [plan #53](https://github.com/januswtlin/januslin.me/issues/53) has the live execution order.
- **Resume coordination:** use the [start/restart runbook](docs/runbooks/start-coordinator.md). It links the coordinator prompt; the [admin guide](docs/admin-guide.md#start-the-coordinator) explains the setup.
- **Your part:** approve tasks, merge reviewed PRs, and complete assigned human tasks. Follow [your queue](docs/admin-guide.md#your-queue) for the details and [after a Mac restart](docs/admin-guide.md#after-a-restart-of-the-mac) to restore the setup.

## Documentation

The roadmap and admin guide cover ordinary project follow-up. Open the other references when the task needs them.

| Need | Read |
|---|---|
| Progress and future work | [Roadmap](docs/roadmap.md): execution order, status, issues, PRs, and later ideas |
| Write or administer | [Authoring guide](docs/authoring-guide.md) for publishing; [admin guide](docs/admin-guide.md) for accounts and the sandbox; [runbook index](docs/runbooks/README.md) for exact operations |
| Understand the system | [Overview](docs/overview.md) for architecture; [infrastructure state](docs/infra-current-state.md) for applied settings and verification evidence |
| Change site behavior | [Content model](docs/content-model.md), including locales and translation; [SEO/AEO](docs/seo-aeo.md); [deployment](docs/deployment.md) |
| Run and maintain agents | [Roles](docs/agents/roles.md), [workflow](docs/agents/workflow.md), [coordinator procedure](docs/agents/coordinator.md), and [sandbox](docs/agents/sandbox.md); optional [model evaluation](docs/agents/model-guidance.md) |
| Maintain or investigate | [Automation](docs/automation.md) for triggers; [operations](docs/operations.md) for recurring checks and incidents; [security](docs/security.md) for controls |
| Understand past choices | [Decisions by topic](docs/decisions/README.md#reading-guide) for rationale; [reports](docs/reports/README.md) for dated evidence. Historical handoff prompts are snapshots, not startup instructions. |

## Contributing

Pull requests and issues are limited to collaborators. If you found a problem on the site, contact the author through the links on https://januslin.me.

## License

- Code and docs (everything outside `content/` that is not third-party and not the author's media): MIT. See [`LICENSE`](LICENSE).
- Third-party code, themes, and fonts keep their own licenses, listed in `THIRD_PARTY_NOTICES.md` (added when the theme is vendored).
- Content: © Janus Lin, all rights reserved, unless an entry's `license` field says otherwise. This covers `content/` (writing and photos), the published site, and the author's own media anywhere in the repository. See [`LICENSE-CONTENT.md`](LICENSE-CONTENT.md).
