// The collections inside Astro (T10, #59), on the fixture sets only; never the real drafts/:
// - a broken content set fails the build, and the error names the file and the field or value;
// - INCLUDE_DRAFTS=true (pnpm build:preview) builds the draft fixture; DRAFTS_DIR alone loads
//   nothing;
// - LOCAL_DRAFTS=true is refused by every command but astro dev;
// - pnpm dev includes drafts; only pnpm dev:drafts loads the drafts folder, as drafts, and a slug
//   in both folders loads from the content folder with a warning.
// Each build uses its own output and cache directory, so dist/ and the main cache stay as
// `pnpm build` left them.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { join, resolve } from "node:path";
import { parse } from "node-html-parser";
import { afterAll, describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const BROKEN = "tests/fixtures/content-broken";
// Inside the project: Astro moves built assets into the output directory with rename(), which
// cannot cross file systems.
mkdirSync(join(root, "node_modules/.cache"), { recursive: true });
const tmp = mkdtempSync(join(root, "node_modules/.cache/t10-astro-"));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

/** The environment without Vitest's own variables (NODE_ENV=test changes how Astro serves). */
const baseEnv = Object.fromEntries(
  Object.entries(process.env).filter(([k]) => k !== "NODE_ENV" && !k.startsWith("VITEST")),
);

/** Runs `astro <command>` with its own output and cache directories. @param {string} command @param {Record<string, string>} env */
function astro(command, env, name = command) {
  const args = command === "build" ? ["build", "--outDir", join(tmp, `${name}-dist`)] : [command];
  const r = spawnSync("pnpm", ["exec", "astro", ...args], {
    cwd: root,
    encoding: "utf8",
    env: { ...baseEnv, ASTRO_CACHE_DIR: join(tmp, `${name}-cache`), ...env },
    timeout: 120_000,
  });
  // ANSI colors, then Astro's ** markers, out of the way of the assertions.
  const output = `${r.stdout}${r.stderr}`.replace(/\x1b\[[0-9;]*m/g, ""); // eslint-disable-line no-control-regex
  return { status: r.status, output, dist: join(tmp, `${name}-dist`) };
}

/**
 * Broken sets the build must reject: the file it names (in the case folder) and the field or
 * value the message must contain.
 */
const BUILD_CASES = {
  "missing-title": ["posts/a/index.zh-tw.md", "title"],
  "unknown-field": ["posts/a/index.zh-tw.md", "tag"],
  "unknown-topic": ["posts/a/index.zh-tw.md", 'topic: unknown topic "no-such-topic"'],
  "unknown-tag": ["posts/a/index.zh-tw.md", 'tags.1: unknown tag "no-such-tag"'],
  "unknown-related": ["posts/a/index.zh-tw.md", 'related.0: unknown post "no-such-post"'],
  "unknown-start-here": ["topics/tech/index.zh-tw.md", 'startHere.0: unknown post "no-such-post"'],
  "unknown-license": ["posts/a/index.zh-tw.md", 'unknown license "WTFPL"'],
  "unknown-locale": ["posts/a/index.fr.md", 'unknown locale "fr"'],
  "cover-without-alt": ["posts/a/index.zh-tw.md", "coverAlt"],
  "related-to-draft": ["posts/a/index.zh-tw.md", 'related.0: points at the draft post "hidden"'],
  "start-here-draft": [
    "topics/tech/index.zh-tw.md",
    'startHere.1: points at the draft post "hidden"',
  ],
};

describe("a broken content set fails the build", () => {
  it.each(Object.entries(BUILD_CASES))(
    "%s: the error names the file and the field",
    (name, [file, says]) => {
      const r = astro("build", { CONTENT_DIR: `${BROKEN}/${name}` }, name);
      expect(r.status, r.output).not.toBe(0);
      expect(r.output).toContain(`${BROKEN}/${name}/${file}`);
      expect(r.output).toContain(says);
    },
    120_000,
  );
});

describe("drafts in builds", () => {
  it("INCLUDE_DRAFTS=true builds the draft fixture; DRAFTS_DIR alone loads nothing", () => {
    const r = astro(
      "build",
      {
        CONTENT_DIR: "tests/fixtures/content",
        INCLUDE_DRAFTS: "true",
        DRAFTS_DIR: "tests/fixtures/drafts",
      },
      "preview",
    );
    expect(r.status, r.output).toBe(0);
    expect(existsSync(join(r.dist, "tech/draft-post/index.html"))).toBe(true);
    expect(existsSync(join(r.dist, "coffee/local-draft/index.html"))).toBe(false);
  }, 180_000);

  it("with INCLUDE_DRAFTS=true a published entry may link to a draft", () => {
    const r = astro(
      "build",
      { CONTENT_DIR: `${BROKEN}/related-to-draft`, INCLUDE_DRAFTS: "true" },
      "related-to-draft-preview",
    );
    expect(r.status, r.output).toBe(0);
  }, 120_000);

  it.each(["build", "sync"])(
    "LOCAL_DRAFTS=true is refused by astro %s",
    (command) => {
      const r = astro(command, {
        CONTENT_DIR: "tests/fixtures/content",
        LOCAL_DRAFTS: "true",
        DRAFTS_DIR: "tests/fixtures/drafts",
      });
      expect(r.status).not.toBe(0);
      expect(r.output).toContain("LOCAL_DRAFTS=true is only for `pnpm dev:drafts`");
      if (command === "build") expect(existsSync(r.dist)).toBe(false);
    },
    120_000,
  );
});

/** A free TCP port on localhost, so parallel runs (other worktrees) do not collide. */
function freePort() {
  return new Promise((done, fail) => {
    const server = createServer();
    server.on("error", fail);
    server.listen(0, "localhost", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => done(port));
    });
  });
}

/**
 * Starts `pnpm <script>` (a dev server) and resolves once it serves, with its base URL, its
 * output so far, and a stop function.
 * @param {string} script
 */
async function devServer(script) {
  const port = await freePort();
  // --ignore-lock keeps the server in the foreground: Astro 7 moves `astro dev` to the background
  // when it detects an AI agent, and refuses a second server while one is running.
  const child = spawn("pnpm", [script, "--port", String(port), "--ignore-lock"], {
    cwd: root,
    env: {
      ...baseEnv,
      ASTRO_CACHE_DIR: join(tmp, `${script}-cache`),
      CONTENT_DIR: "tests/fixtures/content",
      DRAFTS_DIR: "tests/fixtures/drafts",
    },
    detached: true,
  });
  let output = "";
  child.stdout.on("data", (d) => (output += d));
  child.stderr.on("data", (d) => (output += d));
  const stop = () =>
    new Promise((done) => {
      if (child.exitCode !== null) return done(undefined);
      child.on("exit", () => done(undefined));
      process.kill(-(/** @type {number} */ (child.pid)), "SIGTERM");
    });
  const base = `http://localhost:${port}`;
  return new Promise((ready, fail) => {
    const started = Date.now();
    let last = "";
    const poll = async () => {
      if (child.exitCode !== null) return fail(new Error(`${script} exited:\n${output}`));
      if (Date.now() - started > 90_000) {
        await stop();
        return fail(new Error(`${script} did not start (last: ${last}):\n${output}`));
      }
      try {
        if (/ready in/.test(output)) {
          const res = await fetch(`${base}/`, { signal: AbortSignal.timeout(30_000) });
          last = String(res.status);
          if (res.ok) return ready({ base, output: () => output, stop });
        }
      } catch (e) {
        last = String(/** @type {any} */ (e).cause?.code ?? e);
      }
      setTimeout(poll, 500);
    };
    poll();
  });
}

/** @param {string} url */
const get = async (url) => {
  const res = await fetch(url);
  return { status: res.status, text: await res.text() };
};

describe("dev servers", () => {
  it("pnpm dev includes drafts and never loads the drafts folder", async () => {
    const server = /** @type {any} */ (await devServer("dev"));
    try {
      const draft = await get(`${server.base}/tech/draft-post/`);
      expect(draft.status).toBe(200);
      expect(draft.text).toContain("Draft fixture post");
      expect((await get(`${server.base}/coffee/local-draft/`)).status).toBe(404);
    } finally {
      await server.stop();
    }
  }, 120_000);

  it("pnpm dev:drafts loads the drafts folder as drafts; content/ wins a shared slug", async () => {
    const server = /** @type {any} */ (await devServer("dev:drafts"));
    try {
      const local = await get(`${server.base}/coffee/local-draft/`);
      expect(local.status).toBe(200);
      expect(local.text).toContain("Local draft fixture");
      // Loaded as a draft although its frontmatter says draft: false: the home page marks it.
      const cards = parse((await get(`${server.base}/`)).text).querySelectorAll(".post-card");
      const card = cards.find(
        (c) => c.querySelector(".post-card__title")?.textContent.trim() === "Local draft fixture",
      );
      expect(card?.querySelector(".post-card__draft"), "draft label on the home page").toBeTruthy();
      const shared = await get(`${server.base}/travel/kyoto-walk/`);
      expect(shared.text).toContain("在京都的雨天走路");
      expect(shared.text).not.toContain("Shadowed local draft fixture");
      expect(server.output()).toContain(
        "tests/fixtures/drafts/posts/kyoto-walk is also in tests/fixtures/content/posts/: loading the one in tests/fixtures/content/",
      );
    } finally {
      await server.stop();
    }
  }, 120_000);
});
