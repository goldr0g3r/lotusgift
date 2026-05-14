# `@repo/jest-config`

Shared Jest configs for every test runner in the LotusGift monorepo. Import the variant that matches your package's runtime; override per-package for project-specific globs.

## Choose your config

| Subpath | For | Notable options |
| --- | --- | --- |
| `@repo/jest-config/base` | Building block; rarely consumed directly. | `coverageProvider: v8`, `moduleFileExtensions: [js, ts, json]`, `testEnvironment: jsdom`. |
| `@repo/jest-config/library` | Plain-TS workspace packages (`packages/@repo/*` not React, not Nest). | `preset: ts-jest`, `testEnvironment: node`, `moduleNameMapper` strips `.js` suffix on relative imports for Node16/NodeNext resolution. |
| `@repo/jest-config/nest` | `apps/api-gateway` and any standalone NestJS app. | Same as library + accepts both `.spec.ts` only (Nest convention). |
| `@repo/jest-config/next` | The 4 Next.js apps. | Wraps `next/jest` factory; adds `jsx` + `tsx` to module file extensions; strips `.js` suffix on relative imports. |

## Use from a consumer

```ts
// packages/my-lib/jest.config.ts
import { libraryConfig } from '@repo/jest-config/library';

export default {
  ...libraryConfig,
  // override per-package settings here if needed.
};
```

NestJS app:

```ts
// apps/api-gateway/jest.config.ts
import { nestConfig } from '@repo/jest-config/nest';

export default nestConfig;
```

## Coverage thresholds (opt-in, tier-gated)

All shared configs ship `coverageThreshold` **commented-out** so packages without tests don't fail CI. Each package opts in when ready by un-commenting + adjusting numbers per its tier (defined in [`.cursor/rules/test-coverage.mdc`](../../.cursor/rules/test-coverage.mdc)):

| Tier | Packages | Threshold (lines / branches / functions / statements) |
| --- | --- | --- |
| Leaf | `@repo/types`, `@repo/utils`, etc. | 80 / 80 / 80 / 80 |
| Services | `services/*` | 85 / 85 / 85 / 85 |
| L0 critical | `services/auth`, `services/payment`, `services/tax`, payment-saga | 90 / 90 / 90 / 90 |

Override per-consumer:

```ts
import { libraryConfig } from '@repo/jest-config/library';

export default {
  ...libraryConfig,
  coverageThreshold: {
    global: { lines: 85, branches: 85, functions: 85, statements: 85 },
  },
};
```

## Node16 module-resolution support

All configs include a `moduleNameMapper` rule that strips the `.js` suffix on relative imports during test runs:

```ts
moduleNameMapper: {
  '^(\\.{1,2}/.*)\\.js$': '$1',
},
```

This lets `ts-jest` resolve the underlying `.ts` source even when production code carries explicit `.js` extensions per the [NodeNext rule](https://www.typescriptlang.org/tsconfig/moduleResolution.html) (P1 modernization adopted for `apps/api-gateway` and `packages/api` in PR-9).

## Adding a new variant

1. Author at `src/<name>.ts`; extend `baseConfig` from `./base.js`; add per-runtime overrides.
2. Add the export subpath to `package.json` (`./<name>` entry pointing at `./dist/<name>.js`).
3. Add a row to the table above + a worked usage example.
4. Re-export from `src/entry.ts` so default imports (`import { libraryConfig } from '@repo/jest-config'`) keep working.
5. Update this README and the consumer-facing docs.
