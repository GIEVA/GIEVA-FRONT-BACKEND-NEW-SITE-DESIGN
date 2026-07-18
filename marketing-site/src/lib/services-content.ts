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
 */
export interface ServiceDetail {
  id: string;
  title: string;
  subtitle: string;
  aboutHeading: string;
  /** Bold-italic accent-warm hook sentence leading the "about" copy (HEALS-content only). */
  aboutLead?: string;
  aboutBody: string;
  coversHeading: string;
  coversItems: string[];
  costHeading: string;
  /** Bold-italic accent-warm run at the start of the cost copy (e.g. a dollar amount). */
  costHighlight?: string;
  costBody: string;
}

export const heroTitle = 'Study Abroad';

const healsAboutLead = "Studying abroad shouldn't come down to who you know.";
const healsAboutBody =
  "Holistic Education Advising and Learning Services (HEALS) is GIEVA's end-to-end advising service for Nigerian students aiming for university overseas. We help you choose the right schools, build a competitive application, clear admissions and visas, and arrive ready for day one. It's made for students with the potential to go far but not always the guidance or networks to get there — and for the families backing them.";
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

export const services: ServiceDetail[] = [
  {
    id: 'heals',
    title: 'HEALS',
    subtitle: 'From first step to first day on campus.',
    aboutHeading: 'What is HEALS about',
    aboutLead: healsAboutLead,
    aboutBody: healsAboutBody,
    coversHeading: 'What HEALS covers',
    coversItems: healsCovers,
    costHeading: 'What it costs',
    costHighlight: '$100',
    costBody: 'Membership Application Fee, admin charges included.',
  },
  {
    id: 'admission-processing',
    title: 'Admission Processing',
    subtitle: 'From first step to first day on campus.',
    aboutHeading: 'What is HEALS about',
    aboutLead: healsAboutLead,
    aboutBody: healsAboutBody,
    coversHeading: 'What HEALS covers',
    coversItems: healsCovers,
    costHeading: 'What it costs',
    costHighlight: '$100',
    costBody: 'Membership Application Fee, admin charges included.',
  },
  {
    id: 'scholarship-advising',
    title: 'Scholarship Advising',
    subtitle: 'From first step to first day on campus.',
    aboutHeading: 'Financial Aid for Prospective Students',
    aboutBody:
      'Navigating the financial aspect of studying abroad can be daunting. HEALS provides comprehensive support to identify scholarships and grants that align with your academic profile and financial needs. We assist you in crafting compelling scholarship applications that highlight your unique strengths and achievements.',
    coversHeading: 'What we offer in scholarships',
    coversItems: [
      'Personalized scholarship search',
      'Guidance on application requirements and deadlines',
      'Tips for writing impactful scholarship essays',
      'Access to exclusive scholarship opportunities through partner institutions',
    ],
    costHeading: 'Cost of Services',
    costBody: 'No additional fees for scholarship advising; included in membership.',
  },
  {
    id: 'career-guidance',
    title: 'Career Guidance',
    subtitle: 'From first step to first day on campus.',
    aboutHeading: 'Adapting to Life Abroad',
    aboutBody: culturalAbout,
    coversHeading: 'Cultural support services',
    coversItems: culturalCovers,
    costHeading: 'Integration Program Fees',
    costBody: 'Included in membership; no extra costs.',
  },
  {
    id: 'tuition-acceptance-fee-payments',
    title: 'Tuition & Acceptance Fee Payments',
    subtitle: 'From first step to first day on campus.',
    aboutHeading: 'Adapting to Life Abroad',
    aboutBody: culturalAbout,
    coversHeading: 'Cultural support services',
    coversItems: culturalCovers,
    costHeading: 'Integration Program Fees',
    costBody: 'Included in membership; no extra costs.',
  },
];
