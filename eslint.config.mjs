import js from '@eslint/js';
import prettier from 'eslint-config-prettier/flat';
import globals from 'globals';

/**
 * Root config. Each workspace package owns its own `eslint.config.mjs`; this
 * one covers only the loose scripts at the repository root.
 *
 * It is not dead weight: `pnpm lint` runs it through the `//#lint:root` task in
 * turbo.json, and `lint-staged` reaches it via `v10_config_lookup_from_file`
 * (ESLint resolves the nearest config per file instead of using cwd).
 */
export default [
  {
    ignores: [
      'apps/**',
      'packages/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/.turbo/**',
      '.husky/**',
    ],
  },
  js.configs.recommended,
  {
    // Root-level tooling runs on Node. Without these globals `module`,
    // `process` and `console` all trip `no-undef`.
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.node },
    },
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['**/*.js'],
    languageOptions: { sourceType: 'commonjs' },
  },
  {
    files: ['**/*.mjs'],
    languageOptions: { sourceType: 'module' },
  },
  prettier,
];
