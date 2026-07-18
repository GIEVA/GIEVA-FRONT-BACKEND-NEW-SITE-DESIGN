import { defineConfig } from 'astro/config';

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
});
