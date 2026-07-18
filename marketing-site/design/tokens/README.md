# GIEVA token source

`gieva.source.tokens.json` — the curated, **GIEVA-only** design-token source of truth.

## Provenance

Extracted from the Figma **Design Tokens** plugin (Lukas Oppermann) whole-workspace export
by slicing the `gieva.org` namespace out of the `color` and `typography` groups. The raw
export is a shared file containing several other clients' tokens and is **never committed**
(see `.gitignore`). A leak-check asserts no other client namespace is present in this file.

Format: DTCG-style, bare `type`/`value` keys; colours are 8-digit RGBA hex. Consumed by
Style Dictionary in Phase 1 to generate CSS custom properties. See `/TOKENS.md` for the
full audit, the semantic layer, and the known gaps.

## Re-generating / updating

Because tokens are file-scoped in Figma (not page-scoped), a plugin export always contains
the whole workspace — that's expected. To refresh: export the whole workspace again, then
re-slice the `gieva.org` namespace. Do **not** commit the raw multi-client export.

## Known gaps (captured elsewhere, not in this file)

- **NGO brand palette** — only the primary (`#0E3E40`) is known; the rest is uncaptured
  (the export is consultancy-weighted). If the NGO colours exist as Figma variables, a
  second export captures them; otherwise they come via the manual value loop.
- **Spacing, radii, breakpoints** — not published as variables; captured per-screen.
