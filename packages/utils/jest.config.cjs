const { libraryConfig } = require('@repo/jest-config/library');

module.exports = {
  ...libraryConfig,
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
          types: ['node', 'jest'],
        },
      },
    ],
  },
};
