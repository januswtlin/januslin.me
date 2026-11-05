// Licenses an entry may set with `license` (T10, #59). Omitting `license` means all rights
// reserved (LICENSE-CONTENT.md). Adding one here is a decision for the author.

export interface License {
  /** Display name. */
  name: string;
  /** The license text. */
  url: string;
}

export const LICENSES = {
  "CC-BY-4.0": {
    name: "Creative Commons Attribution 4.0 International",
    url: "https://creativecommons.org/licenses/by/4.0/",
  },
  "CC-BY-SA-4.0": {
    name: "Creative Commons Attribution-ShareAlike 4.0 International",
    url: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  "CC-BY-NC-4.0": {
    name: "Creative Commons Attribution-NonCommercial 4.0 International",
    url: "https://creativecommons.org/licenses/by-nc/4.0/",
  },
  "CC0-1.0": {
    name: "Creative Commons Zero v1.0 Universal",
    url: "https://creativecommons.org/publicdomain/zero/1.0/",
  },
  MIT: {
    name: "MIT License",
    url: "https://opensource.org/license/mit",
  },
} as const satisfies Record<string, License>;

export type LicenseId = keyof typeof LICENSES;

export const LICENSE_IDS = Object.keys(LICENSES) as LicenseId[];

export const isLicenseId = (value: string): value is LicenseId => Object.hasOwn(LICENSES, value);
