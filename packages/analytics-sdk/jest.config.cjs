const { libraryConfig } = require('@repo/jest-config/library');

module.exports = {
  ...libraryConfig,
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/*.test.ts',
    '!**/*.spec.ts',
    '!**/index.ts',
    // Browser entry uses posthog-js, which has no Node-friendly stub
    // (its singleton module init touches DOM globals). Covered manually
    // in P16+ Playwright tests.
    '!**/browser.ts',
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
          types: ['node', 'jest'],
          lib: ['es2022', 'DOM'],
        },
      },
    ],
  },
};
