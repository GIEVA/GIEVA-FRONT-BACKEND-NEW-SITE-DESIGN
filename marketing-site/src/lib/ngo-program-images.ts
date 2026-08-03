/**
 * NGO Program image assets — sourced from the committed Figma ingestion
 * (design/figma/fTqnnV20l9htP7vFJrOsvn/7447-6027/assets/), the durable source of truth.
 * Importing them through astro:assets lets Astro's image pipeline optimise the raster fill.
 *
 * The three program-detail sections (STEP, HEALS, GVP) all reference the SAME imageRef in the
 * source (`fill-1b88c3421e…`, node 7463:5840 and its two siblings) — the design's single
 * placeholder programme photo (a young person with a laptop). It is NOT one of the Home/About
 * imageRefs, so it needs its own import here rather than reuse from `@lib/ngo-home-images`.
 */
import programPhoto from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/7447-6027/assets/fill-1b88c3421e7fc8e23254d3017cf3bb4685cff584.png';

export { programPhoto };
