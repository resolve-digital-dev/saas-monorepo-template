import js from '@eslint/js';
import prettier from 'eslint-config-prettier/flat';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import importPlugin from 'eslint-plugin-import-x';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export const ignores = {
  ignores: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/.next/**',
    '**/.turbo/**',
  ],
};

/**
 * Language rules shared by every package, with no plugins beyond
 * typescript-eslint. Kept separate from the import plugin because
 * `eslint-config-next` registers its own `import` plugin and flat config
 * refuses to have it defined twice.
 */
export const core = tseslint.config(
  ignores,
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
    },
  },
  {
    // Build/tooling files inside a package (postcss.config.js, *.config.mjs).
    // `js.configs.recommended` enables `no-undef`, which fires on `module` and
    // `process` unless the Node globals are declared here.
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.node },
    },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs' },
  },
  prettier,
);

/**
 * Import hygiene. Skipped by the Next preset, which brings its own copy.
 *
 * Uses `eslint-plugin-import-x` rather than `eslint-plugin-import`: the fork is
 * actively maintained and already declares support for ESLint 10, which is one
 * of the three things currently pinning this repo to ESLint 9.
 */
export const importRules = [
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    settings: {
      // No explicit `project`: a relative path here is resolved against the
      // *working directory*, so it only pointed at the right tsconfig while
      // ESLint happened to be invoked from inside the package. Run from the
      // repository root - which is exactly what lint-staged does - it silently
      // resolved nothing and reported phantom `import-x/default` errors.
      // Left unset, the resolver walks up from each file to its own tsconfig.
      'import-x/resolver-next': [createTypeScriptImportResolver({ alwaysTryTypes: true })],
    },
    rules: {
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import-x/no-duplicates': 'error',
    },
  },
];

/**
 * Default preset: language rules plus import hygiene.
 *
 * Errors stay errors on purpose — `eslint-plugin-only-warn` used to downgrade
 * every rule to a warning, which made `turbo run lint` pass no matter what.
 */
export const base = [...core, ...importRules];

export default base;
