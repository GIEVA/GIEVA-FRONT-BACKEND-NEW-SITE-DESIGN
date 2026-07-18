# GIEVA — Design Tokens Audit

> The authoritative record of GIEVA's design tokens as extracted from Figma, plus the
> **semantic layer we author on top** (the design didn't export one). Values marked
> _to-confirm_ are inferences to be validated against screens before they're locked.

**Source:** Figma → **Design Tokens** plugin (Lukas Oppermann) export, `gieva.org` branches
only. Format: DTCG-style with bare `type`/`value` keys; colours are 8-digit RGBA hex.
The multi-client export file itself is **not** committed (contains other clients' data);
a GIEVA-only source file will be produced in Phase 0.

> **⚠ GIEVA is two brands.** The site is split into a **Consultancy** site (primary =
> electric violet `#581CFF`) and an **NGO** site (primary = dark teal `#0E3E40`). The
> export is **partial and consultancy-weighted** — the NGO primary and most of its palette
> are **not** in it. Missing brand colours are captured either by a second plugin export
> (if the NGO colours exist as Figma variables — _to check_) or via the manual value loop.
> The two brands are modelled as **two themes over one semantic layer** (see §2).

---

## 1. Colour primitives

Named by hue in Figma. These become `--color-<name>` primitives (generated).

| Token             | Hex (RGBA)  | Opaque hex | Notes                                          |
| ----------------- | ----------- | ---------- | ---------------------------------------------- |
| electric violet   | `#581CFFFF` | `#581CFF`  | The signature brand colour                     |
| violet            | `#120633FF` | `#120633`  | Near-black deep violet — dark surfaces         |
| mine shaft        | `#292929FF` | `#292929`  | Near-black neutral — body text                 |
| mid gray          | `#636366FF` | `#636366`  | Secondary text / muted                         |
| periwinkle        | `#CAD3FFFF` | `#CAD3FF`  | Light violet tint                              |
| outrageous orange | `#FF5A3EFF` | `#FF5A3E`  | Warm accent                                    |
| chartreuse yellow | `#E1FF01FF` | `#E1FF01`  | Bright accent — **dark-surface only** (see §3) |
| aqua              | `#00F5F1FF` | `#00F5F1`  | Bright accent — **dark-surface only** (see §3) |
| green             | `#007F0EFF` | `#007F0E`  | Likely semantic (success)                      |
| orange            | `#E65320FF` | `#E65320`  | Likely semantic (warning)                      |
| white 10%         | `#FFFFFF1A` | —          | Overlay / hairline on dark                     |
| white 25%         | `#FFFFFF40` | —          | Overlay / border on dark                       |
| black 0%          | `#00000000` | —          | Transparent                                    |

## 2. Semantic colour layer — **two brand themes** _(to-confirm)_

Components consume **these semantic tokens**, never primitives directly. Each token takes a
value **per brand**; switching brand = swapping one value-set (e.g. scoped under
`[data-brand="consultancy"]` / `[data-brand="ngo"]` at the root). This is the whole reason
the semantic layer exists. Consultancy values come from the export; NGO values are
**to-capture** (partial palette — see the warning above).

| Semantic token             | Consultancy                 | NGO                             | Role                          |
| -------------------------- | --------------------------- | ------------------------------- | ----------------------------- |
| `--color-action-primary`   | electric violet `#581CFF`   | dark teal `#0E3E40`             | Primary buttons, links, focus |
| `--color-surface-default`  | white `#FFFFFF`             | white / cream _(capture)_       | Page background               |
| `--color-surface-inverse`  | violet `#120633`            | dark teal `#0E3E40` _(confirm)_ | Dark sections                 |
| `--color-text-default`     | mine shaft `#292929`        | mine shaft _(confirm)_          | Body text on light            |
| `--color-text-muted`       | mid gray `#636366`          | _(capture)_                     | Secondary text                |
| `--color-text-inverse`     | white                       | white                           | Text on dark surfaces         |
| `--color-accent-warm`      | outrageous orange `#FF5A3E` | _(capture — orange `#E65320`?)_ | Accents / highlights          |
| `--color-accent-bright`    | chartreuse / aqua           | green `#007F0E` _(confirm)_     | Display / CTA accents         |
| `--color-border-subtle`    | periwinkle / white 10–25%   | _(capture)_                     | Hairlines                     |
| `--color-feedback-success` | green `#007F0E`             | green _(confirm)_               | Success states                |
| `--color-feedback-warning` | orange `#E65320`            | _(capture)_                     | Warning states                |

Primitives are shared across brands where they genuinely match; brand-specific primitives
(e.g. NGO teal) get their own `--color-*` names. `_(capture)_` = read exact hex from Figma
(second plugin export if variables exist, else manual loop).

## 3. Contrast & usage guidance

Every foreground/background pairing will be computed and validated in the `/styleguide`
route against WCAG 2.2 (AA min, AAA where achievable). Directional notes already clear:

- **electric violet on white** — strong; comfortably AA for text, close to the AAA line.
- **chartreuse yellow / aqua on white** — very low contrast; these **fail** as text on
  light. Reserve for **large display accents or use on the `violet` dark surface**, where
  they sing and pass.
- **mine shaft / mid gray on white** — the workhorse text pairings; validate mid-gray at
  small sizes.

---

## 4. Typography

**Family: Arial — confirmed** (system font, no web-font loading; zero FOUT, survives a
failed network). Shared across both brands. `letterSpacing`/`lineHeight` are in px.

Full extracted styles, sorted by size:

| Figma name                     | Size / line-height | Weight | Tracking | Decoration |
| ------------------------------ | ------------------ | ------ | -------- | ---------- |
| semantic / heading 1           | 110 / 120          | 400    | −3.3     | —          |
| heading 2                      | 48 / 56            | 700    | −0.26    | —          |
| semantic / heading 5           | 48 / 52            | 400    | −1.44    | —          |
| heading 3                      | 40 / 48            | 700    | 0        | —          |
| semantic / heading 3 underline | 40 / 44            | 400    | −1.2     | underline  |
| bold                           | 24 / 32            | 700    | −1.2     | —          |
| regular underline              | 18 / 24            | 400    | 0        | underline  |
| regular                        | 14 / 20            | 400    | 0        | —          |
| narrow                         | 14 / 20            | 400    | −0.14    | —          |
| options                        | 14 / 21            | 400    | −0.14    | —          |

### Proposed rationalised scale _(to-confirm)_

The Figma naming is inconsistent (no "heading 4"; H1 is weight 400 while H2/H3 are 700).
Proposed coherent scale — names map to intent, values preserved exactly:

| Semantic token      | Size / LH | Weight | From      |
| ------------------- | --------- | ------ | --------- |
| `--type-display`    | 110 / 120 | 400    | heading 1 |
| `--type-h2`         | 48 / 56   | 700    | heading 2 |
| `--type-h3`         | 40 / 48   | 700    | heading 3 |
| `--type-title`      | 48 / 52   | 400    | heading 5 |
| `--type-lead`       | 24 / 32   | 700    | bold      |
| `--type-body`       | 14 / 20   | 400    | regular   |
| `--type-body-tight` | 14 / 20   | 400    | narrow    |
| `--type-caption`    | 14 / 21   | 400    | options   |

Underline variants (`regular underline`, `heading 3 underline`) become a `text-decoration`
modifier, not separate scale steps.

---

## 5. Gaps — built by us, not exported

| System                           | Status                                          | How it's produced                                                                                        |
| -------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Spacing**                      | Not in Figma variables                          | **Manual loop** — per screen, requested values read off Figma by the client and recorded here per-screen |
| **Radii / borders**              | Not exported                                    | Same manual loop                                                                                         |
| **Breakpoints / responsive**     | Not GIEVA's (shared branch is another client's) | Derived from screen exports                                                                              |
| **Semantic colour + type layer** | Not exported                                    | Authored here (§2, §4), confirmed per-screen                                                             |
| **Motion tokens**                | N/A (Phase 4)                                   | Authored in Phase 4 (durations/easings), reduced-motion aware                                            |

---

## 6. Naming convention

- **Primitives:** `--color-electric-violet`, `--font-size-110`, `--line-height-120`
  (generated by Style Dictionary from the GIEVA-only source).
- **Semantic:** `--color-action-primary`, `--type-display`, `--space-*` (authored;
  components use these).
- **Spacing** (once measured): a small named scale, e.g. `--space-2xs … --space-3xl`,
  snapped to the discrete values found on screens.

---

## 7. To-confirm checklist

- [x] Font is Arial — confirmed
- [ ] **Do NGO brand colours exist as Figma variables?** (yes → 2nd plugin export; no → manual loop)
- [ ] Capture full **NGO palette** (surfaces, text, accents) — only primary `#0E3E40` known so far
- [ ] Semantic colour mappings per brand (§2)
- [ ] Rationalised type scale (§4), incl. dropping the phantom "heading 4"
- [ ] Whether the two brands share the type scale (likely yes) or diverge
- [ ] Which accents are dark-surface-only (chartreuse, aqua)
- [ ] Breakpoint set (from screens)
