/**
 * Sumi — site configuration
 *
 * Metadata, navigation, feeds, OG images and the ink simulation on the home
 * page. Locale-specific text lives in src/i18n/ui.ts.
 */

export interface SocialLink {
  /** Shown as the link text, so keep it short. */
  label: string;
  href: string;
}

export const SITE = {
  /** Absolute origin of the deployed site. No trailing slash. */
  url: "https://januslin.me",
  title: "Janus Lin",
  /** Fallback OG image, relative to public/. Used for pages without one. */
  defaultOgImage: "/og-default.png",
} as const;

export const AUTHOR = {
  name: "Janus Lin",
  url: "https://github.com/januswtlin",
} as const;

/**
 * Primary navigation. The tagline, description, and labels are per locale in src/i18n/ui.ts.
 * T09 (#58) builds the blog and tag archives at the root only; T11 adds them under /en/, so the
 * English navigation links to the root archives until then.
 */
export const NAV = [
  { key: "navBlog", href: "/blog/" },
  { key: "navTags", href: "/tags/" },
] as const satisfies readonly { key: string; href: string }[];

export const SOCIAL: SocialLink[] = [
  { label: "GitHub", href: "https://github.com/januswtlin" },
];

export const BLOG = {
  /** Posts per page on /blog and the tag archives. */
  postsPerPage: 10,
  /** Latest posts shown on the home page. */
  postsOnHome: 4,
  /** Estimated reading speed used for the "N min read" label. */
  wordsPerMinute: 220,
  showReadingTime: true,
  /** Render the table of contents on article pages. */
  showTableOfContents: true,
  /** Minimum number of headings before the table of contents appears. */
  tocMinHeadings: 3,
} as const;

/**
 * The WebGL ink simulation.
 *
 * It only ever loads on the home page, is skipped entirely when the visitor
 * prefers reduced motion or the browser lacks WebGL2, and pauses when scrolled
 * out of view. Turn both flags off for a completely JavaScript-free site.
 */
export const INK = {
  /**
   * Full-bleed ink behind the hero. Off until the author decides after a real-phone test
   * (ADR-0019): the hero shows the static gradient, and no page loads the ink script.
   * Measured on 2026-11-04 (T09, #58): the module is 10,647 bytes (3,783 gzipped), on the home
   * page only; Astro still emits it to dist/_astro/ unreferenced while both flags are off.
   */
  hero: false,
  /** Narrow ink band used as a section transition. Off for the same reason. */
  divider: false,
  /** Density of each ink splat. Sensible range is 0.3 – 2.5. */
  strength: 1,
  /** Let the ink drift on its own instead of only reacting to the cursor. */
  autoFlow: true,
} as const;

/** Generate a per-article OG image at build time with satori. */
export const OG = {
  enabled: true,
  width: 1200,
  height: 630,
} as const;
