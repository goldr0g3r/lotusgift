import "@testing-library/jest-dom/vitest";
import * as matchers from "vitest-axe/matchers";
import type { AxeMatchers } from "vitest-axe/matchers";
import { expect } from "vitest";

expect.extend(matchers);

// vitest-axe@0.1.0 ships type augmentation against the old Vitest `Vi` namespace,
// which is no longer used in Vitest 3.x. Re-augment `vitest`'s `Assertion`
// interface here so `toHaveNoViolations()` is available without a type error.
declare module "vitest" {
  /* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
  interface Assertion<T = any> extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
  /* eslint-enable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
}
