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

## E-02 — Rotating GIEVA mark

**Status:** Proposed (2026-07-26) — _needs the target pinned down first_

- **Where:** ambiguous as raised, and the two readings have materially different constraints:
  - **(a) The hero ring** — `heroRing`, an 818×818 decorative PNG at `index.astro:135`, `alt=""`,
    Consultancy Home only.
  - **(b) The GIEVA logo mark** — `logoMark`, the striped globe in `SiteHeader`, present on
    **every route of both brands**.
- **Effect:** slow rotation, giving the mark life.
- **Mechanism:** both are rasters, so a CSS `rotate` is GPU-composited and essentially free. The
  interesting choice is not how to rotate but _what drives it_:
  - **Continuous** — simplest, but animates forever, costs battery while idle, and in a fixed
    masthead (reading b) it sits in the corner of every page on the site. Highest irritation risk.
  - **Scroll-linked** — rotation tied to scroll progress. Costs nothing when idle and ties motion
    to user intent. Good fit for the hero ring (a), which scrolls out of view anyway.
  - **On interaction** — a spin on hover/focus of the brand link. Good fit for the logo mark (b),
    where the mark is part of a control and the motion has an obvious cause.
  - **Once on load** — a single settle. Cheapest possible, but only lands on a first visit.
- **Depends on:** hero parity sign-off for (a); nothing structural for (b), but the masthead is
  shared with the NGO brand, so anything here ships to both sites at once.
- **Gates:**
  - `prefers-reduced-motion: reduce` → static. Non-negotiable for anything continuous.
  - Input modality: if driven by hover, needs a focus equivalent for keyboard users, or it must
    be purely decorative.
  - JS-disabled baseline: pure CSS for continuous/hover variants means no JS at all. Only the
    scroll-linked variant needs script (or `animation-timeline: scroll()`, which would need a
    support check and a static fallback).
  - Contrast: none — decorative imagery, no text over it.
  - Visual baselines: **a continuous rotation would break them**, since a screenshot catches it at
    an arbitrary angle. It would need pausing in test runs, which is a real argument for the
    interaction-driven or scroll-linked variants over continuous.
  - `alt=""` must stay on the hero ring — motion doesn't make it meaningful content.
- **Why it earns its place:** GIEVA is a _global_ education body and the mark reads as a globe;
  rotation is the one motion that means something specific here rather than being generic polish.
  This justification holds much better for the globe mark (b) than for the abstract ring (a).
- **Open question:** which element was meant, and which driver. Worth settling before Phase 4 so
  the entry doesn't get re-litigated.

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
