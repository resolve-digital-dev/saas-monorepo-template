import tseslint from 'typescript-eslint';

import { base } from './base.js';

/** Type-aware rules for the NestJS API — the reason type information is loaded at all. */
export const nest = tseslint.config(
  ...base,
  {
    // Typed linting is scoped to TypeScript sources; applying it to config
    // files (.mjs/.js) makes the type-aware rules fail to load.
    //
    // `tsconfigRootDir` is deliberately NOT set here: this file lives in
    // packages/eslint-config, so any value derived from it would be wrong, and
    // `process.cwd()` breaks the moment ESLint is invoked from anywhere but the
    // package directory (lint-staged does exactly that). Each consumer pins it
    // to its own `import.meta.dirname`.
    files: ['**/*.ts'],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    // Test doubles and HTTP assertions are `any` by nature: `vi.fn()` returns
    // `any`, and supertest types `response.body` as `any`. Keeping the unsafe-*
    // family on here would mean casting every assertion, which buys nothing.
    files: ['**/*.spec.ts', '**/*.test.ts', '**/*.e2e-spec.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },
);

export default nest;
