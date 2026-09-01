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

**Status:** **Reopened (2026-08-24)** — new visual direction given: the mark may be **rebuilt in
3D and the 3D version becomes canonical**. The 2026-08-07 rejection below still stands _for the
2D prototypes_, and its technical findings remain durable; see "The 3D rebuild" at the end of
this entry for what supersedes them and what does not.

> Previously: **Rejected (2026-08-07)** — three working prototypes built and all three declined
> on aesthetic grounds.

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

### The 3D rebuild (2026-08-24)

New direction from Akintayo: model the mark in Blender and let the 3D version become the
canonical mark, accepting that it will not be pixel-identical to the drawn artwork at rest.
Generator, fitted parameters and reference renders live in **`design/blender/`** — read that
README before touching this.

**What this supersedes.** Finding 2 above ("the mark is not a geometric projection, so it cannot
be reconstructed") was stated too broadly. What failed in 2026-08 was a _constrained_ fit —
three **identical** circles at a **common** tilt, which forced IoU 0.76. Per-band unconstrained
fits are usable, and a coaxial single-sphere model reaches silhouette IoU **0.81**. Findings 1,
3, 4 and the `mask` stacking-context gotcha are unaffected.

**Why per-band ellipse fits mislead.** Each band is only 40–54% visible (the others occlude it),
so an ellipse fitted to the visible fragment has a centroid **biased away from its true centre**.
Fitting bands independently scatters them diagonally and cannot recover a shared centre. This is
what sent the first 18-parameter model wrong.

**The finding that reframes the whole request.** Rotating the mark about its own axis is
**invisible** — measured at **0.01%** of pixels changed across 90°, i.e. numerical noise. Every
band is a surface of revolution about the sphere's axis, so rotating about that axis maps each
band exactly onto itself. Earth reads as spinning because it has continents; these bands have no
features around their circumference. **Any faithful 3D "globe of three bands" has this
property.** Adding surface features to fix it was considered and rejected as disfiguring the
mark.

Measured option matrix (render at 0° and 90°, count pixels changed >2%, check silhouette IoU
against the resting frame):

| approach                     | motion @90° | mark holds shape | verdict         |
| ---------------------------- | ----------: | ---------------: | --------------- |
| own-axis spin                |       0.01% |            1.000 | invisible       |
| **light orbits, mark fixed** |   **37.5%** |        **1.000** | **chosen**      |
| 12° precession               |       38.7% |            0.640 | nods, unsettled |
| interlocked tumble           |       44.0% |            0.522 | mark breaks up  |

**Decision: light orbit** (Akintayo, 2026-08-24). Precession was declined — it reads as the mark
nodding. Tumble was ruled out; the bands visibly separate by ~60°.

**Why this is not E-02 prototype 3 again.** The obvious objection is that "light sweep" is the
shimmer already declined. It is not the same effect, and the difference is measurable. The 2D
shimmer is an additive white wash with no knowledge of form, so it **desaturates the brand
colours by ~22%** every pass (mean saturation swings 0.767→0.600 on the artwork, 0.669→0.518 on
the 3D render). Real 3D lighting changes which surfaces catch light while holding saturation to
**0.3%**. Same geometry, only the technique differs — `renders/shimmer-2d-vs-3d.webp`. The 2D
version reads as glare on glass; the 3D version reads as light moving around an object. This
removes the specific defect; it does not guarantee the result clears the bar the 2D version
missed.

### Static-fidelity pass (2026-08-24) — awaiting sign-off on the resting frame

The gaps listed when the model was first built have been worked through against a measured
scorecard rather than by eye. `design/blender/fidelity.py` prints it; `recipe.json` holds the
result; `renders/fidelity-pass.webp` is the before/after.

| measure                       | source | before |     after |
| ----------------------------- | -----: | -----: | --------: |
| silhouette IoU                |      — |  0.778 | **0.868** |
| silhouette area vs source     |  1.000 |  1.210 | **0.981** |
| green hue range               |  82.8° |  27.4° | **77.9°** |
| orange hue range              |  51.2° |  18.9° | **45.0°** |
| orange pixels channel-clipped |   2.6% |  73.9% |  **0.5%** |
| near-white blowout            |  0.32% |  2.30% | **0.00%** |
| maroon interior, area share   |  15.7% |  29.1% |     30.4% |
| blue band, area share         |  19.6% |  10.4% |      7.1% |

**What actually caused the orange band to stay yellow.** Not the albedo. **73.9% of the band's
pixels had a clipped channel** (the artwork: 2.6%), and once R and G both pin at 1.0 the hue is
exactly 60° — pure yellow — whatever the material says. No ramp change could have fixed it. This
hid from the existing blowout check because clipped yellow is fully _saturated_, so it never
looks like a blown highlight; per-band clipping is now reported separately. Fixing exposure
alone recovered most of the missing range.

**The painted hue shift is reproducible after all**, and without breaking the flat-albedo rule.
Measured on the artwork, hue tracks brightness (green r=−0.88, blue r=−0.82) — it is a shading
response, not a texture. It is now replayed as a per-band Colour Ramp indexed by **N·L in world
space**, so the gradient is locked to the _light_, not the mesh: own-axis rotation leaves every
normal's N·L unchanged, and it travels correctly when the light orbits. The rule in
`design/blender/README.md` protects against a UV/object-space gradient rotating with the
geometry; this is not that. Hue and saturation come from the artwork; each band's albedo
**value** is a fitted scalar, because the artwork shows albedo × lighting and feeding that
straight back in as albedo double-counts the light (it left green at val 0.57 against 0.70).

**One recorded gap was misdescribed.** "Gaps too narrow" is the opposite of what is measured:
along the mark's own axis the model's gaps were already _wider_ than the source's (band:gap 1.12
vs 2.22). The "chunky" reading came from the shells' cross-section, not their latitude span —
`thick` is now 0.045, down from 0.084, which is what actually made the bands read as ribbons
rather than tubes. The blown specular on the green band is gone (near-white 2.30% → 0.00%).

**Two gaps are structural and do not close.** The maroon interior stays around 30% against the
artwork's 16%, and the blue band reaches 7% against 20%. Both were measured, not assumed:

- Widening blue moved its area only 9.0% → 12.6% while dropping IoU 0.871 → 0.736.
- Thinning the shells makes the interior _worse_, not better (thick 0.080 → 27.7% interior,
  thick 0.025 → 31.4%), because a thicker shell occludes more of the far side's inner wall.
  So "less chunky" and "less maroon" pull against each other.
- Widening every band cuts the interior to 21.9% but only by wrecking the silhouette
  (IoU 0.786) and making green worse still.
- A 12×12 sweep of axis tilt × azimuth is unimodal with the fit sitting on its peak, and 70
  sampled band placements found nothing better — so this is the model family's ceiling, not a
  stuck optimiser.

This is Finding 2 resurfacing in a narrower form: the artwork's green and blue bands have almost
equal area (20.9% / 19.6%), which is a symmetry a real projection cannot produce at a single
tilt — the artist drew it balanced. A coaxial model must choose, and it favours the band nearer
the camera. **Decision needed:** accept the residual, or relax coaxiality — which would cost the
"weave correct by construction, no depth sorting at any angle" property the animation depends on.
Recommendation: accept it. At the 48px `logoMark` size the two read comparably
(`renders/size-ramp.webp`).

**Still-unanswered gates** (all of the 2026-08-07 gate list still applies): `prefers-reduced-motion`
→ static; JS-disabled baseline stays the static `<img>`; and anything continuous breaks visual
baselines, so it needs pausing in test runs.

### Light-orbit motion (2026-08-25) — built as a preview on `/styleguide`

**Status:** superseded by "Shipped on the Consultancy hero (2026-08-25)" at the end of this
entry — read that for what actually ships and what it costs. Everything below is the motion
work as built and measured on `/styleguide`, and still stands. Generator
`design/blender/orbit.py`, packer `design/blender/sheet.py`, component
`src/components/MarkOrbit.astro`, sheets `design/blender/web/mark-orbit-320.webp` (small,
fixed sizes) and `mark-orbit-608.webp` (the hero). Contact sheet: `renders/light-orbit.webp`.

**Delivery: a pre-rendered sprite sheet, crossfaded in CSS.** Zero JS, so non-negotiable #3 is
satisfied outright rather than argued about, and `prefers-reduced-motion` is one media query.
WebGL was not considered seriously — it is the wrong shape for a static, zero-JS-by-default
repo. The decision that _did_ need deciding is why it is a sheet of stills rather than an
animated WebP or a `<video>`, both of which would compress far better: **`/styleguide` has
committed visual baselines, and a screenshot has to land on a known frame.** Playwright's
`animations: 'disabled'` cancels CSS animations to their initial state — frame 0, the fitted
resting frame — so the baseline is deterministic. An animated image or a video animates in the
decoder / media pipeline, where that switch has no reach, and every baseline run would catch a
different frame. Verified in a real browser: three screenshots 700ms apart with the switch on
are byte-identical, and three without it are not.

**A plain `steps()` sheet does not work, and the fix is cheap.** Cutting between frames 15°
apart is plainly visible — a step moves 4.15% of the mark on average, 12.55% at p95, with 54.5%
of pixels shifting more than 2%. Smooth cutting would need ~5° steps, i.e. 72 frames, which is
a 23,000px-wide sheet. So the component holds **two layers one frame apart and crossfades
them**: `--current` steps through the sheet, `--next` runs the same animation with a −1/24
delay and fades 0 → 1 across each step. That is a linear blend between neighbours, and the
blend is within **0.32% mean / 0.92% p95** of the frame actually rendered at the midpoint, with
no pixel over 2% — the shading field is very nearly linear in rig azimuth over a 15° window,
because the lights are large and soft and nothing casts a hard shadow. 24 frames, 320px,
316 KB WebP. The blend is a true interpolation only because both layers share an alpha mask,
which holds: silhouette IoU ≥ 0.9984 across the cycle. `sheet.py` asserts it on every
regeneration.

**The finding that changed the implementation: the whole rig orbits, not just the key.**
"Orbit the key light" is the obvious reading and it renders something plausible, but it
re-breaks the tone fit that the static-fidelity pass had just closed. Measured over 24 phases
with only the key moving, the **orange band goes from 0.0% of its pixels clipped at rest to
38.2% at phase 90**, green from 0.6% to 24.6% at 165. The peaks land exactly where the
orbiting key crosses a static light — the key rests at azimuth 280°, the fill sits at 25°, the
rim at 82° — and it is their **diffuse** contributions adding, not a specular hit: zeroing the
material's specular still left orange at 32.9%. Per the README's own trap, clipping is what
destroys hue, and the near-white check sat at 0.00% through all of it. Rotating all three
lights rigidly keeps their relative geometry fixed so they cannot stack; green then peaks at
0.71% and orange at 1.29% over the full cycle, both at or under the artwork's own levels
(0.00% / 1.35%). `renders/orbit-rig-vs-key.webp`.

The alternative fix — global exposure down 0.6 EV — also clears the clipping, and was rejected
on measurement: it drops the resting frame's green value p50 from 0.70 to 0.57, which is
precisely the double-counted-light defect named in the static-fidelity pass above.

**Residuals, all measured, none blocking:**

- **Blue clips up to 19.2% around phase 240, and it is benign.** Only the **B** channel ever
  pins — never R and G together — so it cannot rotate hue the way orange's double-clip did
  (which locked hue to exactly 60°, pure yellow). Blue's median hue stays in 198.3–206.4 across
  the whole cycle against the artwork's 200.6, and sits _closer_ to the artwork at its
  worst-clipping phase (199.2) than at rest (205.6).
- **Band hue travels, within the artwork's own vocabulary.** Green's median swings 63.0–100.7°
  over the cycle and orange's 32.0–70.2°, against artwork bands spanning 66–149° and 16–67°.
  Green's median therefore dips ~3° below the artwork's own p5 at one extreme. The two bands
  never converge: minimum separation 21.3°, against 28.9° at rest.
- **Whole-mark saturation swings 5.49%** across the cycle, against the 2D shimmer's ~22%
  desaturation. The specific defect that sank the 2D prototype does not recur.
- **Motion is much larger than the option matrix recorded.** The matrix measured 37.5% of
  pixels changed at 90° for "light orbits, mark fixed"; the rigid rig gives **99.6%** (key-only
  gives 89.1% on the same measure, so the matrix figure is not reproducible from either — worth
  knowing before quoting it). Shape is unaffected either way: silhouette IoU 0.9986 at 90°.
- **Cost:** the sheet is 7680×320, ~9.4 MB decoded. Fine for a dev-facing preview page;
  re-weighed for the hero below.

**Gates:** `prefers-reduced-motion: reduce` → zero animations (verified in-browser; the
animation is only ever _added_ inside a `no-preference` query, so `reduce` never has one to
switch off, and the base style is frame 0). JS-disabled → no JS exists. Decorative →
`aria-hidden`, no accessible name; the axe gate passes on `/styleguide`. Contrast → no text
over it. **Visual baselines → `/styleguide`'s three baselines must be regenerated in the pinned
container**, because the page has a new section; the animation itself is deterministic under the
existing harness and needs no test change.

**Reproducibility gap closed on the way past:** `recipe.json` held the key light but not the
fill and rim, so `build_from_recipe` was silently inheriting those two from whatever the live
Blender session happened to hold — the README's claim that everything rebuilds from the recipe
was not actually true. `fill_pos`/`rim_pos` are in the recipe now and the builder places all
three. The resting frame re-scores identically (silhouette IoU 0.8659, every scorecard figure
unchanged), confirming the recorded positions are the ones the fit converged against.

### Shipped on the Consultancy hero (2026-08-25), then reverted the same day

**Status: shipped, then reverted — see "Reverted to the drawn artwork" at the end of this
section.** Everything from here to that subsection is the record of what shipped and why it was
built the way it was; it is history, not a description of the current site. `/` no longer renders
the 3D mark. The measurements are all still valid and are the reason the work is worth keeping.

The residuals below were accepted for the hero by Akintayo on 2026-08-25, which is the sign-off
CLAUDE.md required before anything from `design/blender/` reached `src/`:

- maroon interior ~30% against the artwork's 15.7%,
- blue band 7.1% against 19.6%.

Both are the model family's ceiling, not a stuck optimiser (a 12×12 tilt × azimuth sweep is
unimodal with the fit on its peak; 70 sampled band placements found nothing better). **Do not
reopen either without new information** — closing them means relaxing coaxiality, which costs
the "weave correct by construction, no depth sorting at any angle" property the animation
depends on.

#### Two premises that turned out to be wrong, and changed the answer

**The hero ring is never painted at 818 CSS px.** `index.astro`'s `width={818}` is the
_intrinsic_ size Astro downsizes the 1636px source to; `width: 100%` inside
`minmax(0, 656px) 1fr` in a 1312px container caps the _display_ box far lower. Measured
in-browser:

| viewport | 1920 | 1440 | 1366 | 1280 | 1024 | 900 | 768 | 375 |
| -------- | ---- | ---- | ---- | ---- | ---- | --- | --- | --- |
| ring     | 608  | 608  | 534  | 448  | 192  | 384 | 384 | 247 |

So the native sheet is 24 × 608 = **14,592px wide, under Chromium's 16,384 texture limit** —
no grid layout, no two-axis stepping. (The 192px at 1024 is the grid track squeezing before the
900px breakpoint takes over; it is why the /styleguide preview was built at 192px.)

**The ring is not the LCP element on the run that is actually gated.** lhci defaults to mobile
emulation; at 412×823 the ring sits at y≈1198 — below the fold, `loading="lazy"` — and
Lighthouse names the `<h1>` as LCP. `/index.html` was scoring **1.00**, not scraping the 0.90
assertion. On _desktop_ emulation the ring **is** the LCP element, which is where the cost of
this landed.

#### The measurement that decided the resolution

24 native 818px frames were rendered and every candidate scored against them, filtered
premultiplied and composited over the hero's white — the way a browser actually resamples.
Doing it on straight alpha invents a dark fringe the browser never draws, because the renders
carry RGB = 0 wherever alpha = 0.

**The smooth-gradient intuition is half right.** The band _interiors_ upscale essentially for
free: gradient energy holds at ~1.00× even from a 256px store. What does not survive is
everything else — the silhouette's own AA edge smears **2.97× wider** from a 320px store, and
the thin hard features (the red inner-wall line where two shells meet, the blue rim highlight)
go mushy. The mark does have hard edges; they are just not in the bands.

Total on-screen error at the 608px box, 24 frames, at the worst instant (midway between two
stored frames), against a native render at that phase:

| store   | mean      | p95       | >2%      | sheet     | decoded | bytes      |
| ------- | --------- | --------- | -------- | --------- | ------- | ---------- |
| 320     | 1.98%     | 9.61%     | 19.0%    | 7680×320  | 9.4 MB  | 316 KB     |
| 384     | 1.61%     | 7.06%     | 15.7%    | 9216×384  | 13.5 MB | ~400 KB    |
| 448     | 1.34%     | 5.29%     | 12.9%    | 10752×448 | 18.4 MB | ~500 KB    |
| 512     | 1.15%     | 4.12%     | 10.5%    | 12288×512 | 24.0 MB | ~570 KB    |
| **608** | **0.56%** | **1.57%** | **1.5%** | 14592×608 | 33.8 MB | **661 KB** |

At 608 there is no resampling at all, so the residual is purely the crossfade already
accepted — 0.32% / 0.92% measured at the 320px box, and 0.56% / 1.57% remeasured at 608.

**Frames beat pixels, and it is not close.** At comparable budget, 24 frames at 512px (24.0 MB)
scores 1.15% / 4.12%, while 12 frames at 608px (16.9 MB) scores 1.53% / 4.31% and 12 at 818px —
a _larger_ decode at 30.6 MB — scores 1.79% / 5.10%. Cutting frames costs more than cutting
resolution, so resolution is the only lever worth pulling, and only down to the size actually
painted. Beyond that it is pure waste.

#### A lever measured but not used

The alpha channel is **47% of the sheet's bytes** (612 KB → 323 KB opaque, at 448px), and it
stores the _same_ silhouette 24 times — the silhouette is invariant under the orbit
(IoU ≥ 0.9984). Storing it once as a native-resolution CSS `mask-image` (9.5 KB) and bleeding
the mark's colour outward in the sheet moves the whole outline back to native while the sheet
carries shading only: 384px opaque + mask = 403 KB at 1.15% / 4.51%, beating a 448px RGBA sheet
on every measure at 34% fewer bytes.

It was not used because it does not help at native resolution — 608 opaque + mask scores
0.68% / 1.76% against the plain sheet's 0.56% / 1.57%, the dilate/mask round-trip costing a
hair. **Reach for it if the hero ever has to ship below native**, and gate it with `@supports`:
an unsupported `mask-image` fails to an opaque rectangle, which is worse than soft.

#### What it costs, measured on the built site

The sheet is behind `min-width: 900px` **and** `prefers-reduced-motion: no-preference`, applied
as `display: none` on a wrapper — which is a _download_ gate, not just a visibility one, because
Chromium does not fetch a background image inside a `display: none` subtree. Verified in
Chromium for both gates: the request is never issued.

Mobile — the gated run — is **unaffected, and slightly better than before**:

| /index.html, mobile | before  | after       |
| ------------------- | ------- | ----------- |
| performance         | 1.00 ×3 | 1.00 ×3     |
| LCP                 | 1.7 s   | 1.7–1.8 s   |
| page weight         | 284 KiB | **265 KiB** |

It got _lighter_ because the 3D resting frame encodes to 35.5 KB where the drawn artwork it
replaced was 54.1 KB.

Desktop is where this is genuinely paid for, and it is not gated by anything:

| /index.html, desktop | before    | after       |
| -------------------- | --------- | ----------- |
| performance          | 1.00      | 0.97–0.98   |
| LCP                  | 0.4–0.5 s | 1.0–1.1 s   |
| TBT                  | 0 ms      | 0–120 ms    |
| page weight          | 299 KiB   | **960 KiB** |

**Be honest about why the hard gate passes:** it passes partly by construction, because
Lighthouse only runs mobile emulation here and the sheet is desktop-only. The 3.2× desktop page
weight and the doubled desktop LCP are real, were put up with these numbers, and were accepted
as a deliberate trade. If desktop ever gets its own Lighthouse assertion, this is the first
thing that will trip it.

#### Implementation notes worth keeping

- **The static `<img>` stays, and is now the 3D resting frame** (`design/blender/web/
mark-static-818.png`, the orbit's own frame 0). The orbit is a layer _over_ it, so JS-off,
  reduced-motion, sub-900px and any browser that fails to fetch the sheet all land on the same
  mark, just still — non-negotiable #3 satisfied by construction rather than by argument. It
  also means no blank hero while 661 KB downloads.
- **`logoMark` — the 48px header lockup — was deliberately left on the 2D artwork.** Making
  that one 3D as well is a separate decision; E-02's own finding is that per-band treatment is
  near-invisible at 48px, and `renders/size-ramp.webp` shows the two reading comparably there.
  So the same page currently carries a 3D mark in the hero and a 2D one in the masthead.
- **The background maths moved to percentages** so one component serves both a fixed px size
  and a fluid grid track. `background-size: 2400% 100%` is 24 box-widths whatever the box
  measures. The trap: a percentage `background-position-x` resolves against (box − image) =
  −23·W, **not** against W, so one frame of travel is 100/23 % and the keyframe ends at
  2400/23 % ≈ 104.35%. Verified in Chromium against the packed sheet — every sampled step
  matches its frame to within 1/255, which is RGBA→RGB rounding and nothing else.

**Visual baselines:** Home's three baselines must be regenerated in the pinned container — the
hero's artwork changed on every viewport, and at desktop the orbit layer is present (frozen at
frame 0 by `animations: 'disabled'`, so it stays deterministic). `/styleguide`'s three are
unaffected by this change but were already outstanding from the preview commit.

**Stale comment noticed, not fixed:** `tests/visual.spec.ts:31` cites `use.reducedMotion` in
`playwright.config.ts`, and that option is not actually set there. The behaviour the comment
describes still holds for a different reason (`toHaveScreenshot` defaults to
`animations: 'disabled'`), but it means the visual gate _does_ exercise the hero orbit at
desktop rather than skipping it under a reduced-motion preference. Left alone as out of scope.

### Reverted to the drawn artwork (2026-08-25)

**Status: this is the current state.** Client direction, the same day it shipped: `/` goes back
to the drawn Figma artwork, and the 3D mark moves to `/styleguide` where it stays available to
look at and to show people. Not a defect report — the residuals above did not fail, they were
accepted; the hero simply went back to parity with node 5891:4663.

**What changed:**

- `heroRing` in `src/lib/home-images.ts` points at
  `design/figma/…/5891-4663/assets/fill-d07bdd3d…png` again — byte-for-byte what it was before
  the 3D rebuild, so the hero is exact-replica against the frame (non-negotiable #1).
- The `.hero__orbit` wrapper, the `MarkOrbit` instance and the whole 900px/reduced-motion
  download gate are gone from `index.astro`. The gate existed to withhold 661 KB from viewports
  that would never animate; with nothing to animate there is nothing to withhold. A one-line
  pointer marks where it was.
- `/styleguide` gains the hero's own instance — `sheet={608} fluid duration={16}` in a
  `min(608px, 100%)` square — beside the existing 192px and 48px previews. Same props, same
  fluid path, so it is the configuration the hero painted rather than an approximation of it.
  Verified in-browser: 608×608 at 1440, `16s steps(24) infinite`, and 252px with no horizontal
  overflow at 375.

**Consequences worth knowing:**

- **Nothing under `design/blender/` reaches a customer-facing route now.** Confirmed against the
  built output: `dist/index.html` references no `mark-orbit-*` or `mark-static-*` asset, and both
  sheets resolve only from `dist/_astro/styleguide.*.css`.
- **The page weight moves from `/` to `/styleguide`, and neither route pays for it in score.**
  `/styleguide` now downloads the 608 sheet unconditionally — there the sheet _is_ the content and
  cannot sit behind the `display: none` wrapper that withheld it over the hero's static `<img>` —
  so the route roughly triples, 324 KB of sheets to 1001 KB. Measured with `lhci collect` after
  the change, against the budgets in `lighthouserc.json` (perf ≥ 0.9):

  | route         | total size | perf     | a11y | best-practices | seo  | LCP  |
  | ------------- | ---------- | -------- | ---- | -------------- | ---- | ---- |
  | `/`           | 284 KiB    | **1.00** | 0.96 | 0.96           | 0.91 | 1.7s |
  | `/styleguide` | 1,049 KiB  | **1.00** | 0.96 | 0.96           | 1.00 | 1.5s |

  `/` is back to the 284 KiB it measured before the orbit shipped. `/styleguide` carries four
  times that and still scores 1.00, because lhci runs mobile-emulated and the mark section sits
  far below the fold — the sheets are never in the LCP path. **Do not read that as free**: it is
  the same "passes partly by construction" caveat as above, and a desktop assertion or a sheet
  moved above the fold would change it. If it ever does trip, gate the 608 instance behind a
  click or a `<details>` rather than shrinking the sheet — its size is the whole point of it.

  **Since resolved outright: `/styleguide` is no longer deployed.** Moving the sheets off `/` only
  relocated them to another production route, which was the wrong place to stop. Both styleguides
  are internal-only now — they live in `src/internal/` and are injected as routes only under
  `astro dev` or `INCLUDE_STYLEGUIDE=1` (`astro.config.mjs`). Verified on a plain `npm run build`:
  no `dist/styleguide/`, no `dist/ngo/styleguide/`, and **zero `mark-orbit-*` / `mark-static-*`
  files in `dist/_astro/`**. So nothing under `design/blender/` reaches production by any path,
  and the table above now describes the gated build only. See CLAUDE.md "Styleguides are
  internal-only and are NOT deployed".

- **`mark-static-818.png` is now unreferenced by `src/`.** Kept deliberately: it is the orbit's
  frame 0 at full size — the truthful still of the model, and what a fresh fit would be eyeballed
  against before re-rendering the sheets. (It is _not_ the scorecard's reference: `fidelity.py`
  scores a render against the drawn artwork, not against this file.) Don't prune it as dead weight.
- **`logoMark` is unaffected** — it was never converted, so the "same page carries a 3D mark and
  a 2D one" situation the notes above describe no longer exists. Every mark on the site is the
  drawn artwork again.
- **The NGO site was never involved.** `ngoHeroRing` has always been the Figma artwork; no NGO
  route has ever referenced `design/blender/`.

**Visual baselines:** supersedes the paragraph above. Home's three baselines need regenerating
because the hero's artwork changed again, and `/styleguide`'s three because the mark section grew
a 608px block — all in the pinned container. The `animations: 'disabled'` determinism argument
still holds for the styleguide instance: it freezes on frame 0, the fitted resting frame.

**If this is ever reversed again,** the whole implementation is in this section's history plus
`src/components/MarkOrbit.astro`, which is unchanged and still carries the full derivation. The
revert is three small edits; nothing was thrown away.

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

---

## E-05 — Grow the mobile controls to the 44×44 AAA target size

**Status:** Proposed (2026-08-16)

- **Where:** every `.btn` at the mobile tier (≤640px, tokens.css §4), and `.brand-switch`'s
  mobile icon form, across all 21 routes.
- **Effect:** buttons become easier to hit with a thumb, particularly one-handed and in motion.
- **Mechanism:** raise `--control-padding-block` from 9px to 11px inside the §4 media block
  (11 + 20 line-height + 11 + 2 × 1px border = 44), and give `.brand-switch` a 44px block-size.
  One token and one declaration — the CSS is trivial; the reason it is here rather than shipped
  is that it is a **deliberate deviation from a confirmed design value**, not a fix.
- **Depends on:** mobile parity sign-off. The 40px control height is read straight off the mobile
  frame (node 12496:9743 and every other `GIEVA Button` on 12490:10106), and the switcher's
  54×40 off node 12498:11006. Both are the design, not an approximation of it.
- **Gates:**
  - `prefers-reduced-motion`: n/a.
  - Input modality: this IS the modality argument — it only pays off on touch. A pointer user
    loses nothing, so the change can be scoped to `(pointer: coarse)` if the visual growth is
    what the client objects to, which is a strictly better version of this entry.
  - JS-disabled baseline: unaffected, CSS only.
  - Contrast: unaffected.
  - Visual baselines: **perturbs them** — every route with a button above the fold. Should land
    with a baseline regeneration, not before one.
- **Why it earns its place:** 40×40 already clears WCAG 2.5.8 (AA, 24×24) comfortably, so nothing
  here is a compliance gap — this is the AAA enhancement CLAUDE.md asks for "where achievable".
  On a phone, where the whole page is driven by one thumb, 4px is the difference between a
  confident tap and a near-miss on the site's primary conversion controls. That is a real
  usability gain, which is why it is Proposed rather than Rejected — but it is the client's
  design to override, not ours.
- **Open question:** whether to scope it to `(pointer: coarse)` (keeps the drawn size on any
  touchless narrow viewport, e.g. a resized desktop window) or apply it across the tier. The
  scoped version deviates from the frame only where the deviation actually buys something.

---

## E-06 — Wash the hero ring with the GLASS overlay

**Status:** Proposed (2026-08-16)

- **Where:** `.hero__visual` on Consultancy Home (`/`) and the equivalent on NGO Home (`/ngo`) —
  at BOTH breakpoints, not only mobile.
- **Effect:** the ring behind the headline sits back into the page instead of competing with it;
  the copy over it reads more calmly.
- **Mechanism:** the design stacks three layers in the hero background — the ring, then `GLASS`
  (node 12496:9724 on mobile, the same component as the service cards' 12290:8889), then the
  content. GLASS is N equal vertical panes, each a white→black→#626262 gradient at 25% opacity in
  OVERLAY blend. We paint our stripe approximation as a `repeating-linear-gradient` on `.hero`'s
  own background, i.e. BEHIND the ring, so the ring never gets washed. Reproducing it properly
  means a pseudo-element between the two with `mix-blend-mode: overlay; opacity: .25`, plus the
  z-index ordering to put it above `.hero__visual` and below `.hero__content`.
- **Depends on:** nothing new — but note this is a **pre-existing** desktop approximation that
  was signed off, not a mobile regression. The mobile build deliberately matched the shipped
  desktop treatment rather than fixing one breakpoint and leaving the other, which would have
  made the two hero treatments diverge for no stated reason.
- **Gates:**
  - `prefers-reduced-motion`: n/a, static.
  - Input modality: n/a.
  - JS-disabled baseline: unaffected, CSS only.
  - Contrast: **improves** it. The headline is deep violet over a fully-saturated ring today;
    the wash lifts the backdrop toward white behind the copy. Worth measuring properly with
    `src/lib/contrast.ts` before and after — text over a raster image is exactly the case axe
    reports as `incomplete` rather than failing, so no gate will catch a regression here.
  - Visual baselines: perturbs Home on both brands.
- **Why it earns its place:** it is parity, not garnish — which is an argument for treating it as
  a parity fix rather than a Phase 4 entry. It sits here because the desktop version shipped and
  was signed off in its current form, so changing it is a re-opening, and re-openings should be
  deliberate.

---

## E-07 — Grow the button hover fill from the point of contact

**Status:** Prototyped (2026-08-22) — live on ONE button, `/styleguide` → Buttons → "Primary
action", via the opt-in `ripple` prop on `Button.astro`. Every other button on all 18 routes is
untouched.

- **Where:** `Button.astro`, `primary` variant first; `secondary` and `on-inverse` are open
  questions (see below). Not `link` — it has no fill to grow.
- **Effect:** on hover the button's hover colour grows out of the exact pixel the pointer
  crossed the edge at, sweeping across the box, instead of the whole rectangle flipping at once.
  Leaving reverses it back toward wherever the pointer left.
- **Mechanism:** a `.ripple` span, `z-index: -1` inside an `isolation: isolate` host so it
  paints above the host's own background and below the label and arrow with no z-index on
  either; `overflow: hidden` clips it to the padding box. On `pointerenter` the script centres
  the circle on the contact point and sizes it to the diameter that reaches the button's farthest
  corner, then CSS animates `transform: scale(0 → 1)`. Sizing the element and scaling 0 → 1 (as
  opposed to scaling a 2px dot up ~150×) is what keeps the edge crisp — the layer rasterises at
  final size and is only ever transformed downward. `transform` is the sole animated property.
  On `pointerleave` the circle re-centres on the exit point before contracting, but **only once
  it already covers the button**, tracked via `transitionend`: at full coverage the re-centre is
  invisible because both circles paint the same pixels, whereas mid-sweep it would teleport. A
  pointer that leaves before the sweep finishes simply reverses.
- **Ingredients:** CSS transition (cheapest tool that works); `transform` only; `ease-out`;
  280ms in / 200ms out.
  - The curve is a **measured** choice, not a default. Covered area grows as the square of the
    radius, so the reveal reads as decelerating before any easing is applied. Five candidates
    were scrubbed frame by frame with the transition paused: `--easing-standard`
    (`cubic-bezier(.2, 0, 0, 1)`) and Emil Kowalski's `cubic-bezier(.23, 1, .32, 1)` both put the
    leading edge ~45% across the button within the first 15% of the duration and left the rest a
    crawl; `linear` arrives with no landing; `cubic-bezier(.77, 0, .175, 1)` starts too slow.
    Plain `ease-out` was the only one legible the whole way across.
  - The 1px border can't be revealed by the circle (`overflow` clips at the padding box), so it
    cross-fades on the ripple's own duration and curve. Holding it at the resting colour drew a
    hard orange ring around an already-violet button.
- **Depends on:** the `GIEVA Button` box geometry, which is signed off and stable. Nothing in the
  resting state moves, so it does not key off unsigned parity.
- **Gates:**
  - `prefers-reduced-motion`: satisfied with no branch. base.css's global block collapses every
    transition to 0.01ms, so the circle snaps to full coverage and the result is exactly the
    instant colour change it replaced. Verified, not assumed.
  - Input modality: pointer-only, gated on `(hover: hover) and (pointer: fine)` **and** on
    `event.pointerType === 'mouse'`. On touch a tap fires a false `pointerenter` and the ripple
    would read as a stuck state; there the plain swap stays in charge. Keyboard focus is
    untouched — `:focus-visible` never had a fill change and still doesn't.
  - JS-disabled baseline: the markup ships `data-ripple` **empty**; the script sets it to `"on"`
    as its last act, and only that value hands the colour over to the circle. With no JS the
    plain `:hover` background swap is still the hover state. Verified in a
    `javaScriptEnabled: false` context: attribute stays `""`, hover still resolves to
    `--color-cta-hover`.
  - Contrast: unchanged at both ends — the same two token colours, in the same order. Mid-sweep
    the label crosses a colour boundary, but both sides already pass against white.
  - Visual baselines: **unperturbed.** Nothing about the resting state changes, and screenshots
    are taken without hover.
- **Why it earns its place:** hover feedback on a marketing CTA is the one place motion is
  telling the user something true — _this_ is the thing under your pointer, and here is where you
  touched it. The growth is anchored to the user's own input rather than being decorative, which
  is the line between craft and garnish. Note the frequency tier is borderline: Emil's gate puts
  hover effects at "tens of times a day → near-imperceptible or nothing", and 280ms is at the
  ceiling for that. The defence is that these are marketing-page CTAs hovered a handful of times
  per session, not app chrome. If it starts to feel slow in use, that verdict is wrong, not the
  implementation.

### Resolved during rollout

- **`--color-cta-hover` was wrong on Consultancy, and this effect made it obvious. FIXED.** The primary
  button rests at `--color-cta` = `#E65320` (orange) and hovers to `--color-cta-hover` =
  `--color-action-hover` = `#4614CC` — _darkened electric violet_, carrying the tokens.css comment
  "provisional, confirm". That role was authored for **link** hover, where the resting colour is
  the violet brand primary; the CTA role was wired to it and the hue jump went unnoticed because
  a 120ms whole-box swap is easy to miss. At 280ms, growing from a point, it is a hero moment and
  reads as a bug. A darkened orange is what the role wants: `#BD441A` (the resting colour at 82%)
  measures 5.24:1 against white — AA, and better than the 3.73:1 the resting orange manages. This
  is a token fix that stands on its own merit; the ripple only surfaced it. `--color-cta-hover`
  on Consultancy is now `#BD441A` outright rather than an alias of `--color-action-hover`, which
  stays violet for links. NGO keeps the alias — there both roles genuinely are green.
- **Label-colour changes needed a second layer. SOLVED with `ink`.** `secondary` and the brand
  switch flip their label colour as well as their fill, and a background circle cannot repaint
  text. Cross-fading the label over the same window was tried and rejected: mid-sweep the text
  sits half-way between its two colours while half the box is still the resting fill, and on
  `secondary` — orange label over a 10% orange tint — that half-way colour is nearly invisible
  against the unswept background. The `ink` layer is instead an exact copy of the label in the
  hovered colour, clipped by a circle sharing the fill's centre, radius, duration and curve, so
  the text flips on the identical hard edge.
- **Two implementation traps, both found by measurement rather than by looking.**
  1. The ink's clip circle was interpolating its CENTRE as well as its radius, because the centre
     lives inside `clip-path`, the property being transitioned — so it drifted toward the pointer
     while it grew and split the text on a different edge than the fill. Fixed by registering
     `--ripple-clip` with `@property` and transitioning that instead, which leaves the centre as
     an instant `var()` substitution. Forcing a style flush between setting the centre and
     flipping the state does NOT work: reading a layout property doesn't recompute `clip-path`.
  2. The duplicated label was being indexed by Pagefind (site word count moved 1327 → 1334) and
     was selectable, so dragging across a button copied its label twice. `data-pagefind-ignore`
     and `user-select: none` on the ink layer.

### Still open

- **Duration is derived from a constant sweep SPEED, not fixed.** 0.75px of radius per ms,
  clamped to 150–300ms. A fixed 280ms would make the header's 115px buttons crawl and the widest
  CTAs look hurried; scaling it means every control inherits the FEEL that was signed off rather
  than its number. Measured: 115px → 152ms, 209px → 275ms, 245px → 300ms (capped). The constant
  is the one number here most worth re-tuning if the effect ever feels off.
- **The header buttons are the first thing to pull if it feels busy.** They sit in fixed chrome
  the pointer crosses on every page, which is a different exposure profile from a CTA in page
  content. Included because the alternative — visually identical buttons that behave differently
  depending on where they sit — reads as a bug rather than as restraint.

---

## E-08 — Run the stat figures up when they scroll into view

### Where

The four-figure stat rails: `.who__stats` on `/` (node 7152:5184) and on `/ngo` (5990:3672),
`.about-story__stats` on `/about`, `.stats` on `/ngo/about`. Same four figures on all four —
`10,000+` · `30+` · `12+` · `98%` — as four page-local copies of one array.

### Effect

Each figure runs up from zero the first time it scrolls into view, once, staggered left to right
across the rail.

### Status

**Shipped** on all four rails, plus `/styleguide` as the tuning surface
(`src/internal/StatLab.astro`).

### Mechanism — stock Motion

`motion` (the vanilla successor to Framer Motion, MIT), wrapped by
`src/components/StatCounter.astro`. Two calls do the whole job, both from Motion's open-source
core — nothing here needs Motion+:

```ts
inView(el, () => { … }, { margin: '0px 0px -12% 0px' });
animate(0, target, { duration, delay, ease: EASE_COUNT, onUpdate: (n) => { … } });
```

`onUpdate` writes `Intl.NumberFormat('en-US')`-formatted text into the span every frame; `en-US`
is pinned explicitly because grouping is part of the design ("10,000", not "10 000") and must not
depend on who is reading. `onComplete` writes the exact display string, so floating point never
gets to decide whether the headline reads 10,000 or 9,999.

Two supporting pieces, both library-independent:

1. **A width ghost.** The final string, `visibility: hidden`, sharing one grid cell with the live
   figure. Counting `0 → 10,000` grows the figure from one digit to five, and without the ghost
   that box widens mid-count and shoves the neighbouring stats and their dividers sideways. It is
   also why the committed visual baselines don't move. `font-variant-numeric: tabular-nums` sits
   alongside it — a no-op in the shipped Arial stack, whose digits are already uniform, and
   insurance against a fallback face whose "1" is narrower.
2. **A same-frame stagger.** Figures crossing the threshold in the same frame are collected and
   staggered against each other; one arriving alone starts immediately. That is what makes one
   code path read correctly at both widths — a desktop rail enters as a row of four and cascades,
   while the mobile stack enters one figure at a time and would look broken with a fixed
   per-index delay.

### Finding — `--ease-out` is the wrong ease-out here, and it is a duration problem

`--ease-out` (`cubic-bezier(0.23, 1, 0.32, 1)`) is calibrated for 150–300ms UI motion, where its
very front-loaded shape is what makes a control feel like it answered instantly and its ~100ms
tail reads as a settle. Stretched over a 1500ms count the same shape puts the figure within 1% of
its target with **546ms still on the clock**, so a third of the animation is a number that has
visibly stopped. Measured across the candidates, as time-left-once-within-1%:

| Curve              |                       | at 50% of the run | dead tail at 1500ms |
| ------------------ | --------------------- | ----------------- | ------------------- |
| `--ease-out`       | `0.23, 1, 0.32, 1`    | 97%               | 546ms               |
| easeOutCubic       | `0.33, 1, 0.68, 1`    | 87%               | 315ms               |
| **`--ease-count`** | **`0.5, 1, 0.89, 1`** | **75%**           | **162ms**           |
| easeOutSine        | `0.61, 1, 0.88, 1`    | 70%               | 150ms               |

`--ease-count` was added to `tokens.css` for this and is passed to Motion as the bezier tuple
`[0.5, 1, 0.89, 1]`. This finding survived the library change — it is a property of the schedule,
not of whatever draws the digits.

### Library history — why this is now stock, and what it replaced

The first implementation was **`number-flow`** (6.07 kB gz), a purpose-built animated-number web
component. On paper it was the right pick and the entry here argued so: digit-count changes with
correct width and mask transitions, `Intl` formatting, separate spin/transform/opacity timings.
In practice it needed a bespoke driver to be a _count_ at all — number-flow is a value-TRANSITION
component, so one `update(10000)` shows 10,000 immediately and only rolls the glyphs into place.
Making it count meant stepping the value on a schedule and tuning a tick interval against a spin
duration so that consecutive spins overlapped instead of stopping dead at each waypoint. Two
coupled magic numbers, a lab full of sliders to find them, and the result still didn't read well.

The call (2026-08-27) was to stop tuning a bespoke mechanism and take a stock one:

- **Motion — chosen.** `animate(0, target, { onUpdate })` is the count, in one call, with no
  coupled constants to get wrong. `inView` is the trigger. Both open-source core.
- **GSAP — not chosen.** `gsap.to(proxy, { onUpdate })` is the equally canonical recipe and GSAP
  is now fully free, so the paid-plugin question doesn't bite either way. It loses on weight
  alone: core is ~24 kB gz before ScrollTrigger's ~11 kB, against Motion's 22 kB total.
- **Hand-rolled rAF — not chosen,** and this is the reversal. It is ~15 lines and it is what the
  old driver effectively was. The point of the change was to stop owning the tuning.

**The cost is weight, and it is a real regression: 21.9 kB gz against number-flow's 6.07 kB**,
measured off the built chunk. It is all `animate` — `inView` is 446 bytes gz, and `motion/mini`
can't help because its `animate` is elements-only, with no value tween. The trade was made
knowingly: 22 kB of deferred module script on four marketing pages, against a mechanism nobody
has to tune again. Lighthouse gates `categories:performance` at 0.9 and measures it in CI.

### Gates

- **`prefers-reduced-motion`** — under `reduce` no counter is rewound at all: the figure the build
  rendered is the figure that stays. Verified across all four routes.
- **Input modality** — not applicable; scroll-triggered, no pointer or hover involvement.
- **JS-disabled baseline** — the finished figure is the element's static text content, so with JS
  off the rail is simply the static page. Verified in Chromium with `javaScriptEnabled: false` on
  all four routes: final figures present, no `role` stamped.
- **A11y** — the script stamps `role="img"` plus `aria-label` (the final string) only on the
  figures it is actually going to animate, so AT reads "10,000+" once and never a digit caught
  mid-flight. With no JS there is no role and no label, just text. The ghost is `aria-hidden` and
  `data-pagefind-ignore`. All 46 axe cases pass at both 1440 and 390.
- **Pagefind** — 1468 indexed words with the counters and 1468 without, built the same way.
  Measured, not assumed.
- **Contrast** — none. Colour is untouched; only the glyphs move.
- **Visual-regression baselines** — **unchanged, by construction.** The ghost pins the final
  width, `use.reducedMotion` is set project-wide in `playwright.config.ts` so nothing is ever
  rewound under test, and screenshots additionally pass `animations: 'disabled'`. Measured in the
  browser: the rail has exactly **one** distinct geometry for the whole run (stat left edges, rail
  width and height all constant), and ghost width equals final live width to the hundredth of a
  pixel.

### Why it earns its place

The purpose is **explanation**, on a marketing surface, at the rare/first-time frequency tier —
the only tier where this length of motion is allowed at all. A stat rail is the one place on the
site making a quantitative claim, and a figure that counts is a figure the reader has watched
being asserted rather than one they skimmed. It fires once per page visit and never on anything
the reader is acting on.

### Still open

- **Duration is the only knob left**, and it ships at 1600ms. The styleguide lab exposes it and
  the stagger, which are now `StatCounter`'s only two settings.
- **The four copies of the `stats` array are still four copies.** Worth collapsing into one
  module, but that is a content-ownership change and belongs in its own commit.
- **The rail-level choreography was deliberately not built.** Only the figure animates; the label,
  the card and the dividers are static. A staggered reveal of the whole rail would need its
  initial hidden state gated behind `@media (scripting: enabled)` to keep the no-JS baseline
  honest — cheap to add, but it is a second decision and should be looked at against the real
  photo rail, not the lab's flat stand-in.
