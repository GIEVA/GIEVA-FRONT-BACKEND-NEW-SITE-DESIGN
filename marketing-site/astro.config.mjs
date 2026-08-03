import { defineConfig, fontProviders } from 'astro/config';

// GIEVA is two path-prefixed sites (Consultancy + NGO) served from one domain,
// built as a single static Astro project with a shared component library.
// See WORKFLOW.md §3a.
export default defineConfig({
  // site: 'https://gieva.org', // set once the production domain is confirmed
  output: 'static',
  build: {
    // Emit `about/index.html` rather than `about.html` for clean, trailing-slash URLs.
    format: 'directory',
  },
  // Zero client JS by default — islands opt in explicitly. Progressive enhancement
  // is the baseline (WORKFLOW.md §1.5).

  // Self-hosted webfont for the GIEVA logotype only (design 5891:5463: "GIEVA" Open Sans
  // SemiBold 600, ".org" Regular 400). Astro's Fonts API downloads, subsets, and serves the
  // files locally at build time — no runtime third-party request. Everything else stays on
  // the Arial system stack (--font-family-base). Exposed as var(--font-open-sans); the
  // wordmark consumes it via --font-family-brand (tokens.css).
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Open Sans',
      cssVariable: '--font-open-sans',
      weights: [400, 600],
      styles: ['normal'],
      subsets: ['latin'],
      display: 'swap',
    },
  ],
});
