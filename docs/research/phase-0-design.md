# Phase-0 Design Research Note

**Date:** 2026-05-13
**Phase:** 0
**Workstream:** design
**Layer:** L3 (`@repo/design-tokens`, `@repo/ui`)
**Sub-plan:** [`.cursor/plans/p0-design_tokens_ui_baseline_177ccb72.plan.md`](../../.cursor/plans/p0-design_tokens_ui_baseline_177ccb72.plan.md)
**Parent plan:** [`.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md`](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md)

This note backs the design tokens + UI baseline ship for PR-6. Every dependency below is retrieval-dated per the `always-latest-docs.mdc` rule.

## 1. Sources reviewed (retrieval-dated 2026-05-13)

| # | Topic | URL | Notes |
| --- | --- | --- | --- |
| 1 | Style Dictionary v5 | https://styledictionary.com/ | Industry-standard token transformer maintained by Amazon. v5.x (May 2025+) requires Node ≥ 22, supports W3C DTCG and native JSON inputs; configurable platforms emit SCSS, CSS custom properties, and typed TS in one pass. Used by Apple/Salesforce/Adobe. |
| 2 | Radix Primitives | https://www.radix-ui.com/primitives/docs | Per-primitive packages (e.g., `@radix-ui/react-slot`); tree-shaken; full keyboard + screen-reader support; unstyled by default. PR-6 only needs `react-slot` for Button's `asChild` API. |
| 3 | Lucide React | https://lucide.dev/ | Tree-shakable icon set (~1300 icons May 2026); first-class React component (`lucide-react`). Successor to react-feather. Used in `_old/apps/web/components/ui/IconButton.tsx`. |
| 4 | Sonner | https://sonner.emilkowal.ski/ | Lightweight (~11 KB gzipped) toast lib for React. Dark-mode-aware, promise-aware. Used in `_old/apps/web/components/ui/Toaster.tsx`. |
| 5 | dart-sass (`sass` npm) | https://sass-lang.com/dart-sass | Modern Sass implementation. Native support in Next.js `.module.scss` CSS Modules pipeline. |
| 6 | Vitest 3.x | https://vitest.dev/ | jsdom runtime, RTL-compatible, CSS Modules out-of-box. Faster than Jest for monorepo packages. |
| 7 | `vitest-axe` | https://github.com/chaance/vitest-axe | Maintained successor to `jest-axe`; matchers `toHaveNoViolations()`. Runs inside Vitest jsdom. |
| 8 | `@axe-core/playwright` | https://www.npmjs.com/package/@axe-core/playwright | Wraps axe-core for Playwright pages; used in CI for full-page WCAG enforcement. |
| 9 | `@playwright/experimental-ct-react` | https://playwright.dev/docs/test-components | Component-testing harness. Mounts React components in a real browser for accurate a11y + visual checks. |
| 10 | WCAG 2.2 AA | https://www.w3.org/TR/WCAG22/ | Latest stable spec (Oct 2024). Axe-core covers WCAG 2.1/2.2 A+AA automatically via the `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa` tag families. |
| 11 | clsx | https://www.npmjs.com/package/clsx | Standard tiny utility for conditional className strings. |

## 2. Decisions log

| # | Decision | Choice | Rejected | Reasoning |
| --- | --- | --- | --- | --- |
| D1 | Token emission tooling | Style Dictionary v5 native JSON inputs | Custom tsx script; TS-only no-SCSS | Mature, multi-platform output; one source of truth, three emitted formats (SCSS + typed TS + CSS vars) in one run. v5 (May 2025) requires Node ≥ 22 — already our floor. |
| D2 | Token source format | Style Dictionary native JSON (one file per category) | W3C DTCG format | DTCG adds a translation layer we do not need for a single-repo private project. |
| D3 | Sass mixins location | `packages/design-tokens/src/mixins/*.scss` (consumed by `@repo/ui` via `@use '@repo/design-tokens/mixins'`) | Co-located in `@repo/ui` | Mixins reference token values; pairing them with the tokens keeps a single semantic-utility surface. |
| D4 | Component framework | Radix Primitives where applicable + Sonner for Toaster | Headless UI / chakra-ui | Parent plan fixes Radix. Sonner already used in `_old`. |
| D5 | Icon library | Lucide React | react-icons (heavier, less tree-shake-friendly) / Iconify | Used in `_old` IconButton. |
| D6 | CSS strategy | CSS Modules + Sass per component | Tailwind, styled-components, vanilla-extract | Parent plan §5 + ADR. |
| D7 | Component test strategy | Vitest + jsdom + RTL + `vitest-axe` for components; `@axe-core/playwright` skeleton in CI for E2E | jest-axe; Playwright-only; no tests | Vitest faster for unit; Playwright skeleton activates per-page in P16-P19. |
| D8 | Playwright wiring | Skeleton workflow + one smoke spec mounting all 6 | Full per-component spec | Real pages do not exist yet; smoke validates pipeline. |
| D9 | Storybook | Not in this PR | Storybook + Chromatic | Out of parent-plan scope; add later if visual-regression need surfaces. |
| D10 | Tailwind interop | None in `@repo/ui` | Tailwind alongside | Parent plan + ADR rejection of Tailwind. |
| D11 | Toaster export | Re-export Sonner with LotusGift CSS-var theme defaults | Build from scratch | Reuse the mature primitive; theme via CSS vars. |
| D12 | Token source values | Verbatim from `_old/apps/web/tailwind.config.ts` | Re-design palette | The brand identity is locked from the previous v1 work; PR-6 preserves it 1:1 (3 color families × 10 steps each + 13 keyframes + 7 shadows + radii + Plus Jakarta + Geist). |

## 3. Open questions

- **Branch-protection update**: the new `a11y` job becomes a required check. Apply via `gh api ... /branches/main/protection -X PUT --input infrastructure/github/branch-protection.json` at status-sync (after merge).
- **Token `dist/` gitignore**: yes — apps build from source via Style Dictionary on `pnpm build` (turbo `dependsOn: ['^build']`).
- **Storybook timing**: re-evaluate after P16-P19 page work; if pages need visual-regression, add Storybook + Chromatic as a follow-up PR.

## 4. Implementation checklist

- [x] `docs/design/DESIGN.md` (6 sections)
- [x] `packages/design-tokens` with Style Dictionary build + 7 token JSONs + 4 Sass mixin files + index.ts re-export
- [x] `packages/ui` with 6 components (Button, IconButton, Card, Pill, SectionShell, Toaster) + Vitest specs + Playwright a11y skeleton
- [x] `.github/workflows/ci.yml` new `a11y` job
- [x] `infrastructure/github/branch-protection.json` adds `a11y` to required contexts
- [x] `pnpm install && pnpm build && pnpm lint && pnpm test` all green (Playwright browser install requires CI runner — `test:e2e` deferred to the GHA `a11y` job)
- [ ] PR opened, Copilot review, squash merge
- [ ] Status sync: project board + Epic #4 + Phase-Acceptance #5 + parent plan + this note

## 5. Versions captured

Captured via `pnpm --filter @repo/design-tokens ls --depth=0` and `pnpm --filter @repo/ui ls --depth=0` on the smoke checkout that produced this PR.

### `@repo/design-tokens` (PR-6)

| Package | Version |
| --- | --- |
| `style-dictionary` | 5.4.0 |
| `typescript` | 5.9.2 |

### `@repo/ui` (PR-6)

| Package | Version |
| --- | --- |
| `@radix-ui/react-slot` | 1.2.4 |
| `@repo/design-tokens` | workspace link |
| `clsx` | 2.1.1 |
| `lucide-react` | 1.14.0 |
| `react` | 19.1.0 (`^19.1.0` resolves to 19.2.0 at install time; package.json pin is the source of truth) |
| `react-dom` | 19.1.0 (same) |
| `sonner` | 2.0.7 |
| `@axe-core/playwright` | 4.11.3 |
| `@playwright/experimental-ct-react` | 1.60.0 |
| `@playwright/test` | 1.60.0 |
| `@testing-library/jest-dom` | 6.9.1 |
| `@testing-library/react` | 16.3.2 |
| `axe-core` | 4.11.4 |
| `jsdom` | 29.1.1 |
| `sass` | 1.99.0 |
| `vitest` | 3.2.4 |
| `vitest-axe` | 0.1.0 |
| `typescript` | 5.9.2 |

## 6. Implementation reference

Filled after merge: PR URL + squash SHA + diff stats.
