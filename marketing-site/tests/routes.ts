/**
 * The set of routes exercised by the a11y and visual-regression gates.
 * Extend this as pages are built — every route added here is automatically held to the
 * WCAG gate and gets a committed visual baseline.
 */
export interface RouteUnderTest {
  path: string;
  name: string;
}

export const routes: RouteUnderTest[] = [
  { path: '/', name: 'home' },
  { path: '/styleguide', name: 'styleguide' },
  { path: '/services', name: 'services' },
  // Consultancy service sub-pages. The five test-registration routes are one template
  // (src/pages/services/[slug].astro) over @lib/testprep-content; Professional Development is
  // its own page (two sections, Services-family spacing).
  { path: '/services/sat', name: 'services-sat' },
  { path: '/services/act', name: 'services-act' },
  { path: '/services/toefl', name: 'services-toefl' },
  { path: '/services/ielts', name: 'services-ielts' },
  { path: '/services/gre', name: 'services-gre' },
  { path: '/services/professional-development', name: 'services-professional-development' },
  { path: '/about', name: 'about' },
  { path: '/team', name: 'team' },
  { path: '/partners', name: 'partners' },
  // NGO site (build plan Phase 0B/1). Keep in sync with lighthouserc.json's collect.url by hand.
  { path: '/ngo', name: 'ngo-home' },
  { path: '/ngo/styleguide', name: 'ngo-styleguide' },
  { path: '/ngo/partners', name: 'ngo-partners' },
  { path: '/ngo/about', name: 'ngo-about' },
  { path: '/ngo/program', name: 'ngo-program' },
  { path: '/ngo/contact', name: 'ngo-contact' },
  // NGO Resources — the CMS-backed news index and one article page. The article route is a
  // fixture slug: with GIEVA_API_URL unset (dev machines and CI both), @lib/articles serves
  // fixtures, so this path exists and renders deterministically for the a11y and visual gates.
  // Against a real backend the fixture slug won't exist and this baseline needs repointing at a
  // real article — see docs/ngo-build-plan.md.
  { path: '/ngo/resources', name: 'ngo-resources' },
  {
    path: '/ngo/resources/step-cohort-four-graduates',
    name: 'ngo-resources-article',
  },
  // Not-Found. A real route so the error page is held to the same a11y gate and visual baseline
  // as every other page — it renders the full shell (masthead, footer, brand switcher), so a
  // regression there is exactly as user-facing as one on Home.
  { path: '/404', name: 'not-found' },
];
