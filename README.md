# Font Flux JS

Convert a font file to JSON... and back!

## Font formats covered

- OTF (`.otf`) — supported
- TTF (`.ttf`) — supported
- TTC / OTC collections (`.ttc`) — supported (collection container with per-face OTF/TTF parsing/writing)

## Supported tables by format

- Shared SFNT tables (used by both OTF and TTF): `BASE`, `CBDT`, `CBLC`, `COLR`, `CPAL`, `DSIG`, `EBDT`, `EBLC`, `EBSC`, `GDEF`, `GPOS`, `GSUB`, `HVAR`, `JSTF`, `LTSH`, `MATH`, `MERG`, `MVAR`, `OS/2`, `PCLT`, `STAT`, `SVG `, `VDMX`, `VVAR`, `avar`, `cmap`, `fvar`, `hdmx`, `head`, `hhea`, `hmtx`, `kern`, `maxp`, `meta`, `name`, `post`, `sbix`, `vhea`, `vmtx`
- OTF-specific tables: `CFF `, `CFF2`, `VORG`
- TTF-specific tables: `cvar`, `cvt `, `fpgm`, `gasp`, `glyf`, `gvar`, `loca`, `prep`
