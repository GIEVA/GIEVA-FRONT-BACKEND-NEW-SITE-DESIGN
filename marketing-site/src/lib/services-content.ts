/**
 * Consultancy Services (/services) content — kept separate from layout (services.astro) since
 * this is the ★ reusable template page (docs/consultancy-build-plan.md): other sub-pages are
 * riffs off the same section shape, so the content shouldn't be entangled with markup/styles.
 *
 * Transcribed verbatim from node 8119:7174. Two entries ("Admission Processing" and "Tuition &
 * Acceptance Fee Payments") duplicate another entry's about/covers copy word-for-word in the
 * source `node.json` — confirmed real (not a transcription slip), matching the same
 * not-yet-personalised placeholder pattern Home's build plan documented for its Core Team /
 * testimonials sections. Kept as-is.
 *
 * The section shape itself now lives in `@lib/service-section` (`ServiceSection`), shared with
 * the test-registration sub-pages and Professional Development. This file previously declared
 * its own fixed about/covers/cost interface; the sub-pages proved the block roles vary per
 * page, so the three blocks below are just the first three entries of a generic `blocks[]`.
 */
import { accent, type ServiceSection } from '@lib/service-section';

export const heroTitle = 'Study Abroad';

/**
 * Three separate paragraphs in the source, not one flowing block: the text node's `characters`
 * carry two hard newlines and the node measures exactly 7 lines (168px / 24px), which only adds
 * up if the accent sentence and "It's made for students…" each start a fresh line. An earlier
 * pass ran all three together behind a single leading `<em>`; corrected against node.json.
 */
const healsAbout = [
  [accent("Studying abroad shouldn't come down to who you know.")],
  "Holistic Education Advising and Learning Services (HEALS) is GIEVA's end-to-end advising service for Nigerian students aiming for university overseas. We help you choose the right schools, build a competitive application, clear admissions and visas, and arrive ready for day one.",
  "It's made for students with the potential to go far but not always the guidance or networks to get there — and for the families backing them.",
];
const healsCovers = [
  'One-to-one advising and mentoring',
  'School selection matched to your goals and budget',
  'Application, essay, and admissions support',
  'Test registration and prep — SAT, ACT, TOEFL, IELTS, GRE',
  'Visa and pre-departure orientation, including SEVIS',
  'Lifetime access to the HEALS alumni network',
];

const culturalAbout =
  'Adjusting to a new culture can be one of the biggest challenges for international students. HEALS offers cultural integration sessions to help you acclimate to your new environment, covering local customs, social norms, and essential living skills to ensure a smooth transition.';
const culturalCovers = [
  'Workshops on cultural norms and practices',
  'Peer mentorship programs with current international students',
  'Social events to meet fellow students and build community',
  'Resources for dealing with culture shock and homesickness',
];

/**
 * The HEALS block trio — reused verbatim by "Admission Processing" in this page's own frame,
 * and by both of Professional Development's sections (8145:8502). Exported so that page shares
 * this one definition rather than re-transcribing identical copy.
 */
export const healsBlocks = [
  {
    heading: 'What is HEALS about',
    body: healsAbout,
  },
  { heading: 'What HEALS covers', items: healsCovers },
  {
    heading: 'What it costs',
    body: [[accent('$100'), ' Membership Application Fee, admin charges included.']],
  },
];

/** The cultural-integration block trio, reused verbatim by "Tuition & Acceptance Fee Payments". */
const culturalBlocks = [
  { heading: 'Adapting to Life Abroad', body: [culturalAbout] },
  { heading: 'Cultural support services', items: culturalCovers },
  { heading: 'Integration Program Fees', body: ['Included in membership; no extra costs.'] },
];

const subtitle = 'From first step to first day on campus.';

export const services: ServiceSection[] = [
  { id: 'heals', title: 'HEALS', subtitle, blocks: healsBlocks },
  { id: 'admission-processing', title: 'Admission Processing', subtitle, blocks: healsBlocks },
  {
    id: 'scholarship-advising',
    title: 'Scholarship Advising',
    subtitle,
    blocks: [
      {
        heading: 'Financial Aid for Prospective Students',
        body: [
          'Navigating the financial aspect of studying abroad can be daunting. HEALS provides comprehensive support to identify scholarships and grants that align with your academic profile and financial needs. We assist you in crafting compelling scholarship applications that highlight your unique strengths and achievements.',
        ],
      },
      {
        heading: 'What we offer in scholarships',
        items: [
          'Personalized scholarship search',
          'Guidance on application requirements and deadlines',
          'Tips for writing impactful scholarship essays',
          'Access to exclusive scholarship opportunities through partner institutions',
        ],
      },
      {
        heading: 'Cost of Services',
        body: ['No additional fees for scholarship advising; included in membership.'],
      },
    ],
  },
  { id: 'career-guidance', title: 'Career Guidance', subtitle, blocks: culturalBlocks },
  {
    id: 'tuition-acceptance-fee-payments',
    title: 'Tuition & Acceptance Fee Payments',
    subtitle,
    blocks: culturalBlocks,
  },
];
