/**
 * Test-registration sub-page content — SAT (8119:8722), ACT (8119:8171), TOEFL (8119:8977),
 * IELTS (8119:9179) and GRE (8119:9387), all transcribed from their committed `node.json`.
 *
 * The five frames are one layout with different copy, so they are one route
 * (`src/pages/services/[slug].astro`) over this list rather than five page files. Each renders
 * `SubPageHero` → one `ServiceDetailSection` → `CtaSection`.
 *
 * Confirmed against the source, not guessed:
 *   - **The hero title is the category, not the page.** All five frames read "Test
 *     Registration", over the same hero photo (identical `imageRef`) — so neither is per-page.
 *   - **SAT alone hides its section subtitle** (`visible: false` on 8210:7684) and alone has no
 *     "What it costs" block, carrying "Good to know" in that slot instead. Both reproduced.
 *   - **Styled runs come from `characterStyleOverrides`**, never from reading the picture:
 *     accent-warm prices on ACT/IELTS/TOEFL/GRE, and bold (weight-only, no colour) lead-ins on
 *     IELTS's test-type bullets. See `TextRun` in @lib/service-section for the distinction.
 *   - **"What  is X about" carries a double space** in the ACT, TOEFL, IELTS and GRE frames
 *     (SAT's is single). HTML collapses runs of whitespace, so it renders identically either
 *     way; written single-spaced here rather than preserving a typo no reader could see.
 *   - **Every secondary CTA button reads "Talk to a Councellor"** — a misspelling in the design,
 *     on all five frames. Corrected to "Counsellor" on client instruction; see CtaSection.astro,
 *     which owns that label.
 *   - The CTA buttons have no link targets in the design. They point at `/book-consultancy`,
 *     the same target the existing site-wide CTA uses (a route that does not exist yet — one of
 *     several pre-existing placeholder hrefs, noted in the build plan).
 */
import { accent, strong, type ServiceSection } from '@lib/service-section';

export interface TestPrepPage {
  /** URL slug under /services/. */
  slug: string;
  /** <title>/<meta> copy — authored by us; the design carries no metadata. */
  metaTitle: string;
  metaDescription: string;
  section: ServiceSection;
  cta: { body: string; primaryLabel: string };
}

/** SAT and ACT share this block verbatim in the source; TOEFL, IELTS and GRE each differ. */
const gievaReasonsShared = [
  'Accurate registration, done right the first time',
  'Guidance on test dates, IDs, and devices',
  'Practice resources and prep support',
  "A direct line to applications, scholarships, and visa help when you're ready",
];

export const heroTitle = 'Test Registration';

export const testPrepPages: TestPrepPage[] = [
  {
    slug: 'sat',
    metaTitle: 'SAT Registration — GIEVA Consultancy',
    metaDescription:
      'Register for the digital SAT with GIEVA — test dates, Bluebook, practice resources, and a direct line to applications, scholarships, and visas.',
    section: {
      id: 'sat',
      title: 'SAT',
      // Subtitle deliberately omitted — present in the frame but `visible: false`.
      blocks: [
        {
          heading: 'What is SAT about',
          body: [
            "The SAT is the entrance test that opens doors to universities in the United States and far beyond. It's now fully digital, taken on College Board's Bluebook app, and built around two sections: Reading & Writing, and Maths.",
            'We take the admin off your hands. GIEVA registers you, points you to the right practice, and connects your SAT to the bigger picture — applications, scholarships, and visas — so a test date becomes a real plan for studying abroad.',
          ],
        },
        {
          heading: "What's on the test",
          items: [
            'Reading & Writing, and Maths',
            'Taken digitally on the Bluebook app, at any of 25+ test centres across Nigeria',
            'Bring your own device, or request one from College Board when you register — at least 30 days before test day',
          ],
        },
        {
          heading: 'Good to know',
          items: [
            "The SAT runs on weekend dates from August through June. We'll help you pick one that fits your application deadlines.",
            "Register your name exactly as it appears on the ID you'll bring; they must match on test day.",
            'A free Khan Academy practice tool comes with your Bluebook account. Use it.',
          ],
        },
        { heading: 'Why register through GIEVA', items: gievaReasonsShared },
      ],
    },
    cta: {
      body: 'Ready to sit the SAT? Let GIEVA handle the paperwork while you prepare.',
      primaryLabel: 'Register for the SAT',
    },
  },
  {
    slug: 'act',
    metaTitle: 'ACT Registration — GIEVA Consultancy',
    metaDescription:
      'Register for the ACT with GIEVA — section breakdown, test dates, costs with and without Writing, and support through applications and scholarships.',
    section: {
      id: 'act',
      title: 'ACT',
      subtitle: 'GIEVA registers you for the ACT — and helps you make it count.',
      blocks: [
        {
          heading: 'What is ACT about',
          body: [
            "The American College Test (ACT) is a standardized admissions test accepted by universities across the United States and many other countries. It measures what you've learned where it counts — English, Math, Reading, and Science — with an optional Writing section. For admissions, scholarships, and course placement, a strong ACT score does real work.",
          ],
        },
        {
          heading: "What's on the test",
          items: [
            'English — 75 questions, 45 minutes',
            'Mathematics — 60 questions, 60 minutes',
            'Reading — 40 questions, 35 minutes',
            'Science — 40 questions, 35 minutes',
            'Writing (optional) — one essay, 40 minutes',
          ],
          note: "About three and a half hours with Writing, three without. The ACT is offered seven times a year, and we'll help you choose the sitting that matches your deadlines.",
        },
        {
          heading: 'What it costs',
          items: [
            ['ACT with Writing — ', accent('$222')],
            ['ACT without Writing — ', accent('$197')],
          ],
        },
        { heading: 'Why register through GIEVA', items: gievaReasonsShared },
      ],
    },
    cta: {
      body: "Pick your date. We'll handle the rest.",
      primaryLabel: 'Register for the ACT',
    },
  },
  {
    slug: 'toefl',
    metaTitle: 'TOEFL Registration — GIEVA Consultancy',
    metaDescription:
      'Register for the TOEFL iBT with GIEVA — section timings, test-centre and Home Edition options, costs, and admissions and visa support.',
    section: {
      id: 'toefl',
      title: 'TOEFL',
      subtitle: 'GIEVA makes TOEFL registration simple — and prepares you to pass it well.',
      blocks: [
        {
          heading: 'What is TOEFL about',
          body: [
            "The Test of English as a Foreign Language (TOEFL) measures how well you read, listen, speak, and write in English at university level — and it's how thousands of institutions decide you're ready to study with them. It's accepted by more than 11,500 universities across 160+ countries, including throughout the USA, UK, Canada, Australia, and Europe.",
          ],
        },
        {
          heading: "What's on the test",
          items: [
            'Reading — 35 minutes',
            'Listening — 36 minutes',
            'Speaking — 16 minutes',
            'Writing — 29 minutes',
          ],
          note: "About two hours in total. The TOEFL iBT is available at test centres and, in some cases, as a Home Edition — we'll help you choose what suits you.",
        },
        {
          heading: 'What it costs',
          body: [[accent('₦220,000'), ', admin charges included.']],
        },
        {
          heading: 'Why register through GIEVA',
          items: [
            'Official registration support with fast confirmation',
            'Practice materials and study guides',
            'Admissions counselling and visa support',
            'Help finding scholarships you qualify for',
          ],
        },
      ],
    },
    cta: {
      body: "One test stands between you and your offer. Let's get you registered.",
      primaryLabel: 'Register for the TOEFL',
    },
  },
  {
    slug: 'ielts',
    metaTitle: 'IELTS Registration — GIEVA Consultancy',
    metaDescription:
      'Register for IELTS with GIEVA — Academic, General Training, and UKVI explained, with fees, practice resources, and one-to-one advising.',
    section: {
      id: 'ielts',
      title: 'IELTS',
      subtitle:
        'GIEVA registers you for IELTS — for study, work, or migration — and helps you score well.',
      blocks: [
        {
          heading: 'What is IELTS about',
          body: [
            "International English Language Testing System (IELTS) is the world's most popular test of English proficiency, recognised by more than 11,000 universities, employers, and immigration authorities across the globe. Whether you're heading abroad to study, to work, or to settle, a strong IELTS band is what opens the door.",
            'GIEVA guides you through the whole thing — choosing the right version, registering, and preparing — so you walk in confident.',
          ],
        },
        {
          heading: "What's on the test",
          items: [
            [
              strong('IELTS Academic'),
              ' — for university study abroad. Paper or computer-based.',
            ],
            [
              strong('IELTS General Training'),
              ' — for migration to Canada, Australia, the UK, and New Zealand. Paper or computer-based.',
            ],
            [
              strong('IELTS for UKVI'),
              ' — for UK visa and immigration purposes (Academic or General Training).',
            ],
          ],
          note: 'Not sure which you need? A quick word with a counsellor settles it.',
        },
        {
          heading: 'What it costs',
          items: [
            ['Paper-based (Academic or General Training) — ', accent('₦282,000')],
            ['Computer-based (Academic or General Training) — ', accent('₦271,000')],
            ['IELTS for UKVI — ', accent('₦290,500')],
          ],
          note: 'All fees include admin charges.',
        },
        {
          heading: 'Why register through GIEVA',
          items: [
            'Fast, secure registration with the right test type',
            'Authentic study resources and practice tests',
            'Personalised advising and test-prep guidance',
            'One-to-one support for school applications and visa counselling',
          ],
        },
      ],
    },
    cta: {
      body: 'Ready to prove your English? Let GIEVA handle your IELTS registration end to end.',
      primaryLabel: 'Register for the IELTS',
    },
  },
  {
    slug: 'gre',
    metaTitle: 'GRE Registration — GIEVA Consultancy',
    metaDescription:
      "Register for the GRE with GIEVA — what the test measures, what it costs, and support through Master's, MBA, and PhD applications.",
    section: {
      id: 'gre',
      title: 'GRE',
      subtitle:
        "GIEVA registers you for the GRE and supports the journey to your Master's, MBA, or PhD.",
      blocks: [
        {
          heading: 'What is GRE about',
          body: [
            "The Graduate Record Examination (GRE) is the admissions test that thousands of graduate and business schools rely on — for Master's degrees, MBAs, specialised business master's, and doctoral programmes alike. It's a measure of whether you're ready for advanced study, and a strong score strengthens both your application and your case for funding.",
            'GIEVA has supported GRE candidates since 2007. We simplify the registration and stay with you through the wider journey — applications, scholarships, and visas.',
          ],
        },
        {
          heading: 'What it measures',
          items: [
            'Verbal Reasoning',
            'Quantitative Reasoning',
            'Analytical Writing',
            'Critical thinking and problem-solving',
          ],
          note: 'The GRE is section-adaptive and taken computer-based at official test centres.',
        },
        {
          heading: 'What it costs',
          body: [
            [
              accent('$200'),
              ' — or the equivalent in Naira at the current exchange rate. Admin charges included.',
            ],
          ],
        },
        {
          heading: 'Why register through GIEVA',
          items: [
            'Step-by-step registration assistance',
            'GRE preparation resources and practice materials',
            'Guidance on graduate applications and scholarships',
            'Fast, reliable service with attention to detail',
          ],
        },
      ],
    },
    cta: {
      body: "Your graduate journey starts with one test. Let's get you registered.",
      primaryLabel: 'Register for the GRE',
    },
  },
];
