# drafts/

Local-only writing space for the author. Everything in this folder except this README is ignored by git (`.gitignore`), so it is never committed or pushed. The repository is public: anything committed, including entries with `draft: true` in `content/`, is world-readable and stays in history. Unfinished writing belongs here.

- Same layout as `content/`: `drafts/posts/<slug>/index.zh-tw.md` with photos next to it. Start from `content/_templates/` once it exists.
- `pnpm dev:drafts` shows entries from `drafts/` on `http://localhost:4321` (added by the content layer task). `pnpm dev`, `pnpm build`, and `pnpm build:preview` never read this folder, so previews and screenshots cannot include it.
- To publish, move the entry folder into `content/posts/<slug>/`, then commit and open a PR as usual.
- Not synced between devices and not backed up by git. Keep your own backup (Time Machine, iCloud Drive).
- Agents never read, copy from, or commit anything in this folder unless the author asks in that session.
