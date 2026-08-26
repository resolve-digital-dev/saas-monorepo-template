import { nest } from '@resolvedigital/eslint-config/nest';

export default [
  ...nest,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        // Pinned to this package so the type-aware rules keep working when
        // ESLint is invoked from the repository root (lint-staged does that).
        tsconfigRootDir: import.meta.dirname,
        // vitest.config.mts is outside tsconfig.json's `include` on purpose
        // (it must not land in the build output), so it needs an inferred
        // project to be type-checked by the linter rather than skipped.
        projectService: { allowDefaultProject: ['vitest.config.mts'] },
      },
    },
  },
  { ignores: ['dist/**', 'coverage/**'] },
];
