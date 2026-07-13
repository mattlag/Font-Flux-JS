# Offline font-format specifications

This folder contains an **offline mirror of the Microsoft OpenType® specification**
so the OTF/TTF format can be referenced without a network connection.

## What's here

| Path                                         | Contents                                                              |
| -------------------------------------------- | --------------------------------------------------------------------- |
| [`opentype/index.html`](opentype/index.html) | Spec table of contents — start here                                   |
| `opentype/*.html`                            | 68 pages: core chapters, appendices, and every font-table reference   |
| `opentype/media/`                            | Figures/diagrams referenced by the pages (downloaded for offline use) |
| [`download-spec.mjs`](download-spec.mjs)     | Regenerator script (see below)                                        |

Open `opentype/index.html` in any browser. Pages are self-contained: intra-spec
links point at the local `.html` copies and images resolve from `media/`.

### Coverage

- **Core chapters** — overview, font file structure (`otff`), OpenType Layout
  (`ttochap1`, `chapter2`), font variations (`otvaroverview`, `otvarcommonformats`).
- **TrueType (TTF)** outlines and hinting — `glyf`, `loca`, plus the instruction
  appendices (`ttch01`, `tt_instructing_glyphs`, `tt_instructions`,
  `tt_graphics_state`), and the `gasp`/`prep`/`fpgm`/`cvt` tables.
- **PostScript/CFF (OTF)** outlines — `cff`, `cff2`, `vorg`.
- **All registered font tables** — `cmap`, `head`, `hhea`, `hmtx`, `maxp`,
  `name`, `os2`, `post`, `GSUB`, `GPOS`, `GDEF`, `BASE`, `JSTF`, `MATH`, color
  tables (`COLR`, `CPAL`, `CBDT`, `CBLC`, `sbix`, `SVG`), bitmap tables
  (`EBDT`, `EBLC`, `EBSC`), variation tables (`fvar`, `avar`, `gvar`, `HVAR`,
  `MVAR`, `STAT`, `cvar`), and more.
- **Appendices** — recommendations (`recom`), the Layout Tag Registry (`ttoreg`),
  the Design-Variation Axis Tag Registry (`dvaraxisreg`), the mirroring-pairs
  list (`ompl`), the glyph-format comparison, and the change log.

## What is _not_ mirrored

- **Apple's TrueType Reference Manual (TTRM)** is **all-rights-reserved**
  ("No licenses, express or implied, are granted") and is therefore **not**
  copied here. Reference it online:
  <https://developer.apple.com/fonts/TrueType-Reference-Manual/>.
  The Apple-only tables `bdat`, `bloc` and `ltag` live only in the TTRM; the
  OpenType equivalents (`EBDT`/`EBLC`/`CBDT`/`CBLC`) are included above.
- **Adobe CFF / Type 2 Charstring** technical notes (#5176, #5177) are
  copyrighted by Adobe and only linked from the CFF pages, not mirrored.
- **ISO/IEC 14496-22 (Open Font Format)** is freely downloadable from ISO:
  <https://standards.iso.org/ittf/PubliclyAvailableStandards/>.

## Licensing / attribution

The OpenType specification text is published by Microsoft on Microsoft Learn and
is made available under the **Creative Commons Attribution 4.0 International
(CC BY 4.0)** license. Source pages:
<https://learn.microsoft.com/en-us/typography/opentype/spec/>.
OpenType is a registered trademark of Microsoft Corporation. This mirror is
provided for offline developer reference only; the canonical, authoritative
version is the online one.

## Regenerating / updating the mirror

```pwsh
# Refresh every page (re-downloads HTML + images):
node specs/download-spec.mjs

# Refresh a subset only:
node specs/download-spec.mjs cmap head glyf
```

The script (Node 18+, uses built-in `fetch`, no dependencies) downloads each
page, extracts the article body, pulls in referenced images, and rewrites
intra-spec links to the local copies.
