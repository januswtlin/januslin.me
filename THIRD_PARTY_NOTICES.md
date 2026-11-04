# Third-party notices

Code, fonts, and other assets in this repository that were not written for it, with their sources and licenses. The project's own code is under `LICENSE` (MIT); the content is under `LICENSE-CONTENT.md`. npm dependencies are not vendored; their licenses come with them in `node_modules/`.

"Unverified" means the license could not be confirmed from a primary source (the asset itself, or its publisher's own repository or site). The author decides whether an unverified asset stays (ADR-0001, V14 in `docs/infra-current-state.md`).

Reviewed 2026-11-04 (T09, #58).

## Summary

| Asset | Where | Source | License | Status |
|---|---|---|---|---|
| Retypeset theme (code, styles, icons, feed stylesheets, the font subset lists and `unicode_range.py`) | `src/`, `astro.config.ts`, `uno.config.ts`, `scripts/apply-lqip.ts`, `public/icons/`, `public/feeds/`, `public/fonts/Font Subset List/` | [radishzzz/astro-theme-retypeset](https://github.com/radishzzz/astro-theme-retypeset) at `a636b6d393be714cab52d3fc4baddd3f3905f701` | MIT, below | Verified: `LICENSE` at that commit |
| Early Summer Serif VF (`EarlySummer-VF-Subset.woff2` and 69 unicode-range split files) | `public/fonts/EarlySummer-VF-Split/` | [GuiWonder/EarlySummerSerif](https://github.com/GuiWonder/EarlySummerSerif), version 1.003, "© 2023-2024 Early Summer Fonts." | SIL OFL 1.1 | Verified: the repository's license (GitHub reports OFL-1.1 for `LICENSE.txt`) and the OFL text shipped next to the files (`EarlySummerSerif License.txt`) |
| STIX Two Text, regular and italic variable fonts (`STIX-VF.woff2`, `STIX-Italic-VF.woff2`) | `public/fonts/` | [stipub/stixfonts](https://github.com/stipub/stixfonts), version 2.13 b171, "Copyright 2001-2021 The STIX Fonts Project Authors" | SIL OFL 1.1, Reserved Font Name "TM Math"; STIX Fonts is a trademark of the IEEE | Verified: `OFL.txt` in that repository; the copyright line is in the fonts' name table |
| Noto Sans SC, Regular and Bold (`NotoSansSC-Regular.otf`, `NotoSansSC-Bold.otf`; used only at build time for the posts' Open Graph images, and copied to `dist/` with `public/`) | `public/fonts/` | [notofonts/noto-cjk](https://github.com/notofonts/noto-cjk), version 2.004, "© 2014-2021 Adobe"; Noto is a trademark of Google | SIL OFL 1.1 | Verified: the license field in the fonts' name table and `Sans/LICENSE` in that repository |
| Snell Roundhand Black and Bold, subsets (`Snell-Black-SF.woff2`, `Snell-Bold-SF.woff2`; the site title and dates) | `public/fonts/` | Retypeset; the fonts' name table says "Copyright © 1981, 1990 Linotype AG", version 1.000, rebuilt with Glyphs 3.3 | **Unverified** | Snell Roundhand is a commercial Linotype (now Monotype) typeface that ships with macOS. The files carry no license field, and neither Retypeset nor any other primary source grants a license to redistribute them or serve them as web fonts. Redistribution may not be permitted. The author decides (V14) |
| UI sound effects (`tap_01` to `tap_05.wav`, `type_01` to `type_05.wav`, about 1 KB each; played on clicks of the language and theme buttons, desktop only, loaded from the site itself) | `public/sounds/` | Retypeset, added in upstream commits `8e9b73c456` and `d68cd9bdc2` (2025-06-11/12) | **Unverified** | Neither commit, the README, nor the files (no metadata chunks, only `fmt` and `data`) name a source or a license. If the theme author made them, they fall under Retypeset's MIT license, but nothing says so. The author decides (V14) |
| KaTeX fonts and stylesheet (copied from the `katex` package into `dist/_astro/` at build time) | `node_modules/katex/` | [KaTeX/KaTeX](https://github.com/KaTeX/KaTeX) | MIT, "Copyright (c) 2013-2020 Khan Academy and other contributors" | Verified: `node_modules/katex/LICENSE` |

## Retypeset (MIT)

```
MIT License

Copyright (c) 2025 radishzz

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

## SIL Open Font License 1.1

Applies to Early Summer Serif, STIX Two Text, and Noto Sans SC, each under the copyright line in the summary above. The full text ships with Early Summer Serif in `public/fonts/EarlySummer-VF-Split/EarlySummerSerif License.txt` and is available at <https://openfontlicense.org>. The OFL permits using, studying, modifying, and redistributing the fonts, bundled with other software, as long as they are not sold by themselves, Reserved Font Names are not used for modified versions, and the copyright notice and license accompany them.
