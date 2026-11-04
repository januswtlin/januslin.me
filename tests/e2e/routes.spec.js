// Every page in dist/ loads with 200, logs no console error, and makes zero requests to other
// hosts (T09, #58).
import { resolve } from "node:path";
import { htmlRoutes } from "../dist/site.js";
import { expect, foreignRequests, test } from "./fixtures.js";

const routes = htmlRoutes(resolve(process.env.DIST_DIR ?? "dist"));

test("dist/ has pages to check", () => {
  expect(routes.length).toBeGreaterThan(4);
});

for (const route of routes) {
  test(`${route} loads with 200, no console errors, no requests to other hosts`, async ({
    page,
    pageLog,
    baseURL,
  }) => {
    const response = await page.goto(route, { waitUntil: "load" });
    expect(response?.status()).toBe(200);
    await page.waitForLoadState("networkidle");
    // Let idle-time work (sound preloading, prefetch) run before counting requests.
    await page.evaluate(() => new Promise((done) => requestIdleCallback(() => done(undefined))));
    await page.waitForLoadState("networkidle");
    expect.soft(pageLog.consoleErrors).toEqual([]);
    expect.soft(foreignRequests(pageLog.requests, String(baseURL))).toEqual([]);
  });
}
