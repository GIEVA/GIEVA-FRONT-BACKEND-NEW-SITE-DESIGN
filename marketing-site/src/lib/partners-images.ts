/**
 * Partners page image assets — sourced from the committed Figma ingestion
 * (design/figma/fTqnnV20l9htP7vFJrOsvn/7385-5219/assets/), not duplicated into src/assets.
 * The hero photo is the same shared lecture-hall stock shot Home/About/Services/Team already
 * reuse (identical imageRef, `fill-55fffb0d…`).
 *
 * `logoSterlingBank` is the one exception: Sterling Bank's card logo (node 8000:9930,
 * "sterling_bank 1") is a ~40-path vector group where every path is generically named
 * "Vector" — the fetch helper's name-dedup treats anonymous "Vector" nodes as noise and skips
 * them (a Phase 0 decision, see scripts/figma-fetch.mjs), so it wasn't captured on first
 * ingestion. Backfilled during this (Phase 5) build via a direct one-node Figma images API
 * render rather than a whole-page `--all-vectors` re-run — see assets/manifest.json's `notes`.
 */
import partnersHeroPhoto from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/7385-5219/assets/fill-55fffb0d206b64f043184380f13f723b24c692a3.jpg';

import logoWaec from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/7385-5219/assets/fill-dda29c92913d42d22b1e9f7cc298472945e33e94.png';
import logoNeco from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/7385-5219/assets/fill-637fd9beadb26596cdb6b09d7371784ee1c9ada4.png';
import logoColab from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/7385-5219/assets/fill-12c4da2f5308263825a629304615ab85ebfe5dff.png';
import logoEts from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/7385-5219/assets/fill-5d875c0260bc8b356b6af43bb19af98848ea54b2.png';
import logoEcosoc from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/7385-5219/assets/fill-55b4951ac4692c8bfb9cee3587b6db4cac825eae.png';
import logoUsEmbassy from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/7385-5219/assets/fill-19f1b0c07c1d9d93d4a1dcf11110229d806742b8.png';
import logoWaterAid from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/7385-5219/assets/fill-166fa5bef0eafc2be90bbb3e857a63ff9112b1f6.png';
import logoCucas from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/7385-5219/assets/fill-5a219f0b69bea65ddfd0ad3dcabfc619dabe6253.png';
import logoNuc from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/7385-5219/assets/fill-a97ecd68c3c9c052316d94231f48f3ffa8c895f8.png';
import logoCare4Water from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/7385-5219/assets/fill-0923c72942efa55880b7dcdec5a523c27ba18bc7.png';
import logoCollegeBoard from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/7385-5219/assets/fill-e99690d202090bf1d021547637734b4c222c8579.png';
import logoAsake from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/7385-5219/assets/fill-e9713477c42d3f9c1e7d774d1e191233e7fb4eb4.png';
import logoCsacefa from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/7385-5219/assets/fill-96ce2c931b765b1295b53b543c57286325438a4c.png';
import logoBritishCouncil from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/7385-5219/assets/fill-ab81d8166a30573bfb5a198cd4d926d42d4313ae.png';
import logoPittsburg from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/7385-5219/assets/fill-3d2633b5951e42cd24c6307e62fbae36bd32393f.jpg';
import logoSterlingBank from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/7385-5219/assets/fill-sterling-bank-8000-9930.png';
import logoUniJos from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/7385-5219/assets/fill-e8a6c8991e2327d95ce10132058cf03b0c8f5278.png';
import logoDrake from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/7385-5219/assets/fill-b17cafa11730bad7e8ed4f89a31f4c9c07000b71.png';
import logoZte from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/7385-5219/assets/fill-94ac7541c69e23887ab7c5a7f328b04f7bd89358.png';
import logoAct from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/7385-5219/assets/fill-60ca5a87cabc2232ede8538df7707fb2bde55cf4.png';
import logoGlobalGiving from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/7385-5219/assets/fill-ae492b727629813ac6e6762afde420cfcb94c9db.png';
import logoMicrosoft from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/7385-5219/assets/fill-ea4198e3dd0d9a8e2cc3a95e52a6ab1207c2d86e.png';
import logoEdiface from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/7385-5219/assets/fill-753adcb427d9d1ee160ef3645e152566b189df0a.png';
import logoDatadotorg from '../../design/figma/fTqnnV20l9htP7vFJrOsvn/7385-5219/assets/fill-f9a0bcb2bfe389c4dd9e419b4fdd2918fb168f31.png';

export { partnersHeroPhoto };

export const partnerLogos = {
  waec: logoWaec,
  neco: logoNeco,
  colab: logoColab,
  ets: logoEts,
  ecosoc: logoEcosoc,
  usEmbassy: logoUsEmbassy,
  waterAid: logoWaterAid,
  cucas: logoCucas,
  nuc: logoNuc,
  care4Water: logoCare4Water,
  collegeBoard: logoCollegeBoard,
  asake: logoAsake,
  csacefa: logoCsacefa,
  britishCouncil: logoBritishCouncil,
  pittsburg: logoPittsburg,
  sterlingBank: logoSterlingBank,
  uniJos: logoUniJos,
  drake: logoDrake,
  zte: logoZte,
  act: logoAct,
  globalGiving: logoGlobalGiving,
  microsoft: logoMicrosoft,
  ediface: logoEdiface,
  datadotorg: logoDatadotorg,
};
