# Phase-3 L2 platform packages research note

**Date:** 2026-05-14
**Phase:** 3
**Workstream:** infra (shared L2 platform)
**Layer:** L2 (consumed by every L3+ package, every service, every app at bootstrap)
**Sub-plan:** [`.cursor/plans/p3_l2_platform_packages_pr-11_6726a624.plan.md`](../../.cursor/plans/p3_l2_platform_packages_pr-11_6726a624.plan.md)
**Parent plan:** [`.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md`](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md)

PR-11 populates the 4 L2 platform packages — `@repo/database`, `@repo/config`, `@repo/utils`, `@repo/observability`. They frame every later phase's runtime: Mongoose connection + namespacing, Zod env schema, OutboxPort relayer, structured logger, retry helper, OTEL bootstrap. Service-specific Mongoose schemas land per-service in P5+ (consumed via `createMongoConnection` + `namespace()`); the gateway shell at P4 wires the Nest DI bindings around these primitives.

## 1. Sources reviewed (retrieval-dated 2026-05-14)

| # | Topic | URL | Notes |
| --- | --- | --- | --- |
| 1 | Mongoose 8 transactions API | <https://mongoosejs.com/docs/8.x/docs/transactions.html> | `session.withTransaction(async () => { ... })` auto-handles commit, abort, AND retry on `TransientTransactionError` + `UnknownTransactionCommitResult`. Every operation inside must receive `{ session }` or it runs OUTSIDE the transaction. Mongoose 8.23.x is current 8.x line. |
| 2 | Transactional outbox pattern (Chris Richardson, re-cited from P2) | <https://microservices.io/patterns/data/transactional-outbox.html> | Domain row + outbox row written in same transaction → relayer polls + publishes → marks `published`. At-least-once delivery + dedup on `idempotencyKey` downstream. |
| 3 | MongoDB outbox pattern recipe | <https://oneuptime.com/blog/post/2026-03-31-mongodb-outbox-pattern-reliable-events/view> | Concrete implementation guide: write domain doc + outbox doc inside `withTransaction`, relayer polls + marks processed. Change streams as a real-time alternative — parked for P21 (scale optimization). |
| 4 | `@opentelemetry/sdk-node` reference | <https://open-telemetry.github.io/opentelemetry-js/modules/_opentelemetry_sdk-node.html> | `NodeSDK` constructor: `traceExporter`, `metricReader`, `logRecordProcessor`, `instrumentations`, `resource`. `start()` + `shutdown()` lifecycle. Production: 0.218.x as of 2026-05. |
| 5 | `@opentelemetry/auto-instrumentations-node` | <https://www.npmjs.com/package/@opentelemetry/auto-instrumentations-node> | `getNodeAutoInstrumentations({ '@opentelemetry/instrumentation-http': { enabled: true }, ... })` to selectively enable per-library instrumentations. Current 0.76.x. |
| 6 | OTEL ZeroCode env-var control | <https://opentelemetry.io/docs/zero-code/js/configuration> | `OTEL_NODE_ENABLED_INSTRUMENTATIONS` allow-list controls selective enablement at process start. We pick `http`, `mongoose`, `pino` for the MVP and document the rest as opt-in via env var. |
| 7 | `@opentelemetry/instrumentation-pino` issue 3292 | <https://github.com/open-telemetry/opentelemetry-js-contrib/issues/3292> | KNOWN BUG: pino logs don't reach the OTLP collector even when the instrumentation is enabled. Workaround: keep pino stdout output (captured by systemd journal on Oracle VM, shipped to Loki via Grafana Agent in P21). Don't depend on OTLP logs in P3. |
| 8 | pino 9 redaction docs | <https://github.com/pinojs/pino/blob/HEAD/docs/redaction.md> | `redact: { paths: [...], censor: '[REDACTED]' }`. Wildcards (`*.secret`, `users[*].password`) carry ~50 % overhead; explicit paths preferred. Paths must NOT come from user input (allow-listed only). |
| 9 | pino 9 + pino-pretty | <https://signoz.io/guides/pino-logger> | `pino-pretty` for dev human-readable output; raw JSON for prod. Mixin function injects per-log metadata (trace-id, service tag). Current 9.x is the active major. |
| 10 | ulidx | <https://www.npmjs.com/package/ulidx> | Crockford base32 26-char ULID generator. `ulid()` → string; `decodeTime(ulid)` → ms timestamp. Pairs with `@repo/types.UlidString` brand from P2. |
| 11 | Grafana Cloud OTLP endpoint | <https://grafana.com/docs/grafana-cloud/send-data/otlp/send-data-otlp> | Free tier accepts traces + metrics + logs over OTLP HTTP at `https://otlp-gateway-<zone>.grafana.net/otlp`. Auth via `Authorization: Basic <base64>` header. Direct OTLP — no Collector required for MVP. |
| 12 | Grafana Cloud Node.js setup | <https://grafana.com/docs/opentelemetry/instrument/node> | Standard env-var config: `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_RESOURCE_ATTRIBUTES=service.name=...,deployment.environment=...`. We expose these via `@repo/config.EnvSchema` for type-safe access. |
| 13 | Better-Auth Mongo adapter (forward ref) | <https://www.npmjs.com/package/@better-auth/mongo-adapter> | Connection comes from `@repo/database.createMongoConnection`; the Better-Auth Mongo adapter is wired at P5 (services/auth-service). Cited here so the P5 PR can pin its version against this connection contract. |
| 14 | Deployment-mode rule (collection namespacing) | [`.cursor/rules/deployment-mode.mdc`](../../.cursor/rules/deployment-mode.mdc) | `<service>.<entity>` collection naming. `namespace('order', 'orders')` → `'order.orders'`. Asserts the `<service>` is in the P2 16-service allow-list. |
| 15 | Secrets-handling rule | [`.cursor/rules/secrets-and-secrets-handling.mdc`](../../.cursor/rules/secrets-and-secrets-handling.mdc) | `EnvSchema` is the single source of truth for env-var names. Values live in GitHub Environments → Vercel → Oracle systemd `EnvironmentFile=`. `.env*` git-ignored; only `.env.example` committed. |

## 2. Decisions log

| # | Decision | Choice | Rejected | Reasoning |
| --- | --- | --- | --- | --- |
| D1 | Scope split | Single PR-11 covering all 4 L2 packages | Split into 2 / 3 PRs | Matches PR-9 + PR-10 cadence. 4 packages are tightly coupled (utils.OutboxPort writes via database; observability.otel pulls pino from utils; config consumed by all three at bootstrap). |
| D2 | OutboxPort placement | Full MVP at L2 — interface + `MongoOutboxRepository` + `InProcessOutboxPort` relayer with EventEmitter + LRU idempotency dedup | Interface + Mongo schema only (defer relayer to P4) | Framework-agnostic implementation is L2 by definition. Runs in Node worker, Nest app, or Lambda. The Nest DI binding + `OnApplicationShutdown` hook is the L4 concern; that lives in api-gateway (P4). |
| D3 | Observability scope | OTEL only (traces + metrics) | OTEL + Sentry; OTEL + Sentry + browser RUM | Sentry naturally lands in P21 (observability hardening) where it sits alongside Grafana dashboards + Loki queries. P3 ships only the bootstrap; P4 wires it into the gateway lifecycle. Avoids overloading this PR. PostHog stays in P3b per the rule glob (`packages/analytics-sdk`). |
| D4 | OTEL logs pipeline | NOT via `@opentelemetry/instrumentation-pino` | Enable pino instrumentation now | Known bug (source #7 — issue 3292) where logs never reach the OTLP collector. Workaround: pino writes to stdout, captured by Oracle systemd journal, shipped to Loki via Grafana Agent in P21. One log shipping path is simpler than two. |
| D5 | OTEL auto-instrumentations selection | `http` + `mongoose` (selective) | Full `auto-instrumentations-node` mega-package (~50 instrumentations, ~25 MB extra) | Cold-start savings + smaller bundle. Other instrumentations are opt-in via `OTEL_NODE_ENABLED_INSTRUMENTATIONS` env var per source #6. |
| D6 | Database adapter style | Raw Mongoose 8 | `@nestjs/mongoose` | `@nestjs/mongoose` is L4+ (depends on NestJS). Per [`.cursor/rules/architecture-layers.mdc`](../../.cursor/rules/architecture-layers.mdc) L2 imports L0-L1 only. The Nest module wrapper lives in `apps/api-gateway` (P4). |
| D7 | Transaction helper API | `withTransaction(connection, async (session) => { ... })` thin wrapper | Direct `session.withTransaction()` calls | Wrapper centralises telemetry (span emission via OTEL) + the retry-on-`TransientTransactionError` policy. Service code stays clean. |
| D8 | Collection namespacing | `namespace('<service>', '<entity>')` → `'<service>.<entity>'` with allow-list check | Free-form strings | Per [`.cursor/rules/deployment-mode.mdc`](../../.cursor/rules/deployment-mode.mdc). Allow-list against P2's 16-service list catches typos at the namespace boundary. |
| D9 | Env schema replacement | Port `_old/apps/api/src/app.module.ts` Joi → Zod, extend with P3-required keys | Keep Joi for the gateway | Joi is class-validator era; Zod aligns with the whole P2 contract surface. Single validator library workspace-wide. |
| D10 | Env prod-required vs dev-default | Conditional via `superRefine` per env (production requires `MONGODB_URI`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`; development falls back to `localhost` defaults) | Hard-fail on every missing var | Matches the Joi `.when('NODE_ENV', { is: 'production', then: required, otherwise: default })` pattern. Keeps `pnpm dev` startable without secrets. |
| D11 | INR redaction policy | Redact `body.gstin`, `body.pan`, `body.phone`, `body.email`, `body.aadhaar`, `req.headers.authorization`, `req.headers.cookie`, `*.password`, `*.token`, `*.secret` by default | No defaults; rely on per-service config | Sane defaults protect against the most common PII leaks. Per-service override via `LOG_REDACT_PATHS` env var. |
| D12 | OutboxPort poller cadence | 250 ms with `OUTBOX_POLL_INTERVAL_MS` env override | 1 s (cheaper) | Matches Stripe/Shopify relayer norms. Tail latency at 1 s is too high for "near-real-time" event consumers (notification-service). Cost: ~4 idle reads/sec — trivial against Atlas M0 budget. |
| D13 | Idempotency-key LRU size | 10k keys/process via in-memory `lru-cache` (devDep on utils) | 100k (memory cost) | 10k × ~100 bytes = ~1 MB. Covers ~6 minutes at 25 events/sec peak. Beyond that the dedup falls back to the outbox row's `idempotencyKey` index check before re-emit. |
| D14 | Retry helper signature | `retry(fn, { attempts, baseDelayMs, maxDelayMs, signal })` with full jitter | Bounded fixed-interval retry | Full jitter (`Math.random() * Math.min(maxDelay, baseDelay * 2^attempt)`) reduces thundering-herd risk. `AbortSignal` interop matches `fetch()` + Mongoose 8 cancellation. |
| D15 | L2 packages `"type": "module"` | Drop it (matches PR-10 L1 packages) | Keep ESM-only | Same ts-jest CJS compatibility rationale as PR-10 (see [`docs/research/phase-2-l1-packages.md`](phase-2-l1-packages.md) §6 lesson #2). Workspace consumers symlink in; ESM/CJS interop handled at the consuming layer. |

## 3. Open questions (parked for follow-up)

- **Q1:** Pino → Loki shipping path — direct via OTLP logs (blocked by source #7 bug), or via Grafana Agent on Oracle VM (sidecar pattern)? Recommend the Grafana Agent path; lands in P21 (observability hardening) where we already have the agent running for trace + metric shipping.
- **Q2:** OutboxPort change-streams upgrade — `change-stream` based push (no polling) is more efficient at scale but requires a replica set (Atlas M0 IS a replica set; supported). Parked for P21; the 250 ms poller is fine for MVP.
- **Q3:** `mongodb-memory-server` ARM compatibility on the Oracle VM — CI test only runs on `ubuntu-latest` (x86), so ARM compat isn't blocking. If we ever need to run the integration test locally on ARM Mac, we'd switch to `mongodb-memory-server` (which downloads platform-native binaries automatically). Parked.

## 4. Implementation checklist

- [x] `docs/research/phase-3-l2-packages.md` (this file) sections 1-5 complete
- [ ] Phase 3 Epic + Phase-Acceptance issues opened under milestone "Phase 3 - L2 Platform"
- [ ] `@repo/database` populated — connection factory + namespace helper + base-schema plugin + outbox collection + transactions wrapper + README
- [ ] `@repo/config` populated — `EnvSchema` (Zod port of the old Joi) + `loadEnv` + `ConfigValidationError` + types + README + root `.env.example`
- [ ] `@repo/utils` populated — ulid + trace-id + redactor + pino-logger + retry + OutboxPort interface + `MongoOutboxRepository` + `InProcessOutboxPort` relayer + README
- [ ] `@repo/observability` populated — `bootstrapOtel` + `shutdownOtel` + health-metrics helper + README
- [ ] `.dependency-cruiser.cjs` L2 boundary rule passes (already present from a prior PR; just verify 0 errors)
- [ ] 8 unit + 1 integration test (`mongodb-memory-server`) added across the 4 packages; tier-gated 80 % coverage threshold
- [ ] Full local smoke: install + check-types + lint + test + build + dep-cruiser + markdownlint all green
- [ ] PR-11 opened, Copilot review iterated, squash merged
- [ ] Status sync: project board + Phase 3 Epic + Phase-Acceptance + parent plan + this note Section 6 + Phase 3 milestone closed

## 5. Versions captured

Captured via `pnpm ls --depth=0 -r --filter './packages/{database,config,utils,observability}'` on the smoke checkout that produced this PR:

| Package | Specifier (new direct dep) | Resolved | Notes |
| --- | --- | --- | --- |
| `mongoose` | `^8.x` on `@repo/database` | 8.x current | Pinned via pnpm resolution. |
| `pino` | `^9.x` on `@repo/utils` | 9.x current | Active major. |
| `pino-pretty` | `^11.x` on `@repo/utils` | 11.x current | Dev-only pretty-printer; prod uses raw JSON. |
| `ulidx` | `^2.x` on `@repo/utils` | 2.x current | Crockford base32 ULID generator. |
| `lru-cache` | `^11.x` on `@repo/utils` | 11.x current | Idempotency-key dedup LRU. |
| `@opentelemetry/sdk-node` | `^0.218.x` on `@repo/observability` | 0.218.x current | Bundles `api-logs`, tracer provider, metric reader, log record processor wiring. |
| `@opentelemetry/auto-instrumentations-node` | `^0.76.x` on `@repo/observability` | 0.76.x | Selectively enabled via `getNodeAutoInstrumentations({...})`. |
| `@opentelemetry/exporter-trace-otlp-http` | `^0.218.x` | matches sdk-node | OTLP HTTP traces. |
| `@opentelemetry/exporter-metrics-otlp-http` | `^0.218.x` | matches sdk-node | OTLP HTTP metrics. |
| `mongodb-memory-server` | `^10.x` on `@repo/utils` devDep | 10.x | Integration-test dep only. |

Refreshed after merge via the same `pnpm ls --depth=0 -r --filter` invocation.

## 6. Implementation reference

Filled after merge: PR URL + squash SHA + diff stats + iteration timeline.
