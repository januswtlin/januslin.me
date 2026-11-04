// Playwright fixtures for T09 (#58): a worker-scoped static server of dist/ on a free port,
// used as baseURL, and a per-test record of every request and console error on the page.
import { test as base, expect } from "@playwright/test";
import { startStaticServer } from "./static-server.js";

/**
 * @typedef {{ requests: string[], consoleErrors: string[] }} PageLog
 */

export const test = base.extend(
  /** @type {any} */ ({
    distServer: [
      // eslint-disable-next-line no-empty-pattern
      async ({}, /** @type {(s: { url: string }) => Promise<void>} */ use) => {
        const server = await startStaticServer(process.env.DIST_DIR ?? "dist");
        await use(server);
        await server.close();
      },
      { scope: "worker" },
    ],
    baseURL: async (
      /** @type {{ distServer: { url: string } }} */ { distServer },
      /** @type {(u: string) => Promise<void>} */ use,
    ) => {
      await use(distServer.url);
    },
    pageLog: async (
      /** @type {{ page: import("@playwright/test").Page }} */ { page },
      /** @type {(l: PageLog) => Promise<void>} */ use,
    ) => {
      /** @type {PageLog} */
      const log = { requests: [], consoleErrors: [] };
      page.on("request", (r) => log.requests.push(r.url()));
      page.on("console", (m) => {
        if (m.type() === "error") log.consoleErrors.push(m.text());
      });
      page.on("pageerror", (e) => log.consoleErrors.push(String(e)));
      await use(log);
    },
  }),
);

/**
 * Requests that went to a host other than the local server.
 * @param {string[]} requests
 * @param {string} serverUrl
 */
export function foreignRequests(requests, serverUrl) {
  const own = new URL(serverUrl).origin;
  return requests.filter((u) => {
    if (u.startsWith("data:") || u.startsWith("blob:")) return false;
    return new URL(u).origin !== own;
  });
}

export { expect };
