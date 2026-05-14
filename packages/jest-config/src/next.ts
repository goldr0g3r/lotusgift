import type { Config } from 'jest';
// unfortunately, need to disambiguate the `Config` namespace @jest/types uses (via next/jest) and the `Config` type we want for typing our config here
import type { Config as ConfigNamespace } from '@jest/types';
import nextJest from 'next/jest';
import { config as baseConfig } from './base.js';

const createJestConfig = nextJest({
  dir: './',
});

const config = {
  ...baseConfig,
  moduleFileExtensions: [...baseConfig.moduleFileExtensions, 'jsx', 'tsx'],
  // Strip `.js` suffix on relative imports during test so ts-jest can resolve
  // the underlying `.ts` source. Required under `moduleResolution: Node16` /
  // `NodeNext` per the TypeScript NodeNext rule.
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
} as const satisfies Config;

const nextConfig = createJestConfig(config);

export default nextConfig;
