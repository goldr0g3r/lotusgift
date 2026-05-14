# `@repo/prettier-config`

LotusGift v2's shared Prettier configuration. Consumed by the root [`.prettierrc.mjs`](../../.prettierrc.mjs) so every workspace inherits the same formatting rules.

## Use from a consumer

```js
// .prettierrc.mjs (root, or per-workspace override)
import config from '@repo/prettier-config';

export default config;
```

Override per-workspace when a specific file-type needs a different convention:

```js
import baseConfig from '@repo/prettier-config';

export default {
  ...baseConfig,
  overrides: [
    {
      files: '*.md',
      options: {
        proseWrap: 'preserve',
      },
    },
  ],
};
```

## Defaults

Mostly tracks [Prettier 3's recommendations](https://prettier.io/docs/configuration), with one LotusGift-specific override:

| Option | Value | Source |
| --- | --- | --- |
| `singleQuote` | `true` | LotusGift override (tracks the wider TypeScript community preference) |
| `printWidth` | `80` | Prettier 3 default |
| `tabWidth` | `2` | Prettier 3 default |
| `useTabs` | `false` | Prettier 3 default |
| `semi` | `true` | Prettier 3 default |
| `trailingComma` | `'all'` | Prettier 3 default |
| `arrowParens` | `'always'` | Prettier 3 default |

Refresh quarterly via the [`docs/runbooks/oracle-quarterly-review.md`](../../docs/runbooks/oracle-quarterly-review.md) cadence as Prettier 3.x defaults evolve.

## History

Moved here from `@repo/eslint-config/prettier-base.js` in PR-9 (Phase 1). Centralising prettier rules in this package keeps `@repo/eslint-config` as a pure ESLint surface; consumers stop having to know that prettier rules historically lived elsewhere.
