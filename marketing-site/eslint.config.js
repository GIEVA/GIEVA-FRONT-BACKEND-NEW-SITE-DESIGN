import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintPluginAstro from 'eslint-plugin-astro';

// Flat config. Accessibility is a build-time gate (WORKFLOW.md §2), so we run the
// *strict* Astro jsx-a11y ruleset, not merely the recommended one.
export default tseslint.config(
  {
    ignores: [
      'dist/',
      '.astro/',
      'node_modules/',
      'playwright-report/',
      'test-results/',
      'design/figma/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs['flat/recommended'],
  ...eslintPluginAstro.configs['flat/jsx-a11y-strict'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    // Test + tooling files run in Node with Playwright globals.
    files: ['tests/**/*.ts', '*.config.{js,ts,mjs}'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    // `role="list"` on <ul>/<ol> is intentional, not redundant: when we remove list styling
    // with `list-style: none`, Safari + VoiceOver drop the list role, so restating it keeps
    // the list announced. Allow exactly that pairing; the strict ruleset stays on otherwise.
    files: ['**/*.astro'],
    rules: {
      'astro/jsx-a11y/no-redundant-roles': ['error', { ul: ['list'], ol: ['list'] }],
      // A `tabindex="0"` on a non-interactive element is normally a smell — but a horizontally
      // scrollable container is the documented exception, and the two tools disagree about it:
      // axe's `scrollable-region-focusable` (WCAG 2.1.1) FAILS a scroll container that no
      // keyboard can reach, while this rule fails the `tabindex` that fixes it. The accepted
      // resolution is `tabindex="0"` + a labelled `role="region"`, which is what the styleguide
      // tables carry. `tabpanel` is the rule's own default for the same shape of exception;
      // this adds `region` beside it and leaves the strict ruleset otherwise untouched, so a
      // bare focusable <div> with no role is still an error.
      'astro/jsx-a11y/no-noninteractive-tabindex': [
        'error',
        { tags: [], roles: ['tabpanel', 'region'] },
      ],
    },
  },
);
