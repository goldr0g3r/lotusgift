/**
 * LotusGift v2 shared Prettier config.
 *
 * Consumed by the root `.prettierrc.mjs` so every workspace inherits the same
 * formatting rules. Override per-consumer only when a specific file-type
 * needs a different convention (e.g. `*.md` keeps `proseWrap: 'preserve'`).
 *
 * Defaults mostly track Prettier 3's recommendations (printWidth=80,
 * tabWidth=2, useTabs=false, semi=true, trailingComma='all',
 * arrowParens='always'), with `singleQuote: true` overridden to match the
 * LotusGift style preference.
 *
 * Authored as ESM `.mjs` (not `.ts`) so Node can load it natively without a
 * compile step — Prettier reads its config via dynamic import at runtime, and
 * a TypeScript entry would fail with an unknown-extension error.
 *
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
  singleQuote: true,
};

export default config;
