import next from 'eslint-config-next';
import tseslint from 'typescript-eslint';

import { core } from './base.js';

/**
 * Next.js App Router. Built on `core` rather than `base`: eslint-config-next
 * v16 already registers the `import` plugin, and flat config rejects a second
 * definition of the same plugin name.
 */
export const nextConfig = [
  ...core,
  ...next,
  {
    // This is an App Router project: there is no `pages/` directory, and the
    // rule that looks for one prints a warning on every run - including from
    // the repository root, where it looks in the wrong place anyway.
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
  {
    // eslint-config-next installs its own parser, but only wires it up for
    // .ts/.tsx. An .mts config file (vitest.config.mts) then reaches the
    // type-aware rules in `core` with no parser services and ESLint aborts the
    // whole run. Hand those extensions back to typescript-eslint.
    files: ['**/*.{mts,cts}'],
    languageOptions: { parser: tseslint.parser },
  },
];

export default nextConfig;
