/**
 * Shared NGO photo-hero asset — sourced from the committed Figma ingestion
 * (design/figma/fTqnnV20l9htP7vFJrOsvn/7429-5025/assets/), the durable source of truth.
 * Importing through astro:assets lets Astro's image pipeline optimise the raster fill.
 *
 * `ngoHeroPhoto` is the 1440×670 photo hero the 2026-08 redesign gave the NGO sub-pages. Its
 * imageRef `8ab4e0ec…` was read straight off the node's fill, and it is NOT any image we
 * already hold: in particular it is **not** the Consultancy `servicesHeroPhoto`
 * (`fill-55fffb0d…`, a lecture hall, 2902×2073) that `SubPageHero` defaults to — this one is a
 * 4096×3067 aerial water/foliage shot. Confirmed by diffing the bytes, not by trusting the
 * layer name (both are just called "Photo").
 *
 * It is ONE photo across routes, not one per route: the About hero (12330:13417) and the
 * Program hero (12330:13421) carry byte-identical fills — diffed at equal size, RMSE exactly 0.
 * Hence a brand-scoped module rather than a page-scoped one. The file still sits under the
 * About frame's ingest directory because that is simply where it was first exported from.
 *
 * The photo carries a second fill in the design — SOLID black at opacity 0.25 — which is the
 * scrim `SubPageHero` already renders, so it is not baked into this file.
 */
import ngoHeroPhoto from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/7429-5025/assets/fill-8ab4e0ecedef93cf45ff294ab213feac40e6dd7f.jpg';

export { ngoHeroPhoto };
