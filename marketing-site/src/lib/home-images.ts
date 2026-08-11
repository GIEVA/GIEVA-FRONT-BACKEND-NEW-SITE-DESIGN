/**
 * Home page image assets — sourced from the committed Figma ingestion
 * (design/figma/fTqnnV20l9htP7vFJrOsvn/5891-4663/assets/), not duplicated into src/assets.
 * Importing them here lets Astro's built-in image pipeline (astro:assets) optimise/resize
 * every raster fill the design uses, while keeping design/ as the single source of truth.
 */
import heroRing from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/5891-4663/assets/fill-d07bdd3d45347cdc0acfc2853309656f48f2a808.png';
import logoMark from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/5891-4663/assets/fill-3172f31ce44b7c8cfb0a897f5d748407dc9e6cbc.png';
import whoWeArePhoto from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/5891-4663/assets/fill-55fffb0d206b64f043184380f13f723b24c692a3.jpg';
import teamPhoto from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/5891-4663/assets/fill-8108addc2bb6ce97610dae38d4f1280c1e0332e7.jpg';
import testimonial1 from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/5891-4663/assets/fill-7d228f685f028790ef33de04690c158be8c061fd.jpg';
import testimonial2 from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/5891-4663/assets/fill-f23cb426aa23db1eb506ae030c2917e2c20c25d0.jpg';
import testimonial3 from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/5891-4663/assets/fill-1e53c6d5393cd93dce3db2e0b1ebbf917ff21a35.jpg';

import logoMicrosoft from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/5891-4663/assets/fill-ea4198e3dd0d9a8e2cc3a95e52a6ab1207c2d86e.png';
import logoWaec from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/5891-4663/assets/fill-dda29c92913d42d22b1e9f7cc298472945e33e94.png';
import logoR from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/5891-4663/assets/fill-12c4da2f5308263825a629304615ab85ebfe5dff.png';
import logoDrake from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/5891-4663/assets/fill-b17cafa11730bad7e8ed4f89a31f4c9c07000b71.png';
import logoCollegeBoardMark from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/5891-4663/assets/fill-637fd9beadb26596cdb6b09d7371784ee1c9ada4.png';
import logoEts from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/5891-4663/assets/fill-5d875c0260bc8b356b6af43bb19af98848ea54b2.png';
import logoEcosocSmall from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/5891-4663/assets/fill-2f364a222b92f2d146192314dded388bcdc79963.png';
import logoUjweb from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/5891-4663/assets/fill-e8a6c8991e2327d95ce10132058cf03b0c8f5278.png';
import logoUsEmbassy from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/5891-4663/assets/fill-0e1dec95fb36f51b4f3d12b65e38c191df6a9339.png';
import logoCollegeBoardFull from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/5891-4663/assets/fill-fe4cbfbb4ee6d26b4abc0419c6588f00228dbd55.png';
import logoBritishCouncil from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/5891-4663/assets/fill-ab81d8166a30573bfb5a198cd4d926d42d4313ae.png';
import logoIdxdwonemy from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/5891-4663/assets/fill-f9a0bcb2bfe389c4dd9e419b4fdd2918fb168f31.png';
// The large UN ECOSOC mark has no raster fill in the manifest — vector-only export.
import logoUnEcosoc from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/5891-4663/assets/icon-12042-35135.svg?url';

export {
  heroRing,
  logoMark,
  whoWeArePhoto,
  teamPhoto,
  testimonial1,
  testimonial2,
  testimonial3,
};

export interface PartnerLogo {
  name: string;
  src: ImageMetadata | string;
  /** Rendered height varies per logo's natural aspect ratio, matching the design's row. */
  height: number;
  /**
   * The sub-region of the source actually shown, as fractions of the source canvas.
   *
   * Most of these exports are trimmed to their ink, so the whole file is the logo. Two are
   * not: their PNG is mostly transparent padding, and Figma hides that with a *crop* fill
   * (`scaleMode: "STRETCH"` plus an `imageTransform` matrix `[[w,0,x],[0,h,y]]` — see the
   * per-logo notes below). Rendering the untrimmed file at the row height shrinks the actual
   * mark to a fraction of the band, so the crop has to be reproduced, not ignored.
   */
  crop?: { x: number; y: number; width: number; height: number };
}

/**
 * Heights match the design's 60px logo band (node 12023:32445): full-bleed marks sit at 60px,
 * the padded/inset marks at 40px. (These are 5/3× the earlier 36/24 values, which under-scaled
 * the whole row.)
 */
export const partnerLogos: PartnerLogo[] = [
  { name: 'Microsoft', src: logoMicrosoft, height: 40 },
  { name: 'WAEC', src: logoWaec, height: 60 },
  { name: 'R', src: logoR, height: 40 },
  { name: 'Drake University', src: logoDrake, height: 40 },
  { name: 'The College Board', src: logoCollegeBoardMark, height: 60 },
  { name: 'ETS', src: logoEts, height: 40 },
  {
    name: 'ECOSOC',
    src: logoEcosocSmall,
    height: 60,
    // Node 12023:32429, imageTransform [[0.5626566,0,0.2218045],[0,1,0]] — the 798×409 export
    // carries wide transparent side margins; the design shows the middle 449px, giving 65.9×60.
    crop: { x: 0.2218045, y: 0, width: 0.5626566, height: 1 },
  },
  { name: 'UN ECOSOC', src: logoUnEcosoc, height: 60 },
  { name: 'ujweb', src: logoUjweb, height: 40 },
  { name: 'US Embassy', src: logoUsEmbassy, height: 60 },
  {
    name: 'College Board',
    src: logoCollegeBoardFull,
    height: 40,
    // Node 12023:32435, imageTransform [[0.6095890,0,0.1952055],[0,0.1609756,0.4195122]] — the
    // 584×410 export is ~85% empty: the wordmark is a 356×66 band sitting mid-canvas. Uncropped
    // at height 40 the lettering renders ~6px tall, which is why this one read as "tiny". The
    // crop restores the design's 215×40.
    crop: { x: 0.1952055, y: 0.4195122, width: 0.609589, height: 0.1609756 },
  },
  { name: 'British Council', src: logoBritishCouncil, height: 40 },
  { name: 'idXdWonEmY', src: logoIdxdwonemy, height: 60 },
];
