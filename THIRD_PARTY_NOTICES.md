# Third-party notices

Code, fonts, and other assets in this repository that were not written for it, with their sources and licenses. The project's own code is under `LICENSE` (MIT); the content is under `LICENSE-CONTENT.md`. npm dependencies are not vendored; their licenses come with them in `node_modules/`.

"Unverified" means the license could not be confirmed from a primary source (the asset itself, or its publisher's own repository or site). The author decides whether an unverified asset stays (ADR-0001, V14 in `docs/infra-current-state.md`).

No asset in the repository is unverified. On 2026-11-04 the author removed the two that were (V14):
- **Snell Roundhand Black and Bold** (`Snell-Black-SF.woff2`, `Snell-Bold-SF.woff2`, from Retypeset). Their name table said "Copyright © 1981, 1990 Linotype AG": Snell Roundhand is a commercial Linotype (now Monotype) typeface, and no license to redistribute it or serve it as a web font was found. Pinyon Script, an OFL copperplate script, replaces it.
- **The ten UI sound effects** (`public/sounds/tap_0*.wav`, `type_0*.wav`, from Retypeset upstream commits `8e9b73c456` and `d68cd9bdc2`). No source or license was stated anywhere upstream. The files and the code that played them are removed.

Reviewed 2026-11-04 (T09, #58).

## Summary

| Asset | Where | Source | License | Status |
|---|---|---|---|---|
| Retypeset theme (code, styles, icons, feed stylesheets, the font subset lists and `unicode_range.py`) | `src/`, `astro.config.ts`, `uno.config.ts`, `scripts/apply-lqip.ts`, `public/icons/`, `public/feeds/`, `public/fonts/Font Subset List/` | [radishzzz/astro-theme-retypeset](https://github.com/radishzzz/astro-theme-retypeset) at `a636b6d393be714cab52d3fc4baddd3f3905f701` | MIT, below | Verified: `LICENSE` at that commit |
| Early Summer Serif VF (`EarlySummer-VF-Subset.woff2` and 69 unicode-range split files) | `public/fonts/EarlySummer-VF-Split/` | [GuiWonder/EarlySummerSerif](https://github.com/GuiWonder/EarlySummerSerif), version 1.003, "© 2023-2024 Early Summer Fonts." | SIL OFL 1.1 | Verified: the repository's license (GitHub reports OFL-1.1 for `LICENSE.txt`) and the OFL text shipped next to the files (`EarlySummerSerif License.txt`) |
| STIX Two Text, regular and italic variable fonts (`STIX-VF.woff2`, `STIX-Italic-VF.woff2`) | `public/fonts/` | [stipub/stixfonts](https://github.com/stipub/stixfonts), version 2.13 b171, "Copyright 2001-2021 The STIX Fonts Project Authors" | SIL OFL 1.1, Reserved Font Name "TM Math"; STIX Fonts is a trademark of the IEEE | Verified: `OFL.txt` in that repository; the copyright line is in the fonts' name table |
| Noto Sans SC, Regular and Bold (`NotoSansSC-Regular.otf`, `NotoSansSC-Bold.otf`; used only at build time for the posts' Open Graph images, and copied to `dist/` with `public/`) | `public/fonts/` | [notofonts/noto-cjk](https://github.com/notofonts/noto-cjk), version 2.004, "© 2014-2021 Adobe"; Noto is a trademark of Google | SIL OFL 1.1 | Verified: the license field in the fonts' name table and `Sans/LICENSE` in that repository |
| Pinyon Script, Latin subset, regular (`PinyonScript-latin-400.woff2`; the site title and dates, replacing Snell Roundhand) | `public/fonts/` | [SorkinType/Pinyon](https://github.com/SorkinType/Pinyon), "Copyright 2022 The PinyonScript Project Authors"; the file is copied from the npm package `@fontsource/pinyon-script` 5.3.0 (`files/pinyon-script-latin-400-normal.woff2`), no runtime dependency | SIL OFL 1.1 | Verified: `OFL.txt` in SorkinType/Pinyon (GitHub reports OFL-1.1), and the package's `LICENSE` and `metadata.json`. The license text ships next to the file as `PinyonScript OFL.txt` |
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

Applies to Early Summer Serif, STIX Two Text, Noto Sans SC, and Pinyon Script, each under the copyright line in the summary above. The full text ships with Early Summer Serif in `public/fonts/EarlySummer-VF-Split/EarlySummerSerif License.txt` and with Pinyon Script in `public/fonts/PinyonScript OFL.txt`, and is available at <https://openfontlicense.org>. The OFL permits using, studying, modifying, and redistributing the fonts, bundled with other software, as long as they are not sold by themselves, Reserved Font Names are not used for modified versions, and the copyright notice and license accompany them.
