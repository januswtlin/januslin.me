// Build-log warning check for T09 (#58). `pnpm build` (scripts/build.js) writes the full
// output of the build to BUILD_LOG; the dist test fails on any warning line that no
// allowlist entry matches. Deprecations are never allowed, whatever the allowlist says.
import { resolve } from "node:path";

export const BUILD_LOG = resolve(process.env.BUILD_LOG ?? ".logs/build.log");

/**
 * Warnings the build may print, each with the reason it is accepted. Add an entry only with a
 * reason a reviewer can check; never add one for a deprecation.
 * @type {{ pattern: RegExp, reason: string }[]}
 */
export const WARNING_ALLOWLIST = [];

const WARNING = /\[warn\]|\bwarn(?:ing)?s?\b|\(!\)|deprecat/i;
const DEPRECATION = /deprecat/i;

// ANSI color codes start with ESC (\x1b).
/** @param {string} s */
const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*[A-Za-z]/g, ""); // eslint-disable-line no-control-regex

/**
 * @param {string} log
 * @param {{ pattern: RegExp, reason: string }[]} allowlist
 * @returns {{ warnings: string[], disallowed: string[] }}
 */
export function findWarnings(log, allowlist) {
  const warnings = stripAnsi(log)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => WARNING.test(l));
  const disallowed = warnings.filter(
    (l) => DEPRECATION.test(l) || !allowlist.some(({ pattern }) => pattern.test(l)),
  );
  return { warnings, disallowed };
}
