// Public TS entry for @repo/design-tokens.
// Re-exports the typed `tokens` const + `Tokens` type from the Style Dictionary
// build output at `../dist/tokens.ts`. The dist file is regenerated on every
// `pnpm install` (via the `prepare` script) and on every `pnpm build`. The
// extension-less specifier resolves via `moduleResolution: "Bundler"` (set in
// this package's tsconfig and supported by every consumer of the package).

export { tokens, type Tokens } from "../dist/tokens";
