# Research notes

**Audience**: every contributor + coding agents
**Phase**: P0 onward
**Last reviewed**: 2026-05-18
**Owner**: @goldr0g3r

Per-phase research notes with retrieval-dated citations. Each note is a **prerequisite** for the phase's code — not a deliverable to backfill.

## Binding rules

- [`.cursor/rules/research-note-per-module.mdc`](../../.cursor/rules/research-note-per-module.mdc) — required sections, timing
- [`.cursor/rules/always-latest-docs.mdc`](../../.cursor/rules/always-latest-docs.mdc) — citations must be ≤14 days old

## Catalogue

### Phase 0 — Foundation Reset (complete)

| Note | Topic |
| ---- | ----- |
| [`phase-0-scaffold.md`](./phase-0-scaffold.md) | Workspace bootstrap (Turborepo, pnpm, NestJS, Next.js) |
| [`phase-0-rules.md`](./phase-0-rules.md) | Cursor rules, Copilot instructions, AGENTS.md |
| [`phase-0-ci.md`](./phase-0-ci.md) | CI workflows, labels, milestones, project board |
| [`phase-0-design.md`](./phase-0-design.md) | Design system foundations |
| [`phase-0-docs.md`](./phase-0-docs.md) | Documentation structure |
| [`phase-0-dev-stack.md`](./phase-0-dev-stack.md) | Dev stack decisions |
| [`phase-0-oracle-runbook.md`](./phase-0-oracle-runbook.md) | Oracle VM provisioning research |
| [`phase-0-mid-push.md`](./phase-0-mid-push.md) | Mid-push status notes |
| [`phase-0-future-docs.md`](./phase-0-future-docs.md) | Future documentation planning |

### Phase 1 — Shared Configs (complete)

| Note | Topic |
| ---- | ----- |
| [`phase-1-shared-configs.md`](./phase-1-shared-configs.md) | ESLint, Prettier, TypeScript, Jest shared configs |

### Phase 2 — L1 Packages (complete)

| Note | Topic |
| ---- | ----- |
| [`phase-2-l1-packages.md`](./phase-2-l1-packages.md) | types, validators, events, openapi-spec |

### Phase 3 — L2 Packages (complete)

| Note | Topic |
| ---- | ----- |
| [`phase-3-l2-packages.md`](./phase-3-l2-packages.md) | database, config, utils, observability |
| [`phase-3b-analytics-flags.md`](./phase-3b-analytics-flags.md) | analytics-sdk, feature-flags |

### Phase 4 — API Gateway (complete)

| Note | Topic |
| ---- | ----- |
| [`phase-4-api-gateway.md`](./phase-4-api-gateway.md) | NestJS gateway shell, OpenAPI, health checks |

### Phase 5 — Auth Service (complete)

| Note | Topic |
| ---- | ----- |
| [`phase-5-auth-service.md`](./phase-5-auth-service.md) | Better-Auth, Organization plugin, passkey, 2FA |
| [`phase-5b-auth-runtime.md`](./phase-5b-auth-runtime.md) | Auth runtime integration |

### Phase 6 — Vendor Service (complete)

| Note | Topic |
| ---- | ----- |
| [`phase-6-vendor-service.md`](./phase-6-vendor-service.md) | Vendor onboarding, KYC, tier management |

### Phase 7 — Product Service (complete)

| Note | Topic |
| ---- | ----- |
| [`phase-7-product-service.md`](./phase-7-product-service.md) | Product catalog, Atlas Search, variants |

### Phase 8 — Inventory Service (complete)

| Note | Topic |
| ---- | ----- |
| [`phase-8-inventory-service.md`](./phase-8-inventory-service.md) | Stock ledger, Redis reservations, warehouse routing |

### Phase 9+ (pending)

Research notes for P9–P22 will be created as each phase opens.

## Required sections (template)

Every research note must contain:

1. **Goal** — one paragraph
2. **Retrieval-dated citations** — table with page title + URL + date
3. **Decisions log** — chose / rejected with reasoning
4. **Open questions** — parked decisions
5. **Implementation checklist** — file-by-file deliverables
6. **Versions** — `pnpm ls --depth=0` output

## See also

- [`../how-to/open-a-research-note.md`](../how-to/open-a-research-note.md)
- [`.cursor/rules/research-note-per-module.mdc`](../../.cursor/rules/research-note-per-module.mdc)
- [`.cursor/rules/always-latest-docs.mdc`](../../.cursor/rules/always-latest-docs.mdc)
