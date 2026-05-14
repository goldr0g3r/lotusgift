import type { Config } from 'prettier';

/**
 * LotusGift v2 shared Prettier config.
 *
 * Consumed by the root `.prettierrc.mjs` so every workspace inherits the same
 * formatting rules. Override per-consumer only when a specific file-type
 * needs a different convention (e.g. `*.md` keeps `proseWrap: 'preserve'`).
 *
 * Defaults mostly track Prettier 3's recommendations (printWidth=80,
 * tabWidth=2, useTabs=false, semi=true, trailingComma='all', arrowParens='always'),
 * with `singleQuote: true` overridden to match the LotusGift style preference.
 *
 * @see https://prettier.io/docs/configuration
 */
const config: Config = {
  singleQuote: true,
};

export default config;
