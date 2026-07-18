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
    },
  },
);
