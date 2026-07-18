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
}

export const primaryNav: NavItem[] = [
  { label: 'Consultancy', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Resource', href: '/resources' },
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
      { label: 'Programs', href: '/ngo/programs' },
      { label: 'Resources', href: '/ngo/resources' },
    ],
  },
];

/** Normalise a pathname for active-state comparison (trailing slash agnostic). */
export function isActive(current: string, href: string): boolean {
  const norm = (p: string) => (p !== '/' && p.endsWith('/') ? p.slice(0, -1) : p);
  return norm(current) === norm(href);
}
