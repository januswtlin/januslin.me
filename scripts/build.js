// `pnpm build` (T09, #58): runs `astro build`, then Retypeset's LQIP step, echoing all output
// and keeping a copy in .logs/build.log for the build-log warning check (tests/dist/).
// Exits with the first failing step's status. `INCLUDE_DRAFTS=true` (pnpm build:preview) is
// passed through to Astro; the content task (T10) makes the collections honour it.
import { spawn } from "node:child_process";
import { createWriteStream, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const LOG = resolve(process.env.BUILD_LOG ?? ".logs/build.log");
mkdirSync(dirname(LOG), { recursive: true });
const log = createWriteStream(LOG);

/** @param {string[]} args */
function run(args) {
  return new Promise((done) => {
    log.write(`$ pnpm exec ${args.join(" ")}\n`);
    const child = spawn("pnpm", ["exec", ...args], { stdio: ["inherit", "pipe", "pipe"] });
    child.stdout.on("data", (d) => {
      process.stdout.write(d);
      log.write(d);
    });
    child.stderr.on("data", (d) => {
      process.stderr.write(d);
      log.write(d);
    });
    child.on("close", (code, signal) => done(code ?? (signal ? 1 : 0)));
  });
}

let status = await run(["astro", "build"]);
if (status === 0) status = await run(["tsx", "scripts/apply-lqip.ts"]);
await new Promise((done) => log.end(done));
process.exit(status);
