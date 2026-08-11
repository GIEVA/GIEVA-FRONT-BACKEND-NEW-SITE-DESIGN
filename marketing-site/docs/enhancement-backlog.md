# Enhancement backlog — Phase 4 "delight", captured while it's fresh

> Read this alongside `CLAUDE.md` non-negotiable #1 ("exact-replica first, delight second") and
> `WORKFLOW.md` §Phase 4 ("only after parity sign-off... kept in separate, clearly-scoped
> commits"). Craft ideas surface _during_ parity work — that's when you're staring at the
> geometry closely enough to see them — but they must not be built then. This file is where they
> wait, with enough detail that the idea doesn't have to be re-derived months later.
>
> Nothing here is a commitment. An entry earns implementation by (a) its parity dependency being
> signed off, and (b) surviving the "why it earns its place" test below. Ideas that don't survive
> stay here as **Rejected** with the reason — a recorded no is worth as much as a yes, because it
> stops the same idea being re-proposed every few months.

## How entries work

Each entry carries:

- **Where** — the concrete element and route, not a vibe.
- **Effect** — one line, what the user perceives.
- **Mechanism** — enough of a sketch that the thinking isn't lost. Not final code.
- **Depends on** — the parity work it keys off. An effect pinned to geometry cannot be built
  before that geometry is signed off, or it silently breaks when the geometry moves.
- **Gates** — what it must satisfy before it ships. Every entry answers all five:
  `prefers-reduced-motion`, input modality, JS-disabled baseline, contrast impact, and whether it
  perturbs the visual-regression baselines.
- **Why it earns its place** — the justification that separates craft from garnish. If the only
  answer is "it looks cool", the entry is a Reject waiting to happen.
- **Status** — Proposed → Prototyped → Accepted → Shipped, or Rejected.

The JS-disabled gate is the load-bearing one: per non-negotiable #3, every effect here layers on
top of a design-accurate static baseline. If an enhancement is what _makes_ something look right,
it's not an enhancement — it's unfinished parity work.

---

## E-01 — Fluted-glass cursor highlight on the service cards

**Status:** Proposed (2026-07-26)

- **Where:** `.services__card` × 3, Consultancy Home (`/`), Consultancy Services section.
- **Effect:** the glass stripes catch a soft highlight that follows the pointer within a card,
  broken up by the ribs the way real fluted glass segments a light source.
- **Mechanism:** the cards' backdrop is a flat `#291e47`, so there is nothing behind the panes to
  refract or blur — this is why the design's 2.5px pane blur was dropped as a no-op. The only
  physically honest response is **specular, not refractive**: the light moves, the panes don't.
  - A `::after` layer carrying a pointer-anchored highlight, masked by a
    `repeating-linear-gradient` on the same 10% tile rhythm as the stripes, so it is chopped into
    the ribs instead of floating over them as a torch beam:

    ```css
    background: radial-gradient(
      260px circle at var(--glass-x) var(--glass-y),
      rgb(255 255 255 / 0.1),
      transparent 70%
    );
    mask-image: repeating-linear-gradient(to right, #000 0 35%, transparent 35% 100%);
    mask-size: 10% 100%;
    ```

  - Optionally shift the base stripe layer's `background-position-x` a few px with pointer X, so
    the panes read as tilting toward the cursor. This second part is what sells it as glass.
  - One delegated `pointermove` on `.services__grid`; positions written as custom properties
    inside a `requestAnimationFrame`; element rects cached and invalidated on resize/scroll so
    the handler never reads layout. Custom-property writes on a background invalidate paint only.
  - A light lerp (~0.15) toward the target gives the highlight some mass. Too much reads broken
    rather than heavy.
- **Depends on:** the service-card glass geometry (10% tiles, precomputed OVERLAY colours) being
  signed off. The mask rhythm is keyed to the tile size — change the tiles and this must follow.
- **Gates:**
  - `prefers-reduced-motion: reduce` → not applied at all.
  - `@media (pointer: fine)` only; touch and keyboard users get the static card, which is the
    design-accurate one.
  - JS-disabled baseline: `::after` starts at `opacity: 0`, so no JS means exactly today's
    render. The enhancement cannot regress parity.
  - Contrast: a white highlight _raises_ background luminance under white body text. At 10% over
    `#291e47` it should stay comfortably AA, but compute it with `src/lib/contrast.ts` rather
    than eyeball it — the result caps how bright the highlight may go.
  - Visual baselines: unaffected. No pointer in a screenshot run, so the effect never fires.
- **Why it earns its place:** the design already commits to a fluted-glass surface; this makes
  the material behave like the material it depicts, rather than adding an unrelated flourish.
- **Open question:** whether 10% white lands the fluted reading on its own, or whether the
  pane-shift is required. Answerable only by prototyping on a throwaway branch.

---

## E-02 — Animating the GIEVA mark

**Status:** **Rejected (2026-08-07)** — three working prototypes built and all three declined on
aesthetic grounds. The _technical_ findings below are durable and worth keeping; the _idea_ is
closed. Do not re-propose without new visual direction from the client.

Originally Proposed 2026-07-26 as "rotating GIEVA mark". Explored in full on 2026-08-07.

### Where

- **(a) The hero ring** — `heroRing`, an 818×818 decorative PNG at `index.astro:146`, `alt=""`,
  Consultancy Home only.
- **(b) The GIEVA logo mark** — `logoMark`, the striped globe in `BrandLockup.astro:52`, present
  on **every route of both brands**, at 48px.

All prototyping targeted (a). At (b)'s 48px, any per-band treatment is close to invisible, which
is itself a finding: if this is ever revisited, it is a hero-only effect.

### Finding 1 — there is no vector master, and probably never was

**The mark is a bitmap in every copy that exists**, including inside Figma, where it is a raster
image _fill_ rather than vector geometry. A file exported as `.svg` and supplied as "the logo as
an SVG" was:

```
path/circle/ellipse elements   0
rect                           1   ← filled with a <pattern>
image                          1   ← base64 PNG, 1024×1024 RGBA
```

That is Figma wrapping a bitmap, not vectorising it — the file renders correctly in any viewer,
which is exactly why it is a trap. The supplied file was named `Gemini_Generated_Image_…`,
suggesting the artwork originated as a generated image. **Before anyone spends time hunting for
a vector master, confirm with the brand owner that one exists.**

### Finding 2 — the mark is not a geometric projection, so it cannot be reconstructed

The obvious route — rebuild the mark parametrically as three identical circles at a common tilt,
orthographically projected — **does not work, and cannot.** Orthographic projection preserves a
circle's semi-major axis regardless of tilt, so three identical circles must fit with the same
radius. Fitting each band independently against its own hue mask:

```
R      = 0.742  0.742  0.626     spread 16.6% of mean
theta  = 61.4°  60.7°  84.9°     spread 24°
```

Best whole-silhouette fit topped out at **IoU 0.76** (holes land rotated out of phase). Two
independent optimisers — coordinate descent, and Nelder-Mead with 60 random restarts — reached
the same place, so this is not a stuck solver.

**Conclusion: the rings were drawn for visual balance, not projected from a 3D model.** Normal
for a logo, and fatal to parametric reconstruction. There are no consistent parameters to find.

### Finding 3 — auto-tracing the artwork is the wrong tool

Simulating Inkscape's Trace Bitmap → Colors (quantise, trace each colour layer):

| Colours | Paths |   Size |
| ------: | ----: | -----: |
|       8 |   216 |  89 KB |
|      16 |   326 | 124 KB |
|      32 |   406 | 180 KB |

Fewer colours bands the gradient into flat steps; more colours means hundreds of paths. Either
way the paths are **colour regions, not bands** — a single sliver can span two ribbons, so there
is no band to address, and the ones straddling a boundary cannot be assigned at all.

### Finding 4 — what _did_ work: hue segmentation → per-band stencils

Segmenting the artwork by hue separates the three bands cleanly and automatically (at 512²:
green 26,234 px · orange 28,387 px · blue 16,843 px; the unassigned 15% is the dark maroon inner
walls). Running potrace on each mask gives **one path per band**, 16 KB total, registering
against the real artwork rather than approximating it.

Fitted per-band ellipse geometry (minimum-area enclosing ellipse; `tilt` is the ellipse's
major-axis angle in the image plane, not a 3D tilt):

| Band   | Foreshortening b/a |   Tilt | Originally visible |
| ------ | -----------------: | -----: | -----------------: |
| green  |              0.558 | 149.7° |                54% |
| orange |              0.627 | 149.9° |                49% |
| blue   |              0.566 | 151.0° |                40% |

The three tilts agree within 1.4° despite being fitted independently.

### The three prototypes (all declined)

1. **Highlight sweep** — a specular travelling around each band via its stencil.
2. **True per-band rotation** — the one that actually delivers the original request. Rotate the
   band _content_ inside a _static_ stencil: since the silhouette encodes the weave and never
   moves, the interlock is preserved by construction. A ring tilted in 3D projects to an ellipse,
   so rotation within the ring's own plane is **`M = E·R(α)·E⁻¹`** — un-squash to a circle,
   rotate, re-squash. A 2×2 matrix, emitted as 36 CSS keyframes per band; the animation itself is
   pure CSS. Only 40–54% of each ring was ever visible, so each was unwrapped into angle × radius
   space and the hidden spans interpolated along the ring to avoid gaps rotating into view.
3. **Shimmer** — a light sweep masked to the mark's own alpha. Simplest by far; no band
   separation, no inpainting.

### Why "just rotate the three paths" was never going to work

Worth recording, because it is the intuitive first idea and it is wrong for non-obvious reasons.
It is right for icons; icons are flat, drawn _in_ the screen plane, and don't interlock.

- Each band is a circle **tilted in 3D**. Rotating its ellipse in the screen plane yields the
  projection of a ring whose _tilt has changed_ — the object tumbles, it doesn't spin.
- A ring genuinely spinning about its own axis has an **invariant silhouette**. Nothing moves.
  What sells the motion is the shading travelling while the shape stays.
- Rotating a path does the **exact opposite**: geometry moves and the baked-in shading goes with
  it, i.e. the light source rotates along with the object.
- The bands weave, so any real rotation needs depth order recomputed mid-cycle.

### Reusable gotcha — `mask` creates a stacking context

Hit while building the shimmer, and worth keeping: putting `mix-blend-mode: plus-lighter` on the
_moving child_ inside a masked wrapper composites it against transparency, washing the mark grey.
The blend must go on the **masked wrapper** so the group composites against the artwork beneath.
Correspondingly, the mask must sit on a _static_ wrapper with the gradient moving inside it — a
mask on the moving element travels with it and the effect cancels out.

### Gates (recorded for any future attempt)

- `prefers-reduced-motion: reduce` → static. Non-negotiable for anything continuous.
- Input modality: hover-driven needs a focus equivalent, or it stays purely decorative.
- JS-disabled baseline: the static `<img>` is the baseline in every variant; all three prototypes
  layer on top and none is what makes the mark look right.
- Contrast: none — decorative imagery, no text over it.
- Visual baselines: **anything continuous breaks them**, since a screenshot catches it mid-cycle.
  Needs pausing in test runs — a standing argument for on-load-once or interaction-driven.
- `alt=""` stays on the hero ring; motion doesn't make it meaningful content.

### Artefacts

Published, interactive (both still live):

- Rotation + highlight study — <https://claude.ai/code/artifact/aef9efca-9f89-4097-a813-bdf143413ed4>
- Shimmer study, incl. drop-in component code — <https://claude.ai/code/artifact/38590c6c-eb51-4a06-95c7-775570dd1944>

Working files, local to Akintayo's machine at `~/Downloads/gieva-logo-analysis/` (~3.9 MB) —
**not committed**, since none of it ships:

- `scripts/` — segmentation, ellipse fitting, unwrap/inpaint, page builders. These regenerate
  everything else, and are the part actually worth keeping.
- `assets/` — traced band paths (`band_*.svg`), band masks (`band_*.pbm`), gap-filled rings
  (`spin_*.png`), fitted geometry (`spin_info.json`).
- `demos/` — the two prototype pages as built.
- Diagnostic renders: `segments.png` (the band separation), `registration.png` (traced outlines
  over the artwork), `rings.png`, `frames.png`, `fit*_compare.png`.

---

## E-03 — Animated open/close on the FAQ accordion

**Status:** Proposed (2026-07-28)

- **Where:** `.faq__item` × 4, Consultancy Home (`/`), FAQ section (`index.astro`). The items are
  native `<details name="faq">` — an exclusive accordion, so **every open animates a close of a
  sibling at the same time**. That pairing is the whole design problem here; a single-panel
  accordion would be a much easier entry than this one.
- **Effect:** answers grow and collapse instead of snapping, and the `+` → `×` already-transitioned
  toggle stops being the only thing that moves.
- **Mechanism:** `<details>` has historically been unanimatable because its collapsed state is
  `content-visibility: hidden` and its height is `auto` at both ends. Two modern CSS features
  remove both blockers, and it's worth being precise about which does what:
  - `interpolate-size: allow-keywords` on `:root` makes `height: 0 → auto` interpolable. This is
    what removes the old JS `scrollHeight` measuring dance entirely.
  - `transition-behavior: allow-discrete` plus `@starting-style` keeps the element rendered
    through the closing transition, instead of it vanishing on frame one.

    ```css
    .faq__item::details-content {
      block-size: 0;
      overflow: hidden;
      transition:
        block-size var(--motion-base) var(--easing-standard),
        content-visibility var(--motion-base) allow-discrete;
    }
    .faq__item[open]::details-content {
      block-size: auto;
    }
    ```

  - `::details-content` is the wrapper the browser generates around everything after `<summary>`,
    so this needs **no extra markup** — the current single `<p class="faq__answer">` child stays
    as it is.
- **Depends on:** FAQ section parity sign-off. Also read together with **E-04**: animating the
  height is what makes the scroll shift E-04 describes _visible as motion_ rather than an instant
  jump, and E-04's compensation has to target the settled height, not the mid-transition one. If
  both ship, they ship together or the pairing fights itself.
- **Gates:**
  - `prefers-reduced-motion: reduce` → drop to `transition: none`; the state change still happens,
    instantly, exactly as today.
  - Input modality: none — this is driven by the `open` state, so pointer, keyboard, and
    programmatic opens all behave identically. No hover-only path to compensate for.
  - JS-disabled baseline: **zero JS involved.** Pure CSS on a native element; JS-off is
    indistinguishable from JS-on. The strongest baseline story of any entry here.
  - Contrast: none — no colour changes, only box size.
  - Visual baselines: **unaffected in principle but a real flake risk.** Nothing is `open` at load,
    so a screenshot run catches the closed state and matches today's baseline. But any future test
    that opens a panel then screenshots would race the transition and must wait for `transitionend`
    rather than a fixed timeout.
  - Browser support is narrower than the `name` attribute this builds on: `interpolate-size` and
    `::details-content` are Chromium-129+ and Safari-26+, **not in Firefox** as of this writing.
    Non-supporting browsers get today's instant toggle, which is the design-accurate state — so
    this degrades to parity rather than to something broken. Confirm current support at build time
    rather than trusting this line.
- **Why it earns its place:** the section already animates the `+`/`×` toggle on a
  `var(--motion-base)` transition, so a panel that snaps open next to a rotating icon reads as an
  unfinished transition rather than a deliberate absence of one. This finishes a motion the design
  already started. It is also the rare enhancement with no JS and no reduced-motion ambiguity.
- **Open question:** whether the closing sibling and the opening one should share a duration, or
  whether the close should lead slightly so the list doesn't appear to bulge mid-swap. Only
  answerable by prototyping.

---

## E-04 — Pin the clicked FAQ question under the cursor

**Status:** Proposed (2026-07-28) — _contingent; may never be needed at four items_

- **Where:** `.faq__list`, Consultancy Home (`/`). A consequence of the exclusive accordion
  (`<details name="faq">`), not of any visual choice.
- **Effect:** clicking a question never moves that question. Today, opening an item **below** the
  currently-open one collapses a panel above it, and everything under that panel — including the
  question just clicked — slides up out from under the pointer. The reverse direction is fine:
  closing something below you changes nothing above it. So this is a **directional** problem, and
  only bites on a downward click.
- **Mechanism:** measure-and-compensate, on the clicked element rather than on the list:
  1. On `summary` pointerdown/click, record `summary.getBoundingClientRect().top`.
  2. After the browser has applied the new `open` state, measure again.
  3. `window.scrollBy({ top: after - before, behavior: 'instant' })`.

  The delta is exactly the collapsed panel's height, but measuring beats computing it — it stays
  correct if the geometry changes. Worth knowing what _doesn't_ work here:
  - **Scroll anchoring** (`overflow-anchor`, on by default) is the platform's built-in answer to
    this exact class of bug, and it is genuinely the "right" mechanism. It is not usable as _the_
    solution because WebKit has never shipped it — so Safari would keep the jump. Treat it as a
    free improvement that already applies in Chromium/Firefox, not as a plan.
  - **Reserving space** (a `min-block-size` on `.faq__item` sized to the tallest answer) is the
    only CSS-only fix, and it defeats the accordion: the section would occupy its fully-expanded
    height permanently.

- **Depends on:** **E-03.** If the height animates, the post-toggle measurement in step 2 reads a
  mid-transition height, and a single `scrollBy` would compensate for a distance the layout is
  still travelling. Shipping both means either compensating continuously across the transition
  (rAF loop until `transitionend`) or scrolling on the same curve as the height. Shipping E-04
  against an instant toggle is far simpler — which is an argument for doing this one _first_, or
  for accepting that the pair is a single piece of work.
- **Gates:**
  - `prefers-reduced-motion: reduce` → still applies, and arguably matters _more_: the whole point
    is to remove unrequested movement. Compensation must be instant, never smooth-scrolled.
  - Input modality: pointer-driven by name, but keyboard `Enter` on a focused summary has the same
    problem and the same fix — hook the `toggle`/`click` state change, not the pointer.
  - JS-disabled baseline: this is the one entry here that **is** JS. Without it the accordion works
    exactly as it does today, jump included — degraded comfort, never degraded function or parity.
  - Contrast: none.
  - Visual baselines: unaffected; scroll position isn't captured, and nothing is open at load.
- **Why it earns its place:** conditional. At four short answers the collapse distance is small and
  the whole list is near the top of a section, where the jump is legible rather than disorienting.
  This earns its place **if the FAQ list grows** (more items, or longer answers), and probably not
  before. Recorded now because the reasoning is cheap to lose and expensive to re-derive.
- **Open question:** whether to fix this at all versus sidestepping it — dropping the exclusive
  `name` and letting panels stack open removes the cause entirely. That is a product decision about
  the accordion's behaviour, not a motion decision, and it should be made deliberately rather than
  arrived at by finding this hard.
