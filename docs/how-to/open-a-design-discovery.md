# Open a Design Discovery

**Audience**: anyone proposing a new frontend page family
**Phase**: P0 onward
**Last reviewed**: 2026-05-18
**Owner**: @goldr0g3r

## When to open a Design Discovery

Before implementing any new page family / component system in `apps/web-*` or `packages/ui`. This gates frontend code to ensure intentional design decisions.

## Steps

### 1. Open a GitHub issue using the template

```powershell
gh issue create --template design-discovery.yml --repo goldr0g3r/lotusgift
```

Or via web: <https://github.com/goldr0g3r/lotusgift/issues/new?template=design-discovery.yml>

### 2. Fill in the template

The issue template asks for:
- **Page family name** (e.g., "Product Detail Page", "Vendor Dashboard")
- **Target app** (web-customer / web-vendor / web-admin / web-customer-service)
- **User stories** — what the user needs to accomplish
- **Design constraints** — brand tokens, accessibility requirements, responsive breakpoints
- **Wireframe directions** — at least 2 alternative approaches

### 3. Create wireframes

Place wireframe files in `docs/design/wireframes/`:
```
docs/design/wireframes/<page-family>-direction-A.png
docs/design/wireframes/<page-family>-direction-B.png
```

### 4. Get approval

The Design Discovery issue must be approved (direction chosen) before implementation starts. Update the issue with the chosen direction.

### 5. Reference in implementation PR

Link the Design Discovery issue from the implementation PR body.

## Design system constraints

Per the LotusGift v2 stack:
- **Radix Primitives** — accessible base components
- **CSS Modules + Sass** — styling (NO Tailwind)
- **`packages/design-tokens`** — brand colours, typography, spacing
- WCAG 2.2 AA compliance on every page (enforced by `@axe-core/playwright` in E2E)

## See also

- [`.cursor/rules/design-discovery.mdc`](../../.cursor/rules/design-discovery.mdc)
- [`../design/DESIGN.md`](../design/DESIGN.md)
- [`.github/ISSUE_TEMPLATE/design-discovery.yml`](../../.github/ISSUE_TEMPLATE/design-discovery.yml)
