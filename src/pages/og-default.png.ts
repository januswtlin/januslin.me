import type { APIRoute } from "astro";

import { SITE } from "../config";
import { t } from "../i18n";
import { renderOgImage } from "../utils/og-image";

/**
 * The preview used by every page that is not an article. The English tagline, because the OG
 * font is Latin-only until T13 gives satori a CJK face.
 */
export const GET: APIRoute = async () => {
  const png = await renderOgImage({
    title: t("en").siteTagline,
    stamp: SITE.url.replace(/^https?:\/\//, ""),
  });

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
