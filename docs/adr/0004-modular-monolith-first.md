# Modular-monolith-first deployment, transport-agnostic Outbox

- **Status:** accepted
- **Date:** 2026-05-12
- **Decision-makers:** @goldr0g3r
- **Consulted:** parent-plan authors (nursery-plan adaptation), `deployment-mode.mdc` rule authors
- **Informed:** every service author, the CI workflow author (PR-4)

## Context and Problem Statement

LotusGift v2 has 16 logical services (auth, vendor, product, inventory, customization, rfq, recipient-list, order, payment, shipping, tax, promotions, notification, insights, review, support). Building them as 16 independently deployed processes from day 1 would be operationally infeasible for a team of one on the free tier ([ADR-005](0005-hosting-oracle-mumbai-plus-vercel.md)). At the same time, designing each service as a tangled in-process module would make extraction expensive when GMV or team size eventually forces some of them out. This ADR codifies the modular-monolith-first posture: every service is built as a logically isolated module with a transport-agnostic event bus, hosted in a single NestJS gateway process, ready to be split out without code rewrites when needed.

## Decision Drivers

- **Operational budget = one founder**, no SRE rotation, no dedicated DevOps. 16 deploy targets, 16 nginx upstreams, and 16 sets of dashboards are not viable.
- The free-tier hosting target (Oracle A1.Flex 4 OCPU / 24 GB RAM ARM Mumbai — see ADR-005) can comfortably run one NestJS process with all 16 service modules co-located.
- Splitting a microservice out later **must not require rewriting the consumer or producer** — the event bus has to be transport-agnostic from day 1.
- The `deployment-mode.mdc` rule already mandates modular-monolith-first with `OutboxPort` as the canonical event-bus abstraction.
- Service boundaries (ownership of data, allowed cross-service calls, dependency direction) must be enforceable at lint time, not just by code review.

## Considered Options

- **Modular monolith: one NestJS `apps/api-gateway` process mounting all 16 service libraries, communicating via in-process `EventEmitter`-backed `OutboxPort`.** [chosen]
- Microservices from day 1: each service as its own NestJS process + NATS / RabbitMQ message broker.
- Single-service NestJS app with no module boundaries.
- Serverless functions per service (Vercel Functions or AWS Lambda).

## Decision Outcome

Chosen option: **"Modular monolith with transport-agnostic OutboxPort"**, because it ships at single-process operational cost while preserving the option to extract any service into its own deployment without consumer rewrites.

Concrete pattern:

- **`apps/api-gateway`** is the only deployed Nest process. It imports each of the 16 `services/*` libraries' `*ServiceModule` and mounts them under `/api/<resource>`.
- **Service libraries** (`services/auth-service`, `services/order-service`, etc.) are pnpm workspace packages exporting a single `<Service>Module` plus their public Zod-derived DTOs.
- **`OutboxPort`** (in `@repo/utils`) is a transport-agnostic interface — `publish(eventName, payload)` — that wraps an emitter. The MVP implementation is in-process `EventEmitter2`; the future implementation behind the same interface is NATS / Kafka / Mongo-changestream-driven outbox-pattern publishing.
- **Cross-service calls are forbidden via lint** — `architecture-layers.mdc` and `microservice-boundaries.mdc` rules (already shipped in PR-2) make `import * from '@lotusgift/<other-service>/internals'` a build failure. Services either publish events (via OutboxPort) or expose a public REST endpoint that the other service hits via its own service-account auth.
- **Split triggers** documented in `scaling-up.md` runbook (PR-8): per-service split fires when (GMV exceeds threshold X) AND (a single service's CPU share exceeds 40 % of the gateway process) OR (team size grows past N engineers, forcing per-service ownership).
- **No service-to-service synchronous HTTP** at MVP — every cross-service flow is either (a) directly mounted in the same gateway and called as an injected provider through the module's public API, or (b) eventually-consistent via OutboxPort.

### Consequences

- Good, because one process to deploy, one set of logs/traces/metrics to wire, one CI deploy step. The Oracle VM idle-reclaim heartbeat (ADR-005) keeps it warm without needing N processes.
- Good, because each service module owns its Mongoose collections (`auth.users`, `vendor.organizations`, `product.products` — collection-namespacing per `database.mdc` rule) → splitting it out later means changing the connection string for one namespace, not migrating data.
- Good, because OutboxPort's transport-agnostic contract means a future split (e.g., `notification-service` moves to its own container) is purely an infra change — every producer keeps calling `outbox.publish('order.placed', payload)` exactly the same way.
- Bad, because in-process communication makes it easy to accidentally couple services synchronously. Mitigation: lint rules + code-review subagent (`code-reviewer.md`).
- Bad, because a memory leak in any service module brings down the whole gateway. Mitigation: graceful-restart + Sentry alerting; the operational risk is acceptable for a single-founder MVP.
- Neutral, because some operational telemetry (per-service CPU share, per-service memory) requires logger context propagation rather than per-process metrics. Implemented in P3 via `@repo/observability` and `@repo/utils/logger.

### Confirmation

- `apps/api-gateway` boot test: `pnpm --filter @lotusgift/api-gateway start` boots all 16 service modules and `/api/openapi.json` returns 200 with endpoints from every service tagged with the service name.
- `.github/workflows/dep-cruiser.yml` (PR-4) enforces:
  - Service libraries may import `@repo/*` packages.
  - Service libraries may NOT import `@lotusgift/<other-service>`.
  - `apps/api-gateway` may import any `@lotusgift/<service>` library (it's the only one allowed to compose them).
- `@repo/utils` exports an `OutboxPort` interface + an `InProcessOutbox` implementation; replaceable via DI without changing producers/consumers. Smoke test confirms a swap to a `NoopOutbox` doesn't break service boot.
- `dep-cruiser` graph published to `docs/architecture/dep-graph.svg` (hand-authored in this PR, automated in PR-4 once code lands).

## Pros and Cons of the Options

### Modular monolith with transport-agnostic OutboxPort [chosen]

- Good, because single deploy target, single log stream, single metric set.
- Good, because the OutboxPort contract is the only abstraction that needs preserving when a service is later extracted.
- Good, because Mongoose collection-namespacing makes data extraction equally cheap.
- Bad, because no per-service fault isolation (a leaking service takes down everything until restart).
- Bad, because no per-service language/runtime polyglot (everyone is Node + NestJS forever — but that's deliberate at MVP scale).

### Microservices from day 1

- Good, because per-service fault isolation, independent deploy cadence, true team ownership.
- Bad, because **16 processes × N replicas** doesn't fit on the Oracle A1.Flex free tier (4 OCPU / 24 GB shared across all processes).
- Bad, because requires NATS / RabbitMQ / Kafka cluster which has no free tier comparable to Atlas M0 + Oracle.
- Bad, because for a team of one, the marginal value of independent deploys is negative (you're never doing concurrent service work).

### Single-service Nest app with no module boundaries

- Good, because zero-ceremony.
- Bad, because **proven failure mode** — `_old/apps/api/src/` had 13 modules with no enforced boundaries; cross-service imports, shared DTOs, and shared schemas accumulated and made the rewrite necessary in the first place.
- Bad, because no path to a clean split when scale eventually forces it.

### Serverless functions per service

- Good, because effectively zero idle cost; auto-scaling for free.
- Bad, because cold-start latency on free-tier serverless (Vercel Hobby: function duration 10 s default, 60 s configurable; cold start 1-3 s per service) is unacceptable for B2B checkout flows.
- Bad, because Better-Auth's session-validation pattern requires persistent connections + raw-body capture for webhooks — both clumsy on serverless.
- Bad, because no single-instance state for in-process Redis-backed rate limiting / idempotency caches that the modular monolith uses freely.

## More Information

- Parent plan: [`.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md`](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md), section 3 (target architecture diagram with OutboxPort), section 4 (modular-monolith-first), section 9 (free-tier strategy → single Node process on Oracle A1.Flex).
- Rules:
  - [`.cursor/rules/deployment-mode.mdc`](../../.cursor/rules/deployment-mode.mdc) — modular-monolith-first directive.
  - [`.cursor/rules/architecture-layers.mdc`](../../.cursor/rules/architecture-layers.mdc) — allowed import directions.
  - [`.cursor/rules/microservice-boundaries.mdc`](../../.cursor/rules/microservice-boundaries.mdc) — service-to-service rules.
  - [`.cursor/rules/event-driven-discipline.mdc`](../../.cursor/rules/event-driven-discipline.mdc) — OutboxPort usage rules.
- Related ADRs:
  - [ADR-002](0002-rest-over-trpc-with-nestjs-zod-and-kubb.md) — the REST surface of the modular monolith.
  - [ADR-005](0005-hosting-oracle-mumbai-plus-vercel.md) — single-process Oracle deployment that this architecture targets.
  - [ADR-006](0006-atlas-search-m0-budget-3-indexes.md) — one Mongo cluster shared across collection-namespaced services.
