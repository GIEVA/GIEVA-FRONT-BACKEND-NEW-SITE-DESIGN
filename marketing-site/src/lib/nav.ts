/**
 * Site navigation model — the single source of truth for the primary nav and footer links.
 * Kept in one place so header, footer, and any sitemap stay in sync.
 *
 * `primaryNav` and the footer column links mirror Home's real header/footer nodes
 * (5891:5463 / I8210:7883;8210:7817 in node.json) exactly, rather than the full Consultancy
 * page inventory in docs/consultancy-build-plan.md — the shipped design simply doesn't
 * surface "Our Team"/"Partners" in the shared shell (they're presumably reached via the
 * "Consultancy" item, shown with a dropdown caret in the design but with no submenu content
 * captured, or from within other pages). "Resource(s)" and the NGO columns don't have a
 * built route yet; hrefs point at the planned path so the shell is complete ahead of the page.
 */
export interface NavItem {
  label: string;
  href: string;
  /**
   * Optional dropdown revealed on hover/focus. Progressive-enhancement only: the top-level
   * `href` still navigates, so the menu is pure extra affordance (CSS-driven baseline, JS adds
   * the hover-intent delay + ARIA state — see SiteHeader).
   */
  menu?: NavMenu;
}

/** A dropdown panel: one column (About, Consultancy) or several side by side (Services). */
export interface NavMenu {
  columns: NavMenuColumn[];
}

export interface NavMenuColumn {
  /** Small muted section label, e.g. "ABOUT GIEVA" (Figma "Heading 6", opacity 0.5). */
  heading: string;
  items: NavItem[];
}

/**
 * Primary nav + dropdowns, mirroring the Figma nodes:
 *   Consultancy → "SWITCH GIEVA" brand switcher (8171:7367)
 *   About       → "ABOUT GIEVA" (8171:7315)
 *   Services    → three columns (8176:7403)
 *   Resource    → no dropdown
 * Dropdown hrefs for pages not yet built point at their planned paths (same "shell ahead of
 * pages" convention as the top-level items). "Technology Training" fixes the design's
 * "Technolodgy" typo.
 */
export const primaryNav: NavItem[] = [
  {
    label: 'Consultancy',
    href: '/',
    menu: {
      columns: [
        {
          heading: 'Switch GIEVA',
          items: [
            { label: 'GIEVA NGO', href: '/ngo' },
            { label: 'GIEVA Consultancy', href: '/' },
          ],
        },
      ],
    },
  },
  {
    label: 'About',
    href: '/about',
    menu: {
      columns: [
        {
          heading: 'About GIEVA',
          items: [
            { label: 'Who We Are', href: '/about' },
            { label: 'Our Team', href: '/team' },
            { label: 'Strategic Partners', href: '/partners' },
            { label: 'Contact', href: '/contact' },
          ],
        },
      ],
    },
  },
  {
    label: 'Services',
    href: '/services',
    menu: {
      columns: [
        {
          heading: 'Test Registration',
          items: [
            { label: 'SAT', href: '/services/sat' },
            { label: 'ACT', href: '/services/act' },
            { label: 'TOEFL', href: '/services/toefl' },
            { label: 'IELTS', href: '/services/ielts' },
            { label: 'GRE', href: '/services/gre' },
          ],
        },
        {
          // These five are sections of /services (8119:7174), not pages of their own — the
          // design has no separate frame for any of them — so they link to anchors on it.
          // The ids come from `ServiceSection.id` in @lib/services-content and are rendered
          // by ServiceDetailSection. Note the last one intentionally targets
          // `tuition-acceptance-fee-payments`: the id follows the section's title in the
          // design, which the old (404ing) `/services/tuition-acceptance-fee` slug did not.
          heading: 'Study Abroad',
          items: [
            { label: 'HEALS', href: '/services#heals' },
            { label: 'Admission Processing', href: '/services#admission-processing' },
            { label: 'Scholarship Advising', href: '/services#scholarship-advising' },
            { label: 'Career Guidance', href: '/services#career-guidance' },
            {
              label: 'Tuition & Acceptance Fee',
              href: '/services#tuition-acceptance-fee-payments',
            },
          ],
        },
        {
          // The design has one Professional Development page (8145:8502) holding both
          // sections, not a page each — so these link to sections on it. The ids come from
          // `ServiceSection.id` in @lib/profdev-content.
          heading: 'Professional Development',
          items: [
            {
              label: 'Teacher Training',
              href: '/services/professional-development#teacher-training',
            },
            {
              label: 'Technology Training',
              href: '/services/professional-development#technology-training',
            },
          ],
        },
      ],
    },
  },
  { label: 'Resource', href: '/resources' },
];

/**
 * NGO primary nav — mirrors NGO Home's real header node (7417:7718 in the 5990:3672 node.json)
 * exactly: NGO · About us · Programs · Resources · Contact. "NGO" is the brand/home anchor
 * (the counterpart to Consultancy's "Consultancy" item), so it points at the NGO home root.
 * Hrefs for pages not yet built point at their planned `/ngo/*` paths (build plan page index),
 * so the shell is complete ahead of the pages — same convention as primaryNav above.
 */
export const ngoPrimaryNav: NavItem[] = [
  { label: 'NGO', href: '/ngo' },
  { label: 'About us', href: '/ngo/about' },
  { label: 'Programs', href: '/ngo/program' },
  { label: 'Resources', href: '/ngo/resources' },
  { label: 'Contact', href: '/ngo/contact' },
];

export interface FooterColumn {
  heading: string;
  items: NavItem[];
}

export const footerColumns: FooterColumn[] = [
  {
    heading: 'Consultancy',
    items: [
      { label: 'About', href: '/about' },
      { label: 'Services', href: '/services' },
      { label: 'Resources', href: '/resources' },
    ],
  },
  {
    heading: 'NGO',
    items: [
      { label: 'About', href: '/ngo/about' },
      { label: 'Programs', href: '/ngo/program' },
      { label: 'Resources', href: '/ngo/resources' },
    ],
  },
];

/**
 * Normalise a pathname for active-state comparison (trailing slash agnostic).
 *
 * In-page anchors (`/services#heals`) are deliberately never active. They *do* point at the
 * current page when you are on `/services`, so `aria-current="page"` would be defensible — but
 * all five Study Abroad links would announce "current page" at once, which tells a screen-reader
 * user nothing and drowns out the real signal on the parent "Services" item. The hash is
 * stripped and then rejected explicitly so this stays a decision rather than a side effect of
 * string equality.
 */
export function isActive(current: string, href: string): boolean {
  if (href.includes('#')) return false;
  const norm = (p: string) => (p !== '/' && p.endsWith('/') ? p.slice(0, -1) : p);
  return norm(current) === norm(href);
}
