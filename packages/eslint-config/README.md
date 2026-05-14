# `@repo/eslint-config`

Shared ESLint flat-config presets for every package + app in the LotusGift monorepo. All presets are ESM-only and target ESLint 9.x.

## Choose your preset

| Subpath | For | Pulls in |
| --- | --- | --- |
| `@repo/eslint-config/base` | The foundation every other preset extends. Rarely consumed directly. | `@eslint/js` recommended + `eslint-config-prettier` + `typescript-eslint` recommended + `eslint-plugin-turbo` (warn on undeclared env vars) + `eslint-plugin-only-warn` + repo-wide ignore patterns. |
| `@repo/eslint-config/library` | Plain Node libraries (`packages/@repo/*` not React, not Nest). | Base + Node globals + ES module source type. |
| `@repo/eslint-config/nest-js` | `apps/api-gateway` and standalone NestJS apps. | Base + Node + Jest globals + CommonJS source type + `projectService` enabled + Nest-typical `no-floating-promises` / `no-unsafe-argument` set to `warn`. |
| `@repo/eslint-config/next-js` | The 4 Next.js apps. | Base + Next plugin + React plugin + React Hooks plugin. |
| `@repo/eslint-config/react-internal` | Workspace React libraries (`@repo/ui`). | Base + React plugin + React Hooks plugin + service-worker + browser globals. |

## Use from a consumer

```js
// packages/my-lib/eslint.config.mjs
import { libraryConfig } from "@repo/eslint-config/library";

export default libraryConfig;
```

Extend per-package:

```js
import { libraryConfig } from "@repo/eslint-config/library";

export default [
  ...libraryConfig,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
];
```

## Flat config + ESLint 9

All presets follow the [ESLint 9 flat-config format](https://eslint.org/docs/latest/use/migrate-to-9.0.0). Legacy `.eslintrc*` files are not supported. ESLint v9.x reaches end-of-life on 2026-08-06; we'll bump to v10 in a follow-up PR before then.

## Prettier rules live in `@repo/prettier-config`

Prior to PR-9, prettier rules lived at `./prettier-base.js` in this package. That entry has been removed; consumers should import from [`@repo/prettier-config`](../prettier-config/) directly:

```js
import config from "@repo/prettier-config";
```

See [`packages/prettier-config/README.md`](../prettier-config/README.md) for usage.

## Adding a new preset

1. Author at `<name>.js` following the same flat-config shape as `base.js` / `library.js` / `nest.js`.
2. Add the export subpath to `package.json` (`./<name>` entry pointing at `./<name>.js`).
3. Add a row to the table above + a worked usage example.
4. If the preset introduces a new ESLint plugin, add it to `devDependencies` (peer-friendly pin) AND ensure the plugin is loaded via `import` at the top of the file, not via the legacy `extends` string.
