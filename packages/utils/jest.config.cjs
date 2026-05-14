const { libraryConfig } = require('@repo/jest-config/library');

module.exports = {
  ...libraryConfig,
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/*.test.ts',
    '!**/*.spec.ts',
    '!**/index.ts',
    // OutboxPort is exercised via the integration test which we run
    // separately under the `OUTBOX_INTEGRATION=1` env flag (mongodb-memory-server
    // is heavy + slow). Unit-test pass focuses on the deterministic helpers.
    '!**/in-process-outbox.ts',
    '!**/mongo-outbox-repository.ts',
  ],
  // Integration test opt-in: skip the mongodb-memory-server suite unless
  // OUTBOX_INTEGRATION=1 is set, so the default `pnpm test` stays fast.
  testPathIgnorePatterns: process.env.OUTBOX_INTEGRATION
    ? []
    : ['<rootDir>/in-process-outbox.integration.test.ts'],
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
        },
      },
    ],
  },
};
