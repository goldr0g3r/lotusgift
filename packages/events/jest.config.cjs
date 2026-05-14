const { libraryConfig } = require('@repo/jest-config/library');

module.exports = {
  ...libraryConfig,
  // Exclude per-service skeleton folders (empty index.ts shells populated
  // in P5+) and the barrel index so they don't drag down coverage.
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/*.test.ts',
    '!**/*.spec.ts',
    '!**/index.ts',
  ],
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        useESM: false,
        tsconfig: {
          module: 'commonjs',
          moduleResolution: 'node',
          esModuleInterop: true,
          target: 'ES2022',
          isolatedModules: true,
        },
      },
    ],
  },
  // Tier-gated coverage threshold per .cursor/rules/test-coverage.mdc:
  // @repo/events is L1 shared contract — 80% leaf-tier floor.
  coverageThreshold: {
    global: { lines: 80, branches: 80, functions: 80, statements: 80 },
  },
};
