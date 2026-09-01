import { defineConfig, fontProviders } from 'astro/config';

/**
 * The two styleguides are internal tooling, not a deliverable — nothing links to them and the
 * client is never given the URL. They used to sit in `src/pages/`, which meant they were built
 * and deployed like any other route: publicly reachable, crawlable, and (since /styleguide holds
 * the 3D mark's 608px sprite sheet) about 1 MB.
 *
 * So they live outside `src/pages/` now, where file-based routing cannot see them, and are
 * injected back only when they're wanted. `astro:build:done` deletion would NOT have worked:
 * by then the bundler has already emitted the page's CSS and the WebP sheets into `_astro/`,
 * so the bytes would ship as orphans with no page pointing at them. The exclusion has to happen
 * before the build, which is what this does.
 *
 * Included when: running `astro dev` (always — that's the point of the page), or when
 * `INCLUDE_STYLEGUIDE=1` is set. The gates set it, because `tests/routes.ts` and
 * `lighthouserc.json` both still cover these routes and should keep doing so:
 *   · playwright.config.ts passes it to the webServer build (a11y + visual, local and CI)
 *   · .github/workflows/ci.yml sets it on the Lighthouse job's build
 *   · .github/workflows/update-snapshots.yml sets it on both of its steps
 * A plain `npm run build` — which is what a deploy runs — omits them. That means CI verifies a
 * build differing from the deployed one by exactly these two pages: a deliberate trade, taken
 * because the alternative is shipping two untested pages.
 */
function internalStyleguideRoutes() {
  return {
    name: 'gieva:internal-styleguide-routes',
    hooks: {
      'astro:config:setup': ({ command, injectRoute, logger }) => {
        if (command !== 'dev' && process.env.INCLUDE_STYLEGUIDE !== '1') {
          logger.info(
            'styleguides excluded from this build (set INCLUDE_STYLEGUIDE=1 to keep them)',
          );
          return;
        }
        injectRoute({ pattern: '/styleguide', entrypoint: './src/internal/styleguide.astro' });
        injectRoute({
          pattern: '/ngo/styleguide',
          entrypoint: './src/internal/ngo-styleguide.astro',
        });
      },
    },
  };
}

// GIEVA is two path-prefixed sites (Consultancy + NGO) served from one domain,
// built as a single static Astro project with a shared component library.
// See WORKFLOW.md §3a.
export default defineConfig({
  // site: 'https://gieva.org', // set once the production domain is confirmed
  output: 'static',
  integrations: [internalStyleguideRoutes()],
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
