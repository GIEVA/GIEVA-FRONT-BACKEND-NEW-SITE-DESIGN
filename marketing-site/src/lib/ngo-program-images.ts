/**
 * NGO Program image assets — sourced from the committed Figma ingestion
 * (design/figma/fTqnnV20l9htP7vFJrOsvn/7447-6027/assets/), the durable source of truth.
 * Importing them through astro:assets lets Astro's image pipeline optimise the raster fill.
 *
 * The three program-detail sections (STEP, HEALS, GVP) all reference the SAME imageRef in the
 * source (`fill-1b88c3421e…`, node 7463:5840 and its two siblings) — the design's single
 * placeholder programme photo (a young person with a laptop). It is NOT one of the Home/About
 * imageRefs, so it needs its own import here rather than reuse from `@lib/ngo-home-images`.
 *
 * ⚠ Why the `-cropped` file and not the bare imageRef export beside it: the design applies a
 * CROP transform to that fill (it zooms to ~70% and offsets down/right, framing the subject
 * noticeably tighter). `scripts/figma-fetch.mjs` downloads the raw imageRef, which does not
 * carry the transform, so the raw file frames the shot wider than any Figma frame ever shows
 * it. The `-cropped` file is the node as Figma actually renders it, exported through the MCP on
 * 2026-08-07. The raw fill is kept in the directory because it is the true imageRef export and
 * a re-run of `figma:fetch` will reproduce it.
 *
 * The horizontal mirror the design also applies (`scaleX(-1)`) is NOT baked in here — it is a
 * CSS transform in program.astro, so this asset stays the unmodified export.
 */
import programPhoto from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/7447-6027/assets/fill-1b88c3421e7fc8e23254d3017cf3bb4685cff584-cropped.png';

export { programPhoto };
