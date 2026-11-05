// The local drafts folder is for `astro dev` only (T10, #59; ADR-0004, ADR-0012). `pnpm dev:drafts`
// sets LOCAL_DRAFTS=true; this integration stops any other command (build, preview, sync) that
// runs with it, so a private draft can never reach dist/ or a deployment.
import type { AstroIntegration } from "astro";

export function localDraftsGuard(): AstroIntegration {
  return {
    name: "januslin-local-drafts-guard",
    hooks: {
      "astro:config:setup": ({ command }) => {
        if (process.env.LOCAL_DRAFTS === "true" && command !== "dev") {
          throw new Error(
            `LOCAL_DRAFTS=true is only for \`pnpm dev:drafts\` (astro dev), not \`astro ${command}\`: the drafts folder never goes into a build`,
          );
        }
      },
    },
  };
}
