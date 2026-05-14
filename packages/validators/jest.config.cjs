// CJS jest config. Overrides ts-jest to compile test files as CommonJS
// (the package's `tsconfig.json` uses `module: NodeNext` for source, but
// jest's runtime expects CJS unless the whole VM is launched with
// `--experimental-vm-modules`). Keeps the test runner self-contained
// without an experimental Node flag.
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
  // @repo/validators is L1 shared contract — 80% leaf-tier floor.
  coverageThreshold: {
    global: { lines: 80, branches: 80, functions: 80, statements: 80 },
  },
};
