# `@repo/design-tokens`

LotusGift's design tokens — the canonical source for color, typography, spacing, radii, shadows, motion, and animation values. Powered by [Style Dictionary v4](https://styledictionary.com/).

## Outputs

A single token JSON edit propagates to three artifacts under `dist/`:

| File | Consumer | Example |
| --- | --- | --- |
| `tokens.scss` | `@use '@repo/design-tokens/tokens.scss' as t;` | `$brand-green-500` |
| `tokens.css` | imported once in app `globals.css` | `--brand-green-500` |
| `tokens.ts` | `import { tokens } from '@repo/design-tokens';` | `tokens.brand.green['500']` |

Sass mixins (hand-authored, live in `src/mixins/`) consume the SCSS tokens and expose opinionated shapes:

| Subpath | Mixins |
| --- | --- |
| `@repo/design-tokens/mixins` (barrel) | All of the below, with prefixes `btn-*`, `type-*` |
| `@repo/design-tokens/mixins/buttons` | `primary`, `pink`, `outline`, `size-sm`, `size-md`, `size-lg` |
| `@repo/design-tokens/mixins/typography` | `eyebrow`, `h1-display`, `h2`, `body`, `body-sm` |
| `@repo/design-tokens/mixins/utilities` | `icon-circle`, `icon-circle-light`, `button-reset`, `sr-only` |
| `@repo/design-tokens/mixins/keyframes` | 13 `@keyframes` blocks |

## Source JSONs

- `src/tokens/color.json` — `brand.green/pink/ink` × 10 steps + `brand.cream/white/black`
- `src/tokens/typography.json` — Plus Jakarta + Geist fallbacks + size/weight/line-height/letter-spacing scales
- `src/tokens/space.json` — REM scale `0..96`
- `src/tokens/radius.json` — `none..5xl` + `full` + `blob`
- `src/tokens/shadow.json` — `soft`, `pill`, `panel`, `elevated`, `elevated-lg`, `glow`, `glow-pink`
- `src/tokens/motion.json` — `ease.out/in-out/linear` + `duration.fast/base/medium/slow/very-slow`
- `src/tokens/animation.json` — 13 named animation shorthands

All values are sourced verbatim from `_old/apps/web/tailwind.config.ts` to preserve the v1 brand identity 1:1.

## Build

```bash
pnpm --filter @repo/design-tokens build
```

The script runs `style-dictionary.config.mjs` which registers a custom `typescript/nested-const` format for `tokens.ts` and uses Style Dictionary's built-in `scss/variables` and `css/variables` formats for the other two outputs.

`dist/` is gitignored and regenerated on `pnpm install` (via the `prepare` hook).

## Adding a new token

1. Edit the relevant `src/tokens/*.json`.
2. Run `pnpm --filter @repo/design-tokens build` to verify the three outputs.
3. Reference the new token from a component's `.module.scss` or `.tsx`.
4. Update `docs/design/DESIGN.md` if the change is brand-level (new color family, new shadow).

See [`docs/design/DESIGN.md`](../../docs/design/DESIGN.md) for the LotusGift design-system principles and conventions.
