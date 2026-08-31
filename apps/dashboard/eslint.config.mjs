import { reactInternal } from '@resolvedigital/eslint-config/react';

export default [...reactInternal, { ignores: ['dist/**', 'coverage/**'] }];
