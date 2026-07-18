/**
 * Partners page content — transcribed from Figma node 7385:5219's node.json, in the page's
 * real visual grid order (row-major, 6 rows × 4 columns).
 *
 * The grid uses Figma's `GRID` auto-layout mode with MANUAL item positioning: each card
 * carries its own `gridRowAnchorIndex`/`gridColumnAnchorIndex`, which does NOT always match
 * document/array order — "CoLab Innovation Hub" is the one card whose id sorts last in the
 * document (it was evidently added/edited after the rest) but is manually positioned into row
 * 1, column 3. The order below is sorted by (row, col), i.e. the order a sighted user actually
 * sees, not raw document order.
 *
 * Each org name is its own "Heading 4"/"Heading 5" node in Figma (a real, if inconsistent,
 * layer-naming signal — unlike Team's card name, whose text node is literally just named after
 * its own content, "Julie Sande", with no "Heading" designation at all). Rendered as `<h3>`
 * here for that reason: a 24-item directory benefits from real per-item heading navigation,
 * and the source data itself flags these as headings, unlike Team's caption-over-photo card.
 * The lead sentence above the grid becomes the `<h2>` needed to keep heading order valid
 * (h1 → h2 → h3×24 → h2 "Become a Partner") even though it isn't itself named "Heading" in
 * the source — Figma's naming here is a hint, not a spec.
 *
 * Genuine spelling errors in the source ("paartner", "pandenic", "interract") are reproduced
 * verbatim per exact-replica-first, same precedent as About's "Mision".
 */
import { partnerLogos } from '@lib/partners-images';
import type { ImageMetadata } from 'astro';

export interface PartnerOrg {
  name: string;
  description: string;
  logo: ImageMetadata;
  /** Confirmed via `characterStyleOverrides` (textDecoration: UNDERLINE) — only Datadotorg's
   *  card underlines a substring of its description in the source. */
  descriptionUnderline?: string;
}

export const partnerOrgs: PartnerOrg[] = [
  {
    name: 'West African Examination Council (WAEC)',
    description:
      "GIEVA has some form of relationship with this organizations with respect to students' overseas' placement.",
    logo: partnerLogos.waec,
  },
  {
    name: 'National Examination Council (NECO)',
    description:
      "GIEVA has some form of relationship with this organizations with respect to students' overseas' placement.",
    logo: partnerLogos.neco,
  },
  {
    name: 'CoLab Innovation Hub',
    description:
      "CoLab is a consortium member in the Microsoft awarded grant for GIEVA's Gen AI project. They were involved with training of cohorts.",
    logo: partnerLogos.colab,
  },
  {
    name: 'Education Testing Services',
    description:
      'This organization regulates all testing activities, like TOEFL, GRE, GMAT, etc. in the USA. GIEVA has been in partnership with ETS for about 15 years.',
    logo: partnerLogos.ets,
  },
  {
    name: 'United Nations Economic and Social Council',
    description:
      'GIEVA is a member of the United Nations Economic and Social Council as a not-for-profit organization.',
    logo: partnerLogos.ecosoc,
  },
  {
    name: 'US Embassy - Nigeria',
    description:
      'GIEVA works with The Education USA of the US Embassy for in-country logistics managements for their applicants.',
    logo: partnerLogos.usEmbassy,
  },
  {
    name: 'WaterAid - Nigeria',
    description:
      'GIEVA is currently working with WaterAid Nigeria in the development of applications that will aid the awareness and marketability of their Female Local Area Mechanics.',
    logo: partnerLogos.waterAid,
  },
  {
    name: 'CUCAS - CHINA',
    description:
      'CUCAS is a Chinese pathway to seamless admission processing to certain Asian countries, especially China. GIEVA works closely with CUCAS to ensure such smooth passage of Nigerian students to Asia.',
    logo: partnerLogos.cucas,
  },
  {
    name: 'Nigeria University Commission (NUC)',
    description:
      'GIEVA is currently mapping a working relationship with the NUC to see other transition pathway from High school to various universities in Nigeria, especially for applicants from the underserved regions.',
    logo: partnerLogos.nuc,
  },
  {
    name: 'Care4Water CSR Initiative',
    // Authored with manual line breaks in the source (node 8000:9883) — a real
    // `characterStyleOverrides`-adjacent formatting choice, not organic wrap, so it's
    // preserved (rendered with `white-space: pre-line`) rather than joined into one line.
    description:
      'The goal of this long-term CSR\n(Corporate Social Responsibility)\npartnership is to engage each of\nthe 8,000+ global employees, to\nsupport dedicated water projects\nin Mexico, Brazil, South Africa,\nThailand, India, and Indonesia.',
    logo: partnerLogos.care4Water,
  },
  {
    name: 'College Board - USA',
    description:
      "CoLab is another consortium member in the Microsoft awarded grant for GIEVA's Gen AI project. They were involved with training of cohorts.",
    logo: partnerLogos.collegeBoard,
  },
  {
    name: 'Asake Foundation - Nigeria',
    description:
      'GIEVA became a partner with the Asake Foundation during her PLWD program. The partnership has remained cordial.',
    logo: partnerLogos.asake,
  },
  {
    name: 'CSACEFA - Nigeria',
    description:
      'GIEVA work with Civil Society Action Coalition on Education for All in regards to generative education and pedagogy information.',
    logo: partnerLogos.csacefa,
  },
  {
    name: 'British Council - Nigeria',
    description:
      'British Council is responsible for administering the IELTS and Cambridge tests all over the world. GIEVA is a strong partner with the British Council in Nigeria, having linked the organization with several interested applicants.',
    logo: partnerLogos.britishCouncil,
  },
  {
    name: 'University of Pittsburg - USA',
    description:
      'GIEVA has over the years maintained a smooth relationship with the university of Pittsburg USA',
    logo: partnerLogos.pittsburg,
  },
  {
    name: 'Sterling bank - Nigeria',
    description:
      'GIEVA anchored the Amira & Friends project for Sterling Bank and is open to more partnerships from the institution.',
    logo: partnerLogos.sterlingBank,
  },
  {
    name: 'University of Jos- Nigeria',
    description:
      "UniJos has been and is currently instrumental to research and development activities where GIEVA's social impact projects are concerned. The wealth of resources of her human capital is massive.",
    logo: partnerLogos.uniJos,
  },
  {
    name: 'Drake University- USA',
    description:
      'GIEVA is the current representative of DRAKE University USA in Nigeria. With a $10,000 automatic scholarship for applicants from Nigeria through GIEVA.',
    logo: partnerLogos.drake,
  },
  {
    name: 'ZTE - CHINA',
    description:
      'ZTE is a China-based organization involved with facilitating admission process for international applicants into China. GIEVA is in partnership with ZTE and has processed admission for several Nigerians to china through them.',
    logo: partnerLogos.zte,
  },
  {
    name: 'ACT - USA',
    description:
      'GIEVA was the representative of American Collegiate Test in Nigeria for about five years.',
    logo: partnerLogos.act,
  },
  {
    name: 'Global Giving — USA',
    description:
      'Global giving is an empowerment organization and a social connect hub for organizations involved in social impact activities globally.',
    logo: partnerLogos.globalGiving,
  },
  {
    name: 'Microsoft',
    description:
      'Since being awarded the Microsoft Gen AI Grant in 2024, GIEVA has been in a smooth partnership relationship with the Microsoft corporation.',
    logo: partnerLogos.microsoft,
  },
  {
    name: 'EDIFACE - UK',
    description:
      'Ediface became a loving paartner of GIEVA organization during the COVID pandenic, where the need to interract virtually was paramount.',
    logo: partnerLogos.ediface,
  },
  {
    name: 'Datadotorg - USA',
    description:
      'GIEVA was a beneficiary of the Microsoft-initiated Data.Org grant award in 2023/2024 focused on the development of Generative Artificial Intelligence.',
    descriptionUnderline: 'Data.Org',
    logo: partnerLogos.datadotorg,
  },
];

export interface PartnerFormField {
  id: string;
  label: string;
  type: 'text' | 'url' | 'tel' | 'email';
  autocomplete?: string;
}

// The "Become a Partner" interview form (node 8000:10047). Every field renders as a single-line
// input in the source, including "Message" — its row is pixel-identical in height (74px) to
// every other field's, with no multi-line box drawn, so a single-line control is the faithful
// replica; a `<textarea>` would be a reasonable future enhancement but isn't what's designed.
export const partnerFormFields: PartnerFormField[] = [
  { id: 'partner-name', label: 'What is your name?', type: 'text', autocomplete: 'name' },
  { id: 'partner-company', label: "What is your company's name?", type: 'text' },
  {
    id: 'partner-website',
    label: "Link to your company's website.",
    type: 'url',
    autocomplete: 'url',
  },
  {
    id: 'partner-industry',
    label: 'What Industry does your company fall into?',
    type: 'text',
  },
  {
    id: 'partner-phone',
    label: 'Please provide a phone number',
    type: 'tel',
    autocomplete: 'tel',
  },
  {
    id: 'partner-email',
    label: 'Please provide a contact email',
    type: 'email',
    autocomplete: 'email',
  },
  { id: 'partner-message', label: 'Message', type: 'text' },
];
