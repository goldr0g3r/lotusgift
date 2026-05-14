import type { Config } from 'jest';

export const config = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  moduleFileExtensions: ['js', 'ts', 'json'],
  testEnvironment: 'jsdom',
  // Tier-gated coverage thresholds per `.cursor/rules/test-coverage.mdc`.
  // Commented-out by default so packages without tests don't fail CI.
  // Each consumer opts in by un-commenting + overriding numbers per its tier:
  //   - Leaf packages (`@repo/types`, `@repo/utils`):           lines 80, branches 80, functions 80, statements 80
  //   - Services (`services/*`):                                 lines 85, branches 85, functions 85, statements 85
  //   - L0 critical (`auth`, `payment`, `tax`, `payment-saga`):  lines 90, branches 90, functions 90, statements 90
  // coverageThreshold: {
  //   global: { lines: 80, branches: 80, functions: 80, statements: 80 },
  // },
} as const satisfies Config;
