# Getting started

**Audience**: new contributors (humans + coding agents)
**Phase**: P0 onward
**Last reviewed**: 2026-05-18
**Owner**: @goldr0g3r

Welcome. This section turns a fresh clone into a running local dev environment in roughly 15 minutes. Follow the docs in order the first time; revisit individually after that.

## Reading order

1. [`prerequisites.md`](./prerequisites.md) — Install Node 20+, pnpm 9, Docker Desktop (optional), the GitHub CLI, and Cursor / VS Code.
2. [`local-dev-setup.md`](./local-dev-setup.md) — `git clone` → `pnpm install` → `pnpm dev` walkthrough.
3. [`docker-compose-services.md`](./docker-compose-services.md) — Reference for the local Docker stack (MongoDB, Redis). Optional — host-install also works.
4. [`ide-setup.md`](./ide-setup.md) — Cursor + VS Code settings, recommended extensions, using Cursor agents and skills.
5. [`first-contribution.md`](./first-contribution.md) — Walk through a docs-only PR end-to-end using Conventional Commits + labels.
6. [`troubleshooting.md`](./troubleshooting.md) — Common Windows, pnpm, Docker, and Node issues with fixes.

## What's running locally vs in production

| Concern        | Local dev                                                  | Production (per [`ADR-0005`](../adr/0005-hosting-oracle-mumbai-plus-vercel.md))             |
| -------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Compute        | `pnpm dev` on host machine                                 | Oracle Always Free A1.Flex 4 OCPU + 24 GB ARM (Mumbai)                                     |
| Database       | Host-install Mongo 8 on `localhost:27017` OR Docker        | MongoDB Atlas M0 (single cluster, Mumbai region)                                            |
| Cache          | Host-install Redis on `localhost:6379` OR Docker           | Upstash Redis (10k cmds/day free tier)                                                      |
| Object storage | Local filesystem (dev fallback)                            | Cloudflare R2 (free egress)                                                                 |
| Payments       | Razorpay Test Mode                                         | Razorpay Live (UPI, cards, netbanking, wallets) + PO + credit-terms                         |
| Email/SMS      | Console log (dev)                                          | Resend (email) + MSG91 (SMS/WhatsApp)                                                       |
| Observability  | Console logs                                               | Grafana Cloud + Sentry + OpenTelemetry                                                      |
| Analytics      | PostHog dev mode (no events sent)                          | PostHog Cloud EU (1M events/mo free)                                                        |
| Auth           | Better Auth on `localhost:3001`                             | Better Auth on production domain with passkey + email OTP                                   |
| Frontend       | Next.js dev server × 4 (`localhost:3000/3002/3003/3004`)   | Vercel Hobby (4 Next.js apps on subdomains)                                                 |

## What "post-P8" means for the local experience

Phases P0–P8 are complete. The repo has:

- 15 cursor rules + 1 cursor skill + 5 subagents
- GitHub templates + workflows + labels + milestones + project board
- `apps/api-gateway` (NestJS) + 4 Next.js apps (web-customer, web-vendor, web-admin, web-customer-service)
- 16 service libraries under `services/*`
- 18 shared packages under `packages/*`
- `services/auth-service` (Better-Auth with Organization plugin, passkey, 2FA)
- `services/vendor-service` (onboarding, KYC, tier management)
- `services/product-service` (catalog, Atlas Search, variants)
- `services/inventory-service` (stock ledger, Redis reservations, warehouse routing)

`pnpm dev` starts the api-gateway + all 4 frontend apps via Turborepo.

## See also

- [`../README.md`](../README.md) — docs entry point.
- [`../../README.md`](../../README.md) — repo overview.
- [`../../AGENTS.md`](../../AGENTS.md) — coding-agent rules of engagement.
- [`../how-to/README.md`](../how-to/README.md) — task recipes for once you're set up.
- [`../deployment/README.md`](../deployment/README.md) — when local works and you need to ship.
