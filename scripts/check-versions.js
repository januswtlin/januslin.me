// Checks that the pinned tool versions agree (T07, #57):
// `.nvmrc` is an exact Node version and `engines.node` is `^<that version>`;
// `packageManager` is `pnpm@<version>` and `engines.pnpm` is `^<that version>`.
// Run from the repository root: `node scripts/check-versions.js`. Exits 1 on disagreement.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const EXACT = /^\d+\.\d+\.\d+$/;

/**
 * @param {{ packageJson: { packageManager?: string, engines?: { node?: string, pnpm?: string } }, nvmrc: string }} project
 * @returns {string[]} problems; empty when everything agrees
 */
export function checkVersions({ packageJson, nvmrc }) {
  const problems = [];
  const engines = packageJson.engines ?? {};

  const node = nvmrc.trim();
  if (!EXACT.test(node)) {
    problems.push(`.nvmrc must be an exact version such as 24.0.0, found "${node}"`);
  } else if (engines.node !== `^${node}`) {
    problems.push(`engines.node must be "^${node}" to match .nvmrc, found "${engines.node}"`);
  }

  const match = /^pnpm@(\d+\.\d+\.\d+)(\+sha\d+\.[0-9a-f]+)?$/.exec(
    packageJson.packageManager ?? "",
  );
  if (!match) {
    problems.push(`packageManager must be "pnpm@<x.y.z>", found "${packageJson.packageManager}"`);
  } else if (engines.pnpm !== `^${match[1]}`) {
    problems.push(
      `engines.pnpm must be "^${match[1]}" to match packageManager, found "${engines.pnpm}"`,
    );
  }

  return problems;
}

/** @param {string} root */
export function readProject(root) {
  return {
    packageJson: JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")),
    nvmrc: readFileSync(resolve(root, ".nvmrc"), "utf8"),
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const problems = checkVersions(readProject(process.cwd()));
  for (const p of problems) console.error(`check-versions: ${p}`);
  process.exit(problems.length ? 1 : 0);
}
