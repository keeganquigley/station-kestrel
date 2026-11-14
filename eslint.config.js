import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/', 'node_modules/', 'tests/shots/'] },
  js.configs.recommended,
  { files: ['src/**/*.js'], languageOptions: { globals: globals.browser } },
  { files: ['*.js', 'tests/**/*.test.js'], languageOptions: { globals: globals.node } },
  {
    // The browser tests are Node scripts, but the functions they hand to page.evaluate run in the page.
    files: ['tests/**/*.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: { ...globals.node, ...globals.browser } },
  },
  {
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: 'error',
    },
  },
];
