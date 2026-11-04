// Locales and UI strings (T09, #58; ADR-0005). zh-tw is the default locale at the root; en lives
// under /en/. T09 adds only what the home page and the posts need in both locales; T11 builds the
// full routing and the language switcher.
import { ui, type UiStrings } from "./ui";

export const LOCALES = ["zh-tw", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "zh-tw";

/** BCP 47 tag for <html lang>, structured data, and feeds. */
export const HTML_LANG: Record<Locale, string> = { "zh-tw": "zh-TW", en: "en" };

/** Open Graph locale. */
export const OG_LOCALE: Record<Locale, string> = { "zh-tw": "zh_TW", en: "en_US" };

/** The route parameter for a locale: undefined at the root, "en" under /en/. */
export const localeParam = (locale: Locale) => (locale === DEFAULT_LOCALE ? undefined : locale);

/** The locale a `[...lang]` route parameter stands for. */
export function localeFromParam(param: string | undefined): Locale {
  if (param === undefined) return DEFAULT_LOCALE;
  if ((LOCALES as readonly string[]).includes(param) && param !== DEFAULT_LOCALE)
    return param as Locale;
  throw new Error(`unknown locale path: ${param}`);
}

/** getStaticPaths entries for a page that exists in every locale. */
export const localePaths = () =>
  LOCALES.map((locale) => ({ params: { lang: localeParam(locale) } }));

/** A site path in the given locale: `/blog/x/` stays at the root for zh-tw, `/en/blog/x/` for en. */
export function localizePath(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE) return path;
  return `/${locale}${path === "/" ? "/" : path}`;
}

/** The UI strings for a locale. */
export const t = (locale: Locale): UiStrings => ui[locale];
