# Third-party notices

Code, fonts, and other assets in this repository or in the built site that were not written for it, with their sources and licenses. The project's own code is under `LICENSE` (MIT); the content is under `LICENSE-CONTENT.md`. npm dependencies are not vendored; their licenses come with them in `node_modules/`, except where the build copies their files into the site (listed below).

"Verified" means the license was confirmed from a primary source: the asset itself (for fonts, the copyright and license entries of the font's `name` table), and its publisher's own repository or package. An asset whose license cannot be verified is removed (ADR-0019, V14 in `docs/infra-current-state.md`). No asset is unverified. One open question remains about how the license applies: the Reserved Font Name of Source Serif 4 (below).

Reviewed 2026-11-04 (T09, #58).

## Summary

| Asset | Where | Source | License | Status |
|---|---|---|---|---|
| Sumi theme (code, styles, the favicon) | `src/` (except `src/lib/`, `src/i18n/`, `src/styles/cjk.css`, `src/styles/callouts.css`), `astro.config.ts`, `public/favicon.svg` | [kpab/astro-sumi](https://github.com/kpab/astro-sumi) at `c6bbdd91417cb0a624e7abbb570544c951ac5c6f` (v1.0.0) | MIT, © 2026 kpab, below | Verified: `LICENSE` at that commit; GitHub reports MIT |
| Source Serif 4, Latin and Latin Extended subsets, roman and italic variable fonts (`source-serif-4-*.woff2`) | `public/fonts/` (from Sumi) | [adobe-fonts/source-serif](https://github.com/adobe-fonts/source-serif), version 4.004, "© 2014 - 2021 Adobe Systems Incorporated, with Reserved Font Name 'Source'" | SIL OFL 1.1 | License verified: the fonts' `name` table (copyright, OFL license URL), the repository's `LICENSE.md` (GitHub reports OFL-1.1), and Sumi's `public/fonts/LICENSE.txt`. **Open question, Reserved Font Name (`needs-human`, PR #124):** Adobe's license reserves the name "Source", and these files are subsets (231 to 276 codepoints of a 918-codepoint font, made by the Google Fonts API according to Sumi's `LICENSE.txt`) that keep the name "Source Serif 4" and Adobe's copyright line with the reservation. Under the OFL a subset is a Modified Version, which may not use a Reserved Font Name. google/fonts publishes the family with an `OFL.txt` that declares no Reserved Font Name, but its font file (`SourceSerif4[opsz,wght].ttf`) carries the same Adobe copyright line. The author decides between the options in PR #124 |
| JetBrains Mono, Latin and Latin Extended subsets (`jetbrains-mono-*.woff2`) | `public/fonts/` (from Sumi) | [JetBrains/JetBrainsMono](https://github.com/JetBrains/JetBrainsMono), version 2.211, "Copyright 2020 The JetBrains Mono Project Authors" | SIL OFL 1.1 | Verified: the fonts' `name` table, the repository's `OFL.txt` (GitHub reports OFL-1.1), and `public/fonts/LICENSE.txt`. These are subsets too, but the upstream `OFL.txt` declares no Reserved Font Name (Sumi's `LICENSE.txt` says "with Reserved Font Name 'JetBrains Mono'"; the upstream license text and the fonts' copyright line do not), so keeping the name is allowed |
| JetBrains Mono Regular, Latin, static TrueType (`jetbrains-mono-latin-400.ttf`; used only at build time for the Open Graph images, never served) | `src/assets/fonts/` (from Sumi) | as above, version 2.211 | SIL OFL 1.1 | Verified: the font's `name` table (copyright, `https://scripts.sil.org/OFL`) and the repository's `OFL.txt`. It sits outside `public/fonts/`, so the license file there does not travel with it; this entry and the OFL text below cover it |
| Noto Serif TC, variable (wght 200–900), subset at build time to the site's glyphs (`dist/fonts/noto-serif-tc/*.woff2`) | built from the npm package `@fontsource-variable/noto-serif-tc` 5.3.1; nothing is committed | [notofonts/noto-cjk](https://github.com/notofonts/noto-cjk) as published by [google/fonts](https://github.com/google/fonts/tree/main/ofl/notoseriftc), version 2.003, "(c) 2017-2024 Adobe"; Noto is a trademark of Google | SIL OFL 1.1, no Reserved Font Name | Verified: the font's `name` table (copyright, `https://openfontlicense.org`), `ofl/notoseriftc/OFL.txt` in google/fonts, and the package's `LICENSE` and `metadata.json` (OFL-1.1). The subset is a Modified Version under the OFL; it keeps the original name, which the OFL allows because no Reserved Font Name is declared |
| KaTeX fonts and stylesheet (copied from the `katex` package into `dist/_astro/` at build time) | `node_modules/katex/` | [KaTeX/KaTeX](https://github.com/KaTeX/KaTeX) | MIT, "Copyright (c) 2013-2020 Khan Academy and other contributors" | Verified: `node_modules/katex/LICENSE` |
| CJK typesetting rules and the callout directive plugin, ported from Retypeset's `src/styles/markdown.css` (heti-based) and `src/plugins/remark-container-directives.mjs` | `src/styles/cjk.css`, `src/lib/markdown/directives.ts` | [radishzzz/astro-theme-retypeset](https://github.com/radishzzz/astro-theme-retypeset) at `a636b6d393be714cab52d3fc4baddd3f3905f701`, through PR #121's head `1b40b32` | MIT, © 2025 radishzz, below | Verified: `LICENSE` at that commit |
| heti (the CJK rules Retypeset's styles are based on) | `src/styles/cjk.css` | [sivan/heti](https://github.com/sivan/heti) | MIT, © 2020 Sivan, below | Verified: the repository's `LICENSE` (GitHub reports MIT) |

Build tools that produce the assets above but are not shipped: `subset-font` 2.9.0 (BSD-3-Clause), which drives HarfBuzz's subsetter through `harfbuzzjs` (MIT, HarfBuzz itself under the "Old MIT" license), and `fontverter` (BSD-3-Clause) for woff2 compression.

## Sumi (MIT)

```
MIT License

Copyright (c) 2026 kpab

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Retypeset and heti (MIT)

The ported rules carry these notices. The license text is the MIT text above, with these copyright lines:

```
Copyright (c) 2025 radishzz        (Retypeset)
Copyright (c) 2020 Sivan           (heti)
```

## SIL Open Font License 1.1

Applies to Source Serif 4, JetBrains Mono, and Noto Serif TC, each under the copyright line in the summary above. The full text ships with the Latin fonts in `public/fonts/LICENSE.txt`, and the build writes it next to the Noto Serif TC subset as `/fonts/noto-serif-tc/OFL.txt`; it is also available at <https://openfontlicense.org>. The OFL permits using, studying, modifying, and redistributing the fonts, bundled with other software, as long as they are not sold by themselves, Reserved Font Names are not used for modified versions, and the copyright notice and license accompany them.
