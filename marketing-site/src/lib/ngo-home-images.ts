/**
 * NGO Home image assets — sourced from the committed Figma ingestion
 * (design/figma/fTqnnV20l9htP7vFJrOsvn/5990-3672/assets/), the durable source of truth.
 * Importing them here lets Astro's image pipeline (astro:assets) optimise every raster fill.
 *
 * imageRefs confirmed against the node.json fill audit (Phase 1):
 *   - hero brand torus  fill-3172f31c… (5990:3678, the 818×818 circular GIEVA mark)
 *   - boat photo        fill-4eebccba… (reused: Who-We-Are stats band, Success video, news
 *                       cards, CTA panel — the design's single placeholder photo)
 *   - testimonial DG    fill-8108addc… (7102:33498, the portrait beside the quote)
 */
import ngoHeroRing from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/5990-3672/assets/fill-3172f31ce44b7c8cfb0a897f5d748407dc9e6cbc.png';
import boatPhoto from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/5990-3672/assets/fill-4eebccba0adfb3dd26fc6e2fd817cd248d8f7133.jpg';
import testimonialPortrait from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/5990-3672/assets/fill-8108addc2bb6ce97610dae38d4f1280c1e0332e7.jpg';

export { ngoHeroRing, boatPhoto, testimonialPortrait };

/*
 * The trusted-partners marquee now shares the Consultancy `partnerLogos` set (see
 * @lib/home-images) via the PartnersMarquee component. The previous NGO-specific glob was
 * removed: its per-logo identities were unverified placeholders, not confirmed partner marks.
 */
