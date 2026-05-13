# LotusGift Design System

> **Status:** v2 baseline established in PR-6 (P0). Backed by `@repo/design-tokens` + `@repo/ui`.
> **Last reviewed:** 2026-05-13

This document is the source-of-truth for **LotusGift's visual language and front-end design conventions**. It pairs with two consumable packages:

- [`@repo/design-tokens`](../../packages/design-tokens/) — token JSON sources + Style Dictionary build emitting `tokens.scss`, `tokens.ts`, `tokens.css`, plus opinionated Sass mixins.
- [`@repo/ui`](../../packages/ui/) — 6 baseline components (Button, IconButton, Card, Pill, SectionShell, Toaster) on Radix Primitives + Sonner + CSS Modules + Sass, with Vitest + `vitest-axe` per-component a11y checks and a Playwright + `@axe-core/playwright` smoke spec wired into CI.

The palette, typography, motion, radii, and shadow tokens are **sourced verbatim** from `_old/apps/web/tailwind.config.ts` (the v1 production design) so the brand identity is preserved 1:1 — only the underlying implementation has changed (CSS Modules + Sass + design tokens, not Tailwind).

---

## 1. Principles

These are the non-negotiables that any new component, page, or copy decision must respect.

1. **Calm, trustworthy, premium.** LotusGift sells corporate gifts at scale. The visual language has to feel like a high-touch B2B partner — never busy, never gimmicky. White space, soft shadows, and confident typography do most of the work.
2. **Brand-first, not framework-first.** Tokens are the API. Components compose tokens. We never reach for Tailwind utility classes, Material design defaults, or third-party themes. If something cannot be expressed as a token + a mixin, surface the gap and add to `@repo/design-tokens` first.
3. **Accessibility is a CI gate, not an aspiration.** WCAG 2.2 AA is enforced automatically via `vitest-axe` per component and `@axe-core/playwright` per page (skeleton in PR-6; full per-page enforcement in P16-P19). No PR ships with axe violations.
4. **Predictable interaction surface.** Buttons, inputs, dialogs, and toasts behave the same way everywhere — same hover lift, same focus ring, same toast position. Variants are constrained (named `primary | pink | outline`, not arbitrary hex). Anything novel goes through `DESIGN.md` first.
5. **Mobile-first, but B2B-aware.** Procurement managers work on desktops. Recipients (P19 recipient portal) open emails on phones. We design for both with a 360px lower bound and a 1440px target.
6. **Tokens are physical, not abstract.** `brand.pink.500` is a real hex (`#F01282`). `space.6` is a real REM value (`1.5rem`). We do not invent semantic-only aliases ("primary-bg") until at least three places need them, to avoid premature indirection.

---

## 2. Tokens

All tokens live in `packages/design-tokens/src/tokens/*.json` and are compiled by Style Dictionary into three artifacts:

| File | Consumers |
| --- | --- |
| `dist/tokens.scss` | `@use '@repo/design-tokens/tokens.scss' as t;` inside any `.module.scss` |
| `dist/tokens.ts` | `import { tokens } from '@repo/design-tokens';` inside React components |
| `dist/tokens.css` | `:root { … }` CSS variables auto-injected by app shells |

### Color

Three brand families × 10 steps each (50 → 950 where applicable). All hex values sourced from `_old/apps/web/tailwind.config.ts`.

| Family | 50 | 500 (primary) | 900 |
| --- | --- | --- | --- |
| `brand.green` | `#E6F4ED` | `#02783C` (LotusGift primary CTA) | `#01331B` |
| `brand.pink` | `#FEE8F2` | `#F01282` (accent / success) | `#4A052B` |
| `brand.ink` | `#F7F7F8` | `#5E5E6B` | `#0E0E13` (default body text on light surfaces) |

`brand.green.500` is the **primary CTA color**. `brand.pink.500` is the **accent + success state** (used for toasts, badges, recipient confirmations). `brand.ink.*` is the **neutral / text scale**.

### Typography

- **`--font-jakarta`** — Plus Jakarta Sans (display + body)
- **`--font-geist-sans`** — Geist Sans (mono-adjacent neutral fallback)
- **`--font-geist-mono`** — Geist Mono (code, IDs, PO numbers)

Sizes (`tokens/typography.json`): `xs (0.75rem)`, `sm (0.875rem)`, `base (1rem)`, `lg (1.125rem)`, `xl (1.25rem)`, `2xl (1.5rem)`, `3xl (1.875rem)`, `4xl (2.25rem)`, `5xl (3rem)`, `6xl (3.75rem)`, `7xl (4.5rem)`, `display-1 (5.5rem)`.

Weights: `400 / 500 / 600 / 700 / 800`. Line-heights: `tight (1.1) / snug (1.25) / normal (1.5) / relaxed (1.625)`.

### Space

REM scale from `0` to `96`: `0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 14, 16, 20, 24, 32, 40, 48, 64, 80, 96`. Use in padding, margin, gap, and CSS Grid track sizes.

### Radius

`none (0) / xs (0.125rem) / sm (0.25rem) / md (0.375rem) / lg (0.5rem) / xl (0.75rem) / 2xl (1rem) / 3xl (1.5rem) / 4xl (2rem) / 5xl (2.5rem) / full (9999px) / blob ('38% 62% 64% 36% / 50% 38% 62% 50%')`.

Default for primary Buttons and IconButtons: `full`. Default for Cards: `3xl`. Default for Pills: `full`.

### Shadow

7 named shadows, all using `rgba(15, 23, 42, x)` so they layer cleanly on light surfaces:

- `soft` — base card resting
- `pill` — Pill / Toast resting
- `panel` — Floating panel (Drawer, Popover)
- `elevated` — Hovered card
- `elevated-lg` — Modal / Dialog
- `glow` — Green CTA hover (`rgba(2, 120, 60, 0.18)`)
- `glow-pink` — Pink badge / Success toast (`rgba(240, 18, 130, 0.22)`)

### Motion

Easings: `out (cubic-bezier(0.16, 1, 0.3, 1)) / in-out (cubic-bezier(0.4, 0, 0.2, 1)) / linear`. Durations: `fast (150ms) / base (200ms) / medium (300ms) / slow (500ms) / very-slow (800ms)`.

### Animation keyframes

13 named keyframes captured verbatim from `_old/apps/web/tailwind.config.ts`: `fade-in-up`, `fade-in`, `slide-down`, `slide-up`, `slide-in-right`, `slide-in-left`, `scale-in`, `shimmer`, `float`, `spin-slow`, `pulse-soft`, `marquee`, `ken-burns`.

---

## 3. Components

PR-6 ships 6 baseline components. All live under `packages/ui/src/<name>/` and are exported from `packages/ui/src/index.ts`.

### Button

Primary CTA primitive. Variants: `primary` (green-on-white), `pink` (pink-on-white), `outline` (transparent + ink border). Sizes: `sm | md | lg`. Supports `asChild` via `@radix-ui/react-slot` for use as `<Link>` wrapper.

```tsx
<Button variant="primary" size="md" onClick={onSubmit}>Request quote</Button>
<Button variant="outline" asChild><Link href="/catalogue">Browse catalogue</Link></Button>
```

### IconButton

Circular interactive icon (search, profile, basket). Variants: `dark | light`. Sizes: `sm | md | lg`. Optional `badgeCount` + `badgeTone` (`pink | green`) for cart-count badges. Uses `lucide-react` icons.

```tsx
<IconButton variant="dark" size="md" icon={<ShoppingBag />} badgeCount={3} badgeTone="pink" aria-label="Open cart" />
```

### Card

Soft-shadow rounded container. Slots: `header | children | footer`. Padding comes from space tokens; radius defaults to `3xl`; shadow defaults to `soft` (hover lifts to `elevated`).

```tsx
<Card header={<h3>SKU summary</h3>} footer={<Button>Add to RFQ</Button>}>
  Premium ceramic mug with embossed logo plate.
</Card>
```

### Pill

Compact tag. Tones: `green | pink | ink | neutral`. Sizes: `sm | md`. Used for status (`In stock` / `RFQ pending`), categorisation, and small data badges.

```tsx
<Pill tone="green" size="sm">In stock</Pill>
<Pill tone="pink" size="md">RFQ pending</Pill>
```

### SectionShell

Responsive max-width container for landing-page sections. Caps width at `1440px` with horizontal padding scaling `space.4 → space.8` across breakpoints. Element type via `as: 'section' | 'div' | 'main' | 'article'`.

```tsx
<SectionShell as="section">
  <h2>Featured corporate gifts</h2>
  <Grid>{products.map(...)}</Grid>
</SectionShell>
```

### Toaster

Re-export of Sonner with LotusGift CSS-var theme defaults (brand-pink success color, top-right position). Mount once in each app's root layout.

```tsx
import { Toaster } from '@repo/ui';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

---

## 4. Accessibility

WCAG 2.2 AA is the floor — never lowered, only raised.

**Per-component (Vitest + `vitest-axe`)**

Each component's `*.test.tsx` renders 2-3 prop permutations and asserts `expect(await axe(container)).toHaveNoViolations()`. CI runs on every PR via the `test` job.

**Per-page (Playwright + `@axe-core/playwright`)**

`packages/ui/tests/e2e/a11y.spec.ts` (PR-6 skeleton) mounts all 6 components on one Playwright component-test page and asserts zero violations across the `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa` rule families. CI runs via a dedicated `a11y` job (required check on `main`).

P16-P19 will extend this with per-app page-level a11y specs (catalogue, RFQ wizard, recipient portal, etc.) using the same `AxeBuilder` pattern.

**Manual checks (per PR)**

1. Tab order matches visual reading order.
2. Focus rings visible on dark and light surfaces (we ship a 2px `brand.green.500` outline with 2px offset).
3. Screen reader (NVDA / VoiceOver) announces button labels, icon-button aria-labels, and toast content.
4. Color contrast spot-check on any new color usage with the Contrast Finder (target ratio: 4.5:1 body, 3:1 large text).

---

## 5. Theming

PR-6 ships a single light theme. CSS variables are emitted by Style Dictionary to `dist/tokens.css` and live on `:root`. Each app's global stylesheet imports `tokens.css` once.

**Dark mode (deferred):** Sonner already supports dark via `data-theme="dark"`. Token-level dark theme will be added in a follow-up PR once we have user demand. The component API never assumes a theme — components only consume token references.

**Per-tenant overrides (deferred):** future enterprise customers may want logo-color overrides. The CSS-var emission means we can override `--brand-green-500` at a tenant-root selector without re-bundling components. Not in PR-6; design notes live here so the path is ready.

---

## 6. Process

**Adding a new token**

1. Edit `packages/design-tokens/src/tokens/<category>.json`.
2. `pnpm --filter @repo/design-tokens build` regenerates `dist/`.
3. Reference the new token in your component's `.module.scss` (via `@use '@repo/design-tokens/tokens.scss' as t;`) or `.tsx` (via `import { tokens } from '@repo/design-tokens';`).
4. Update this section if the token changes a brand commitment (e.g., a new color family).

**Adding a new component**

1. Read this `DESIGN.md` and the relevant existing component for conventions.
2. Create `packages/ui/src/<name>/` with `<Name>.tsx`, `<Name>.module.scss`, `<Name>.test.tsx` (vitest + axe), `index.ts`.
3. Re-export from `packages/ui/src/index.ts`.
4. Add a section to `DESIGN.md §3` documenting variants + an example.
5. Run `pnpm --filter @repo/ui test` and `pnpm --filter @repo/ui test:e2e` — both must pass.

**Reviewing a design PR**

- [ ] Tokens used (no hex values in component CSS — exception: shadow rgba alpha values).
- [ ] Variants exhaustively typed (no `variant: string`; always a union).
- [ ] `aria-label` present on icon-only triggers.
- [ ] Tests cover the new variants + axe assertion.
- [ ] Section added or updated in `DESIGN.md`.
- [ ] CI green (test + lint + a11y).

---

## Related ADRs

- [`docs/architecture/ADR-005-frontend-stack.md`](../architecture/ADR-005-frontend-stack.md) — chose Next.js + Radix + Sass over alternatives.
- [`docs/architecture/ADR-006-monorepo-layout.md`](../architecture/ADR-006-monorepo-layout.md) — workspace layout (packages vs services).

## Related plans

- [Parent plan](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md) — PR-6 row links here.
- [P0-design sub-plan](../../.cursor/plans/p0-design_tokens_ui_baseline_177ccb72.plan.md) — execution details for PR-6.
