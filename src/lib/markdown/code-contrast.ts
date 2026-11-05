// Syntax highlighting that passes WCAG AA (T09, #58).
//
// Sumi highlights code with Shiki's vitesse-light and vitesse-dark, a muted pair chosen to sit
// next to ink and vermilion. Several of their token colors fall below 4.5:1 on Sumi's code
// background (comments 2.06:1 in light, for example). Instead of a different theme pair, each
// failing color is darkened (light) or lightened (dark) just enough to reach AA, keeping its hue,
// so the palette still reads as vitesse.
import vitesseDark from "@shikijs/themes/vitesse-dark";
import vitesseLight from "@shikijs/themes/vitesse-light";

type ThemeRegistration = typeof vitesseLight;

/**
 * Sumi's code block background (`.prose pre` uses --color-bg-subtle: --washi-300 in light,
 * --sumi-900 in dark, src/styles/tokens.css). tests/unit/code-contrast.test.js checks that the
 * tokens still have these values.
 */
export const CODE_BACKGROUND = { light: "#f3f0ea", dark: "#101114" } as const;

/** WCAG AA for normal text is 4.5:1; aim a little above it so rounding never lands below. */
export const TARGET_RATIO = 4.6;

type Rgb = [number, number, number];

/** Parses #rgb, #rgba, #rrggbb, or #rrggbbaa into RGB (0–255) and alpha (0–1). */
export function parseHex(hex: string): { rgb: Rgb; alpha: number } {
  let h = hex.replace(/^#/, "");
  if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(h)) throw new Error(`not a hex color: ${hex}`);
  const rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
  const alpha = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  return { rgb, alpha };
}

const toHex = (rgb: Rgb) =>
  `#${rgb
    .map((c) =>
      Math.round(Math.min(255, Math.max(0, c)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;

function luminance([r, g, b]: Rgb): number {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** The opaque color a (possibly translucent) foreground shows on the background. */
function composite(fg: string, bg: string): Rgb {
  const { rgb, alpha } = parseHex(fg);
  const back = parseHex(bg).rgb;
  return rgb.map((c, i) => c * alpha + back[i] * (1 - alpha)) as Rgb;
}

/** WCAG contrast ratio of a foreground (alpha composited) on an opaque background. */
export function contrastRatio(fg: string, bg: string): number {
  const a = luminance(composite(fg, bg));
  const b = luminance(parseHex(bg).rgb);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * The color, made opaque and mixed toward black (on a light background) or white (on a dark
 * one) in small steps until it reaches the target ratio. Colors that already pass are returned
 * unchanged.
 */
export function ensureContrast(fg: string, bg: string, target = TARGET_RATIO): string {
  if (contrastRatio(fg, bg) >= target) return fg;
  const base = composite(fg, bg);
  const toward = luminance(parseHex(bg).rgb) > 0.5 ? 0 : 255;
  for (let t = 0.01; t <= 1; t += 0.01) {
    const mixed = toHex(base.map((c) => c + (toward - c) * t) as Rgb);
    if (contrastRatio(mixed, bg) >= target) return mixed;
  }
  return toward === 0 ? "#000000" : "#ffffff";
}

/** A copy of the theme with every foreground color raised to the target ratio on `bg`. */
export function withAccessibleColors(theme: ThemeRegistration, bg: string): ThemeRegistration {
  const fix = (c: unknown) =>
    typeof c === "string" && c.startsWith("#") ? ensureContrast(c, bg) : c;
  const colors = { ...theme.colors };
  if (colors["editor.foreground"])
    colors["editor.foreground"] = fix(colors["editor.foreground"]) as string;
  return {
    ...theme,
    // A distinct name, so Shiki never confuses it with the bundled theme of the same name.
    name: `${theme.name}-aa`,
    colors,
    tokenColors: (theme.tokenColors ?? []).map((rule) =>
      rule.settings?.foreground
        ? {
            ...rule,
            settings: { ...rule.settings, foreground: fix(rule.settings.foreground) as string },
          }
        : rule,
    ),
  };
}

/** The pair for `markdown.shikiConfig.themes`. */
export const codeThemes = {
  light: withAccessibleColors(vitesseLight, CODE_BACKGROUND.light),
  dark: withAccessibleColors(vitesseDark, CODE_BACKGROUND.dark),
};
