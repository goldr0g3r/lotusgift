import type { Config } from 'jest';
import { config as baseConfig } from './base.js';

/**
 * Jest config for plain-TS workspace packages (`packages/@repo/*` that are not
 * React or NestJS). Uses ts-jest as the transformer, runs in Node, strips
 * `.js` from relative imports during resolution so tests can `import` source
 * compiled under `moduleResolution: Node16` / `NodeNext`.
 */
export const libraryConfig = {
  ...baseConfig,
  rootDir: 'src',
  testRegex: '.*\\.(test|spec)\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s', '!**/*.d.ts', '!**/index.ts'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  // Opt-in coverage thresholds — un-comment + adjust per the tier table in
  // `./base.ts`. Leaf packages start at 80 / 80 / 80 / 80.
  // coverageThreshold: {
  //   global: { lines: 80, branches: 80, functions: 80, statements: 80 },
  // },
} as const satisfies Config;
