# `@repo/typescript-config`

Shared `tsconfig.json` bases for every package + app in the LotusGift monorepo. Pick the file that matches your workspace's runtime; override per-consumer for `outDir`, `rootDir`, and any project-specific paths.

## Choose your base

| File | For | Notable options |
| --- | --- | --- |
| [`base.json`](base.json) | The strict foundation every other config extends. Direct use only when none of the specialised configs fit. | `module + moduleResolution: NodeNext`, `target: ES2022`, `strict: true`, `noUncheckedIndexedAccess: true`. |
| [`library.json`](library.json) | Workspace packages under `packages/@repo/*` that emit JavaScript (consumed by apps + other packages). | Adds `outDir: dist`, `rootDir: src`, `declaration: true`, `declarationMap: true`, `sourceMap: true`. Excludes `*.test.ts` + `*.spec.ts`. |
| [`nestjs.json`](nestjs.json) | `apps/api-gateway` and any standalone NestJS app. Carries the decorator-metadata + CommonJS interop Nest 11 expects. | `module: commonjs`, `moduleResolution: Node16` (TS 6 modernization vs the deprecated `Node10`), `emitDecoratorMetadata + experimentalDecorators`. |
| [`nextjs.json`](nextjs.json) | The 4 Next.js apps (`web-customer`, `web-vendor`, `web-admin`, `web-customer-service`). | `module: ESNext`, `moduleResolution: Bundler`, `jsx: preserve`, `noEmit: true`, `plugins: [{ name: next }]`. |
| [`react-library.json`](react-library.json) | Workspace packages that publish React components (`@repo/ui`, etc.). | Extends `base.json` + `jsx: react-jsx`. Pair with `library.json` overrides for emit settings. |
| [`test.json`](test.json) | `jest` test runs via `ts-jest`. Referenced by `@repo/jest-config`. | `module: commonjs`, `moduleResolution: Node16`, `isolatedModules: true`, `types: [jest, node]`. |

## Use from a consumer

```jsonc
// packages/my-lib/tsconfig.json
{
  "extends": "@repo/typescript-config/library.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

For apps, override the emit destinations + paths as needed without re-declaring the strict flags from `base.json`.

## TypeScript 6 modernization

Phase 1 (PR-9) dropped the `moduleResolution: "Node10"` value from `nestjs.json` because TS 6 deprecated it (see [microsoft/TypeScript#62200](https://github.com/microsoft/TypeScript/issues/62200), 2026-05-14). Replacement value `Node16` keeps NestJS 11's CommonJS emit while picking up modern Node's `package.json` `exports`/`imports` rules. Consumers of `nestjs.json` running their own Node 20+ workloads (such as `apps/api-gateway`) must use explicit `.js` extensions on relative imports per the [NodeNext rule](https://www.typescriptlang.org/tsconfig/moduleResolution.html).

`baseUrl` was also deprecated in TS 6 — consumers should drop it and use relative imports (or `paths` in their own tsconfig if absolutely required). Workspace package imports (`@repo/*`) resolve via pnpm's symlinks regardless and do not need extensions.

## Adding a new base

1. Drop the file at `packages/typescript-config/<name>.json` extending `base.json` for inheritance.
2. Add a row to the table above describing the runtime + notable options.
3. If the file is for a new emit-target audience (library / app / test) add a worked usage example.
4. If consumers need to extend a strict subset (e.g. `strict-bundler.json`), make sure `noEmit` and `module` don't conflict with the consumer's expected output.
