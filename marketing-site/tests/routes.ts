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
  { path: '/about', name: 'about' },
  { path: '/team', name: 'team' },
  { path: '/partners', name: 'partners' },
];
