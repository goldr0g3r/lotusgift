import type { Config } from 'jest';
import { config as baseConfig } from './base.js';

export const nestConfig = {
  ...baseConfig,
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  // Strip `.js` suffix on relative imports during test so ts-jest can resolve
  // the underlying `.ts` source. Required for any consumer running under
  // `moduleResolution: Node16` / `NodeNext` per the TypeScript NodeNext rule.
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
} as const satisfies Config;
