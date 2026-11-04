// Unit tests for scripts/check-versions.js (T07, #57): packageManager, engines, and .nvmrc agree.
import { describe, expect, it } from "vitest";
import { checkVersions } from "../../scripts/check-versions.js";

const good = {
  packageJson: {
    packageManager: "pnpm@12.16.1",
    engines: { node: "^24.22.2", pnpm: "^12.16.1" },
  },
  nvmrc: "24.22.2\n",
};

/** @param {(p: any) => void} change */
function variant(change) {
  const copy = structuredClone(good);
  change(copy);
  return checkVersions(copy);
}

describe("checkVersions", () => {
  it("accepts agreeing versions", () => {
    expect(checkVersions(good)).toEqual([]);
  });

  it("accepts a packageManager with a Corepack hash suffix", () => {
    expect(
      variant((p) => {
        p.packageJson.packageManager = "pnpm@12.16.1+sha512.abc123";
      }),
    ).toEqual([]);
  });

  it("rejects a .nvmrc that differs from engines.node", () => {
    const problems = variant((p) => {
      p.nvmrc = "24.21.0\n";
    });
    expect(problems.join("\n")).toMatch(/engines\.node/);
  });

  it("rejects a .nvmrc that is not an exact version", () => {
    const problems = variant((p) => {
      p.nvmrc = "lts/*\n";
    });
    expect(problems.join("\n")).toMatch(/\.nvmrc/);
  });

  it("rejects a packageManager other than pnpm", () => {
    const problems = variant((p) => {
      p.packageJson.packageManager = "npm@11.0.0";
    });
    expect(problems.join("\n")).toMatch(/packageManager/);
  });

  it("rejects a pnpm version that differs from engines.pnpm", () => {
    const problems = variant((p) => {
      p.packageJson.engines.pnpm = "^12.15.0";
    });
    expect(problems.join("\n")).toMatch(/engines\.pnpm/);
  });

  it("rejects missing engines", () => {
    const problems = variant((p) => {
      delete p.packageJson.engines;
    });
    expect(problems.length).toBeGreaterThanOrEqual(2);
  });
});
