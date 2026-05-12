# LotusGift v2 — Copilot Repo Instructions

Trust these instructions and only search when the information here is incomplete or appears wrong.

## What this repo is

LotusGift v2 is a multi-vendor, multi-warehouse **corporate gifting** marketplace for the Indian market. Three deltas vs a generic e-commerce stack:

- **Auto-router** between instant Cart and RFQ (small orders → cart, large/customized → RFQ).
- **Deep customization workflow** (art upload → mockup → approval → audit + in-app thread).
- **Recipient-list drop-shipping** (CSV upload → N shipments to N recipients with per-recipient personalization).

Built as a **modular monolith**: one `apps/api-gateway` Node process hosts every business module as a Nest library under `services/*`. Four Next.js apps under `apps/web-*` each target a user persona (customer / vendor / admin / customer-service).

## Stack

- **Language / runtime**: TypeScript on Node ≥ 20.
- **Monorepo**: Turborepo + pnpm workspaces.
- **Backend**: NestJS 11 + `nestjs-zod` 5.3 + `@thallesp/nestjs-better-auth` 2.6 + Mongoose 8 + Better-Auth ≥ 1.5 (Organization plugin).
- **Frontend**: Next.js (App Router) + Radix Primitives + CSS Modules + Sass — **no Tailwind**.
- **Validation**: Zod end-to-end. Backend DTOs via `createZodDto`. Frontend hooks via Kubb v3 + `@kubb/plugin-react-query` → `@repo/api`.
- **Data**: MongoDB Atlas M0 (single cluster, collection-namespaced per service).
- **Cache / sessions / idempotency**: Upstash Redis.
- **Objects**: Cloudflare R2.
- **Payments**: Razorpay live (UPI, cards, netbanking, wallets) + PO + credit-terms for approved corporate buyers.
- **Email/SMS/WhatsApp**: Resend + MSG91.
- **Analytics + flags**: PostHog Cloud EU via `@repo/analytics-sdk`.
- **Observability**: Sentry + Grafana Cloud + OpenTelemetry.
- **Hosting**: Oracle Cloud Always Free Mumbai (backend) + Vercel (4 Next apps).

## Build, test, run (post-PR-1 scaffold)

| Action | Command | Where |
|--------|---------|-------|
| Install | `pnpm install` | repo root |
| Dev (all apps + gateway) | `pnpm dev` | repo root (Turborepo orchestrates) |
| Build | `pnpm build` | repo root |
| Test (unit) | `pnpm test` | repo root |
| Test (E2E) | `pnpm test:e2e` | repo root (Playwright + axe-core) |
| Lint | `pnpm lint` | repo root |
| Format | `pnpm format` | repo root |
| Type-check | `pnpm typecheck` | repo root |
| OpenAPI snapshot | `pnpm openapi:check` | repo root |
| Kubb regenerate | `pnpm api:generate` | repo root |
| dep-cruiser | `pnpm dep-cruiser` | repo root |

## Key architectural elements

- **`apps/api-gateway`** — single NestJS process; mounts every `services/*` library; Better-Auth handler mounted with body parser disabled and raw-body capture for `/api/payments/webhook`.
- **`services/*`** — sixteen Nest libraries (`auth`, `vendor`, `product`, `inventory`, `customization`, `rfq`, `recipient-list`, `order`, `payment`, `shipping`, `tax`, `promotions`, `notification`, `insights`, `review`, `support`). Cross-service comms: reads via `@repo/api/internal`, writes via `OutboxPort` events.
- **`packages/*`** — see [`.cursor/rules/architecture-layers.mdc`](../.cursor/rules/architecture-layers.mdc) for the L0 → L6 import graph.
- **`apps/web-*`** — `web-customer`, `web-vendor`, `web-admin`, `web-customer-service`. Cookie-domain SSO via Better-Auth across all four subdomains.

## Pre-checkin validation steps

Run these locally before opening a PR (CI runs the same set):

1. `pnpm typecheck` — TypeScript across the workspace.
2. `pnpm lint` — ESLint + Prettier check.
3. `pnpm test` — Jest (backend) + Vitest (frontend).
4. `pnpm test:e2e` — Playwright + `@axe-core/playwright` (WCAG 2.2 AA).
5. `pnpm dep-cruiser` — layer + boundary enforcement.
6. `pnpm openapi:check` — fail on OpenAPI drift between code and snapshot.
7. `gitleaks detect --no-banner` — secret scan.
8. Atlas Search mapping drift check (CI: `.github/workflows/atlas-search-mapping-drift.yml`).
9. Corporate-gifting domain checks (CI: `.github/workflows/corporate-gifting-domain.yml`).

## Path-specific instructions

Detailed per-area rules live in `.github/instructions/<topic>.instructions.md`. Each carries an `applyTo:` glob frontmatter so Copilot loads it only when the matching files are open. Highlights:

- [api-type-safety](instructions/api-type-safety.instructions.md) — Zod-first contracts, no `class-validator`.
- [architecture-layers](instructions/architecture-layers.instructions.md) — upward-only imports.
- [microservice-boundaries](instructions/microservice-boundaries.instructions.md) — cross-service via events / gateway client only.
- [event-driven-discipline](instructions/event-driven-discipline.instructions.md) — versioned events + transactional outbox.
- [corporate-gifting-domain](instructions/corporate-gifting-domain.instructions.md) — auto-router, recipient-list, customization invariants.
- [test-coverage](instructions/test-coverage.instructions.md) — Tier-1 ≥85% lines / ≥80% branches.
- [analytics-instrumentation](instructions/analytics-instrumentation.instructions.md) — PostHog wrapper-only, `[object] [verb]` event names.
- [secrets-and-secrets-handling](instructions/secrets-and-secrets-handling.instructions.md) — `.env*` git-ignored; gitleaks in CI.
- [free-tier-budget](instructions/free-tier-budget.instructions.md) — every cloud choice cites live free quota.
- [commit-conventions](instructions/commit-conventions.instructions.md) — Conventional Commits with Workstream scopes.

Process-only rules ([research-note-per-module](instructions/research-note-per-module.instructions.md), [design-discovery](instructions/design-discovery.instructions.md), [always-latest-docs](instructions/always-latest-docs.instructions.md)) carry `excludeAgent: "code-review"` so they don't noise up code-review surfaces.

## When in doubt

Check the matching `.cursor/rules/*.mdc` (1:1 mirror), the linked research note in `docs/research/`, or the parent plan at `.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md`. The `agentsmd/agents.md` pointer at [`AGENTS.md`](../AGENTS.md) summarizes everything for non-Copilot agents.

**Trust these instructions. Search the codebase only when the information here is incomplete or contradicted by what you find.**
