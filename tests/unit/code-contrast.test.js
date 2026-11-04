// Syntax highlighting passes WCAG AA in light and dark (T09, #58; src/lib/markdown/code-contrast.ts).
// axe checks the fixture's code block in the browser (tests/e2e/a11y.spec.js); this checks every
// token color of both themes, including the ones the fixture does not use.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vitesseDark from "@shikijs/themes/vitesse-dark";
import vitesseLight from "@shikijs/themes/vitesse-light";
import { describe, expect, it } from "vitest";
import {
  CODE_BACKGROUND,
  codeThemes,
  contrastRatio,
  ensureContrast,
} from "../../src/lib/markdown/code-contrast.ts";

const root = resolve(import.meta.dirname, "../..");

/** @param {{ colors?: Record<string, string>, tokenColors?: { settings?: { foreground?: string } }[] }} theme */
const foregrounds = (theme) => [
  ...(theme.colors?.["editor.foreground"] ? [theme.colors["editor.foreground"]] : []),
  ...(theme.tokenColors ?? []).flatMap((r) =>
    r.settings?.foreground ? [r.settings.foreground] : [],
  ),
];

describe("code highlighting contrast", () => {
  it("computes WCAG ratios", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
    // A translucent color is composited on the background first.
    expect(contrastRatio("#00000080", "#ffffff")).toBeCloseTo(
      contrastRatio("#7f7f7f", "#ffffff"),
      2,
    );
  });

  for (const scheme of /** @type {const} */ (["light", "dark"])) {
    it(`every token color of the ${scheme} theme is at least 4.5:1 on Sumi's code background`, () => {
      const bg = CODE_BACKGROUND[scheme];
      const failing = foregrounds(codeThemes[scheme])
        .map((c) => [c, contrastRatio(c, bg)])
        .filter(([, r]) => Number(r) < 4.5);
      expect(failing).toEqual([]);
    });
  }

  it("keeps vitesse's colors that already pass, and only adjusts the others", () => {
    for (const [theme, bg] of /** @type {const} */ ([
      [vitesseLight, CODE_BACKGROUND.light],
      [vitesseDark, CODE_BACKGROUND.dark],
    ])) {
      const before = foregrounds(theme);
      const after = foregrounds(theme === vitesseLight ? codeThemes.light : codeThemes.dark);
      expect(after).toHaveLength(before.length);
      before.forEach((c, i) => {
        if (contrastRatio(c, bg) >= 4.6) expect(after[i]).toBe(c);
        else expect(after[i]).toBe(ensureContrast(c, bg));
      });
    }
  });

  it("the backgrounds match Sumi's tokens for .prose pre (--color-bg-subtle)", () => {
    const tokens = readFileSync(resolve(root, "src/styles/tokens.css"), "utf8");
    expect(tokens).toMatch(/--washi-300:\s*#f3f0ea;/);
    expect(tokens).toMatch(/--sumi-900:\s*#101114;/);
    expect(tokens).toMatch(
      /--color-bg-subtle:\s*light-dark\(var\(--washi-300\),\s*var\(--sumi-900\)\);/,
    );
    const prose = readFileSync(resolve(root, "src/styles/prose.css"), "utf8");
    expect(prose).toMatch(/\.prose pre\s*{[^}]*background:\s*var\(--color-bg-subtle\)/);
  });
});
