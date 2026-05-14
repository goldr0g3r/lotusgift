const { libraryConfig } = require('@repo/jest-config/library');

module.exports = {
  ...libraryConfig,
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
  // Exclude type-only modules + test files + barrel index so they don't
  // drag down branch/function coverage.
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/*.test.ts',
    '!**/*.spec.ts',
    '!**/index.ts',
    '!**/types.ts',
  ],
  // Tier-gated coverage threshold per .cursor/rules/test-coverage.mdc:
  // @repo/openapi-spec is L1 shared contract — 80% leaf-tier floor.
  coverageThreshold: {
    global: { lines: 80, branches: 80, functions: 80, statements: 80 },
  },
};
