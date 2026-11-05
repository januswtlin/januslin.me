// `pnpm sync-worker-routes` (T10, #59): regenerates `run_worker_first` in wrangler.jsonc from
// content/topics/ and content/pages/ (or CONTENT_DIR). `--check` changes nothing and exits 1 when
// the file is out of date. `--config <path>` names another file (tests). Until wrangler.jsonc
// exists (T14), both modes print a notice and exit 0.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { contentSources } from "../src/lib/content/entries.ts";
import { scanContent } from "../src/lib/content/scan.ts";
import { replaceWorkerRoutes, workerRoutes } from "../src/lib/content/worker-routes.ts";

const args = process.argv.slice(2);
const check = args.includes("--check");
const at = args.indexOf("--config");
const config = at >= 0 ? args[at + 1] : "wrangler.jsonc";
if (
  !config ||
  args.some(
    (a, i) =>
      a.startsWith("--") && !["--check", "--config"].includes(a) && args[i - 1] !== "--config",
  )
) {
  console.error("usage: sync-worker-routes [--check] [--config <path>]");
  process.exit(2);
}

if (!existsSync(config)) {
  console.log(
    `sync-worker-routes: ${config} does not exist yet (T14 adds it); nothing to ${check ? "check" : "update"}`,
  );
  process.exit(0);
}

const { contentDir } = contentSources({ CONTENT_DIR: process.env.CONTENT_DIR });
const routes = workerRoutes(scanContent(process.cwd(), contentDir));
const current = readFileSync(config, "utf8");
let next: string;
try {
  next = replaceWorkerRoutes(current, routes);
} catch (e) {
  console.error(`sync-worker-routes: ${config}: ${(e as Error).message}`);
  process.exit(1);
}

if (next === current) {
  console.log(`sync-worker-routes: ${config} is up to date (${routes.length} patterns)`);
} else if (check) {
  console.error(
    `sync-worker-routes: ${config}: run_worker_first is out of date; run \`pnpm sync-worker-routes\`\n  expected: ${JSON.stringify(routes)}`,
  );
  process.exit(1);
} else {
  writeFileSync(config, next);
  console.log(`sync-worker-routes: updated ${config} (${routes.length} patterns)`);
}
