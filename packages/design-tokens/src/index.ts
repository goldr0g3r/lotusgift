// Public TS entry for @repo/design-tokens.
// Re-exports the typed `tokens` const + `Tokens` type from the Style Dictionary
// build output in `dist/tokens.ts`. The dist file is regenerated on every
// `pnpm install` (via the `prepare` script) and on every `pnpm build`.

export { tokens, type Tokens } from "../dist/tokens.js";
