import { nextConfig } from '@resolvedigital/eslint-config/next';

// Assigned before export: eslint-config-next's `no-anonymous-default-export`
// rule applies to this file too.
const config = [...nextConfig, { ignores: ['.next/**', 'coverage/**'] }];

export default config;
