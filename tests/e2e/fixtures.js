// Playwright fixtures for T09 (#58): a worker-scoped static server of dist/ on a free port,
// used as baseURL, and a per-test record of every request and console error on the page.
import { test as base, expect } from "@playwright/test";
import { startStaticServer } from "./static-server.js";

/**
 * @typedef {{ requests: string[], consoleErrors: string[] }} PageLog
 * @typedef {{ url: string, close: () => Promise<unknown> }} DistServer
 */

/** @type {import("@playwright/test").Fixtures<{ pageLog: PageLog }, { distServer: DistServer }, import("@playwright/test").PlaywrightTestArgs & import("@playwright/test").PlaywrightTestOptions, import("@playwright/test").PlaywrightWorkerArgs & import("@playwright/test").PlaywrightWorkerOptions>} */
const fixtures = {
  distServer: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const server = await startStaticServer(process.env.DIST_DIR ?? "dist");
      await use(server);
      await server.close();
    },
    { scope: "worker" },
  ],
  baseURL: async ({ distServer }, use) => {
    await use(distServer.url);
  },
  pageLog: async ({ page }, use) => {
    /** @type {PageLog} */
    const log = { requests: [], consoleErrors: [] };
    page.on("request", (r) => log.requests.push(r.url()));
    page.on("console", (m) => {
      if (m.type() === "error") log.consoleErrors.push(m.text());
    });
    page.on("pageerror", (e) => log.consoleErrors.push(String(e)));
    await use(log);
  },
};

export const test = base.extend(fixtures);

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

/**
 * Waits until the page has loaded and every finite animation (theme transitions, if any) has
 * finished, so checks see the final colors.
 * @param {import("@playwright/test").Page} page
 */
export async function settle(page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished),
    ),
  );
}

export { expect };
