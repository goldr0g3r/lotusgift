# LotusGift v2 — Architecture Rebuild to Launch (P0 → P22)

The end-to-end delivery board for the **LotusGift** multi-vendor corporate gifting marketplace for the Indian market.

This project tracks every research note, design discovery, and implementation issue from foundation through launch. The codebase lives at [`goldr0g3r/lotusgift`](https://github.com/goldr0g3r/lotusgift).

## Why this project exists

LotusGift v2 is a multi-vendor, multi-warehouse **corporate gifting** marketplace targeting the Indian market. Three deltas vs a generic e-commerce stack:

- **Auto-router** between instant Cart and RFQ (small orders → cart, large/customized → RFQ).
- **Deep customization workflow** (art upload → mockup → approval → audit + in-app thread).
- **Recipient-list drop-shipping** (CSV upload → N shipments to N recipients with per-recipient personalization).

Built as a **modular monolith**: one `apps/api-gateway` Node process hosts every business module as a Nest library under `services/*`. Four Next.js apps under `apps/web-*` each target a user persona (customer / vendor / admin / customer-service).

## Team

Canonical roster + routing rules: [`.github/TEAM.md`](https://github.com/goldr0g3r/lotusgift/blob/main/.github/TEAM.md).

| Handle                                     | Role                     | Default workload                  |
| ------------------------------------------ | ------------------------ | --------------------------------- |
| [@goldr0g3r](https://github.com/goldr0g3r) | Founder / Solo Developer | Assignee + reviewer on everything |

## What we are building

- **Modular monolith** with `OutboxPort` so we can split hot contexts without code changes.
- **NestJS 11 + nestjs-zod 5.3 + Mongoose 8** backend with Better-Auth.
- **Next.js (App Router) + Radix Primitives + CSS Modules + Sass** — no Tailwind.
- **MongoDB Atlas M0** (single cluster, collection-namespaced per service).
- **Oracle Cloud Always Free** (backend) + **Vercel** (4 Next apps).
- **Razorpay** (UPI, cards, netbanking, wallets) + PO + credit-terms.
- **Zod end-to-end** validation. Kubb v3 for client generation.
- **PostHog Cloud EU** analytics + feature flags.
- **Sentry + Grafana Cloud + OpenTelemetry** observability.

## Methodology — gating loops

Every change passes through one of these loops before code lands:

```
1. Research-note loop     -> docs/research/phase-<N>-<topic>.md + paired GitHub issue
                             (label: research-note + phase/P<N>). Closed-as-approved
                             gates the implementation Epic.

2. Design Discovery loop  -> docs/design/<app>-<page-family>.md + paired GitHub issue
                             (label: design-discovery + phase/P<N>).
                             Closed-as-approved with "Direction locked" addendum gates
                             the frontend implementation PR.
```

## Phases

| Phase  | Scope                                                                                | Milestone                                | Target         |
| ------ | ------------------------------------------------------------------------------------ | ---------------------------------------- | -------------- |
| **P0** | Foundation Reset (rules + skills + GitHub templates + bootstrap)                     | `Phase 0 - Foundation Reset`             | 2026-05-14     |
| P1     | L0 Packages (typescript-config, eslint-config, prettier-config, jest-config)         | `Phase 1 - L0 Packages`                  | 2026-05-16     |
| P2     | L1 Contracts (types, validators, events, openapi-spec)                               | `Phase 2 - L1 Contracts`                 | 2026-05-17     |
| P3     | L2 Infra (database, config, utils, observability) + L3 analytics-sdk + feature-flags | `Phase 3 - L2 Infra + Analytics`         | 2026-05-18     |
| P4     | API Gateway shell                                                                    | `Phase 4 - API Gateway`                  | 2026-05-19     |
| P5     | Auth Service (Better-Auth + passkey + 2FA + phone OTP + Google social)               | `Phase 5 - Auth Service`                 | 2026-05-20     |
| P6     | Vendor Service (onboarding + KYC + multi-warehouse + tiers + payouts)                | `Phase 6 - Vendor Service`               | 2026-05-22     |
| P7     | Product Service (taxonomy + R2 uploads + Atlas Search + variants)                    | `Phase 7 - Product Service`              | 2026-05-24     |
| P8     | Inventory + Customization Services                                                   | `Phase 8 - Inventory + Customization`    | 2026-05-26     |
| P9     | Order + RFQ + Recipient-List Services (auto-router)                                  | `Phase 9 - Order + RFQ + Recipient-List` | 2026-05-30     |
| P10    | Payment Service (Razorpay + webhooks + idempotency)                                  | `Phase 10 - Payment Service`             | 2026-06-02     |
| P11    | Shipping Service (multi-carrier + tracking + recipient-list fulfillment)             | `Phase 11 - Shipping Service`            | 2026-06-05     |
| P12    | Notification Service (email + SMS + WhatsApp via Resend + MSG91)                     | `Phase 12 - Notification Service`        | 2026-06-08     |
| P13    | Tax Service (GST + HSN/SAC + compliance)                                             | `Phase 13 - Tax Service`                 | 2026-06-10     |
| P14    | Promotions Service (coupons + bulk discounts + corporate pricing)                    | `Phase 14 - Promotions Service`          | 2026-06-13     |
| P15    | Insights Service (reporting + analytics + dashboards)                                | `Phase 15 - Insights Service`            | 2026-06-16     |
| P16    | Web Customer App (Next.js App Router + SSR + catalog + cart + checkout)              | `Phase 16 - Web Customer App`            | 2026-06-30     |
| P17    | Web Vendor App (dashboard + products + orders + payouts)                             | `Phase 17 - Web Vendor App`              | 2026-07-14     |
| P18    | Web Admin App (platform admin + analytics + moderation)                              | `Phase 18 - Web Admin App`               | 2026-07-28     |
| P19    | Web Customer Service App (tickets + chat + escalation)                               | `Phase 19 - Web Customer Service App`    | 2026-08-11     |
| P20    | Review + Support Services                                                            | `Phase 20 - Review + Support Services`   | 2026-08-18     |
| P21    | Observability Hardening (Sentry + Grafana + OTEL + alerts)                           | `Phase 21 - Observability Hardening`     | 2026-08-25     |
| P22    | Launch (production deploy + monitoring + soft-launch)                                | `Phase 22 - Launch`                      | **2026-09-01** |

## How to use this board

- **Board by Phase** — kanban grouped by `Phase` field; drag cards across phases as they progress.
- **Roadmap** — timeline using `Start Date` → `Target Date`; useful for stakeholder reviews.
- **By Status** — table grouped by `Status` field (Backlog / Todo / Ready / In Progress / In Review / Blocked / Done).
- **Research Notes** — table filtered to `Type = Research Note`; tracks the research stubs awaiting approval.
- **Design Discovery** — table filtered to `Type = Design Discovery`; tracks frontend wireframe directions per page family.
- **By Workstream** — table grouped by `Workstream` field for cross-cutting concern tracking.

## Field reference

| Field                | Type                                                                                                                | Purpose                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **Status**           | Single select (Backlog / Todo / Ready / In Progress / In Review / Blocked / Done)                                   | Workflow column                                      |
| **Phase**            | Single select (P0..P22)                                                                                             | Maps to milestone; canonical phase index             |
| **Type**             | Single select (Research Note / Design Discovery / Bug / Feature / Refactor / Docs / Test / Chore / Security / Epic) | Mirrors the `type/*` label set                       |
| **Workstream**       | Single select (scaffold / rules / architecture / ci / infra / design / ...)                                         | Maps to Conventional Commits scopes                  |
| **Priority**         | Single select (P0-critical / P1-high / P2-medium / P3-low)                                                          | Triage signal                                        |
| **Estimate (hours)** | Number                                                                                                              | Engineering estimate for capacity planning           |
| **Start Date**       | Date                                                                                                                | When work starts (phase open)                        |
| **Target Date**      | Date                                                                                                                | When work must land (phase close = milestone due_on) |
| **Sprint**           | Iteration (2-week)                                                                                                  | Sprint assignment                                    |

## Status update cadence

A weekly status update is posted every Monday:

- **Status**: ON_TRACK / AT_RISK / OFF_TRACK / COMPLETE / INACTIVE.
- **Body**: bullet summary of last week's deliverables, this week's plan, blockers.
- **Start / target dates**: aligned to the active phase milestone.

## Links

- Repo: [`goldr0g3r/lotusgift`](https://github.com/goldr0g3r/lotusgift)
- Team: [`.github/TEAM.md`](https://github.com/goldr0g3r/lotusgift/blob/main/.github/TEAM.md)
- Architecture: [`docs/architecture/`](https://github.com/goldr0g3r/lotusgift/tree/main/docs/architecture)
- Cursor rules: [`.cursor/rules/`](https://github.com/goldr0g3r/lotusgift/tree/main/.cursor/rules)
- Research notes: [`docs/research/`](https://github.com/goldr0g3r/lotusgift/tree/main/docs/research)
- Parent plan: [`.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md`](https://github.com/goldr0g3r/lotusgift/blob/main/.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md)
