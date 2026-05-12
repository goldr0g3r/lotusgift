# LotusGift v2

Multi-vendor multi-warehouse corporate-gifting marketplace for India. Built as a Turborepo monorepo with a NestJS modular monolith (`apps/api-gateway` mounting 16 service libraries) and 4 Next.js apps (customer, vendor, admin, customer-service) — all deployed to Oracle Cloud + Vercel.

**Status: PR-1 scaffold (pre-launch, greenfield).** This commit lands the empty-skeleton workspace via CLI tooling (`create-turbo`, `create-next-app`, `scripts/scaffold-package.ts`). Implementation arrives across PR-2 through PR-22 per the [parent architecture plan](.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md) and tracked on the [GitHub Projects v2 board](https://github.com/users/goldr0g3r/projects/9).

## Workspace layout

```text
lotusgift/
├── _old/                         # archived previous codebase (single-vendor RFQ site); reference only
├── apps/
│   ├── api-gateway/              # NestJS modular monolith host (port 3001)
│   ├── web-customer/             # Next.js retail + corporate buyer surface (port 3000)
│   ├── web-vendor/               # Next.js vendor portal (port 3002)
│   ├── web-admin/                # Next.js internal admin (port 3003)
│   └── web-customer-service/     # Next.js customer-service console (port 3004)
├── services/                     # 16 NestJS service libraries (pnpm workspace packages, prefix `@lotusgift/*`)
│   ├── auth-service/             # Better-Auth + organization plugin (vendor-org / corporate-buyer-org / internal-staff-org)
│   ├── vendor-service/           # onboarding + multi-warehouse registry + SLA scoring
│   ├── product-service/          # catalog + corporate-gifting taxonomy + Atlas Search sync
│   ├── inventory-service/        # per-(variant, warehouse) stock + Redis reservations
│   ├── customization-service/    # versioned art uploads + mockup approval + in-app thread
│   ├── rfq-service/              # quote workflow + auto-router (cart vs RFQ)
│   ├── recipient-list-service/   # CSV recipient upload + per-recipient personalization
│   ├── order-service/            # multi-recipient orders + saga orchestrator
│   ├── payment-service/          # Razorpay + PO + credit terms
│   ├── shipping-service/         # Shiprocket + Delhivery + Bluedart adapters
│   ├── tax-service/              # GST per-shipment + IRP e-invoice
│   ├── promotions-service/       # vendor tiers + volume discounts + auto-replenish
│   ├── notification-service/     # Resend + MSG91 + WhatsApp + in-app
│   ├── insights-service/         # vendor AI forecasting
│   ├── review-service/           # reviews + sentiment
│   └── support-service/          # tickets + RMA
├── packages/                     # 18 shared workspace packages (prefix `@repo/*`)
│   ├── api/                      # Kubb-generated TanStack Query hooks (P4)
│   ├── analytics-sdk/            # PostHog wrapper
│   ├── auth-client/              # Better-Auth client
│   ├── config/                   # env Zod schema
│   ├── database/                 # Mongoose helper
│   ├── design-tokens/            # TS source-of-truth, emits typed TS + SCSS
│   ├── eslint-config/            # shared ESLint flat configs
│   ├── events/                   # transport-agnostic event schemas
│   ├── feature-flags/            # PostHog flags
│   ├── jest-config/              # shared Jest configs
│   ├── observability/            # OTEL + RUM SDK init
│   ├── openapi-spec/             # shared OpenAPI x-* extensions
│   ├── prettier-config/          # shared Prettier config
│   ├── types/                    # shared TS types
│   ├── typescript-config/        # shared tsconfig bases
│   ├── ui/                       # Radix + CSS Modules + Sass + Lucide (PR-6)
│   ├── utils/                    # OutboxPort + redactor + ulid + pino + retry
│   └── validators/               # Zod schemas (source of truth)
├── scripts/
│   └── scaffold-package.ts       # tsx CLI: `pnpm dlx tsx scripts/scaffold-package.ts <package|service> <name>`
├── docs/
│   └── research/                 # phase-N-topic research notes with retrieval-dated citations
└── .cursor/plans/                # multi-PR plans for the rebuild
```

## Getting started

Requires: Node 20+, pnpm 9+, gh CLI (for PR creation), Git.

```powershell
# 1. Clone + cd
git clone https://github.com/goldr0g3r/lotusgift.git
cd lotusgift

# 2. Install all workspace deps
pnpm install

# 3. Build everything
pnpm build

# 4. Lint
pnpm lint

# 5. Run dev (all apps in parallel via turbo)
pnpm dev
```

Ports during dev: api-gateway `:3001`, web-customer `:3000`, web-vendor `:3002`, web-admin `:3003`, web-customer-service `:3004`.

## Architecture references

- [Parent architecture plan](.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md) — full rebuild scope, phased PR roadmap (P0 through P22).
- [P0-scaffold sub-plan](.cursor/plans/p0-scaffold_sub-plan_pr-1_d9158dc4.plan.md) — this PR's detailed steps.
- [P0-scaffold research note](docs/research/phase-0-scaffold.md) — retrieval-dated citations + version captures.
- [GitHub Projects v2 board](https://github.com/users/goldr0g3r/projects/9) — phase tracker with custom fields (Phase / Workstream / Layer / Type).
- [`_old/`](_old/) — archived previous codebase, kept under source control as a design/feature reference. Excluded from the live pnpm workspace and from ESLint.

## CLI-driven scaffold

This project is generated entirely via official CLIs — no hand-rolled `package.json` or `tsconfig`:

- `pnpm dlx create-turbo@latest -e with-nestjs` for the base monorepo (apps/api-gateway + apps/web-customer + shared packages).
- `pnpm dlx create-next-app@latest` for the 3 additional Next.js apps.
- `pnpm dlx tsx scripts/scaffold-package.ts <package|service> <name>` for the 16 services + 13 new packages.

## License

UNLICENSED (private).
