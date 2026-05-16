# Phase 8 — services/inventory-service (PR-18)

## 1. Goal

Ship `services/inventory-service` end-to-end in a single PR (PR-18) so the marketplace gains its inventory backbone: event-sourced per-(variantId, warehouseId) stock ledger in `inventory.stock_ledger` + materialized snapshot in `inventory.stock_snapshots` (rebuilt async on every ledger append via outbox subscriber) + Upstash Redis-backed TTL reservations (`SET NX EX` with 15-min TTL) + per-warehouse low-stock + dead-stock + reorder feeds (via `@nestjs/schedule` crons) + availability query API + admin-CLI-driven inter-warehouse transfer + ledger-as-audit-log.

This phase **populates** the empty P2 shells (`@repo/validators/inventory`, `@repo/events/inventory`) and extends `@repo/types` with `inventory.ts` so future phases (P9 order-saga, P12 notification consumers, P15 insights, P17 web-vendor stock dashboards) can consume the ledger reason enum, reservation status keys, and branded id types without circular imports.

This phase also **lands the real impl** behind the `StockReadPort` interface introduced at P7 D12 (`packages/utils/src/stock-read-port.ts`). The gateway DI binding flips from `useClass: StubStockReadPort` (P7) → `useClass: RedisStockReadPort` (P8) via the in-module binding in `InventoryServiceModule.forRoot(env)` — product-service consumer code does not change. P8 also introduces the second formalized cross-module port — `ReservationPort` — at `@repo/utils` for P9 order-saga consumption.

Q1–Q6 from the sub-plan are resolved with the defaults the user pre-approved (see §3 Decisions D20–D25).

## 2. Citations table (retrieval-dated 2026-05-16)

| # | Topic | Title | URL | Retrieved |
| --- | --- | --- | --- | --- |
| 1 | MongoDB transactions + retryable writes | Transactions — MongoDB Manual | <https://www.mongodb.com/docs/manual/core/transactions/> | 2026-05-16 |
| 2 | Mongoose `Connection#startSession` + `withTransaction` | Transactions — Mongoose v9.6.1 | <https://mongoosejs.com/docs/transactions.html> | 2026-05-16 |
| 3 | `@upstash/redis` TS client (HTTP/REST; serverless-friendly) | @upstash/redis 1.38.0 — npm | <https://www.npmjs.com/package/@upstash/redis> | 2026-05-16 |
| 4 | Redis `SET key value NX EX seconds` (atomic reserve + TTL) | SET command — Redis docs | <https://redis.io/docs/latest/commands/set/> | 2026-05-16 |
| 5 | Upstash Redis free-tier quotas (500K commands/month + 10k cmds/sec peak + 256 MB data + 1 DB + 10 GB monthly bandwidth) | Upstash Redis Pricing | <https://upstash.com/docs/redis/overall/pricing> | 2026-05-16 |
| 6 | `@nestjs/schedule` decorator-based cron + interval + timeout API | Task Scheduling — NestJS docs | <https://docs.nestjs.com/techniques/task-scheduling> | 2026-05-16 |
| 7 | `@nestjs/schedule` 6.1.3 npm (peerDeps Nest 10/11; cron 4.4 dep) | @nestjs/schedule 6.1.3 — npm | <https://www.npmjs.com/package/@nestjs/schedule> | 2026-05-16 |
| 8 | Idempotency-key pattern for stock-decrement / reservation endpoints | Idempotent requests — Stripe API docs | <https://docs.stripe.com/api/idempotent_requests> | 2026-05-16 |
| 9 | Idempotent API design principles (server-side dedup window + retry safety) | Making retries safe with idempotent APIs — AWS Builders Library | <https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/> | 2026-05-16 |
| 10 | Event sourcing pattern (ledger-as-source-of-truth + materialized view) | Event Sourcing — Martin Fowler | <https://martinfowler.com/eaaDev/EventSourcing.html> | 2026-05-16 |
| 11 | MongoDB TTL indexes (60s sweeper grain; explicit reason we don't use them for reservation expiry — Redis NX EX is atomic-on-insert) | TTL Indexes — MongoDB Manual | <https://www.mongodb.com/docs/manual/core/index-ttl/> | 2026-05-16 |
| 12 | Razorpay payment-gateway flow (auth + capture + late-authorization 5-day window) | Razorpay Payment Gateway Flow — Razorpay Docs | <https://razorpay.com/docs/payments/payment-gateway/how-it-works> | 2026-05-16 |
| 13 | Razorpay Capture Settings API (automatic_expiry_period 12-min min; manual_expiry_period 7200 min max) | Configure Payment Capture Settings using Orders API — Razorpay Docs | <https://razorpay.com/docs/payments/payments/capture-settings/api/> | 2026-05-16 |
| 14 | Atlas Free Cluster (M0) operational limits (100 DBs + 500 collections + 0.5 GB data + 10 GB rolling-7-day bandwidth + 100 ops/sec) | Atlas Free Cluster Limits — MongoDB Atlas Docs | <https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/> | 2026-05-16 |
| 15 | MongoDB compound indexes (ESR ordering + index-prefix queries — for the snapshot `(variantId, warehouseId)` unique compound) | Compound Indexes — MongoDB Manual | <https://www.mongodb.com/docs/manual/core/index-compound/> | 2026-05-16 |
| 16 | MongoDB `$group` aggregation (sum / count / accumulator semantics — used by `availability.service.ts` to aggregate snapshot rows per variant across warehouses) | $group — MongoDB Manual | <https://www.mongodb.com/docs/manual/reference/operator/aggregation/group/> | 2026-05-16 |
| 17 | MongoDB `findOneAndUpdate` semantics (why we DON'T use it for snapshot atomic updates per D4 — ledger-append + outbox subscriber is the better fit) | findOneAndUpdate() — MongoDB Manual | <https://www.mongodb.com/docs/manual/reference/method/db.collection.findOneAndUpdate/> | 2026-05-16 |
| 18 | `@nestjs/mongoose` 11.0.4 (peer Nest 10/11 + Mongoose 7/8/9; used at L4 since P6 D20) | @nestjs/mongoose 11.0.4 — npm | <https://www.npmjs.com/package/@nestjs/mongoose> | 2026-05-16 |
| 19 | RFC 9457 ProblemDetails (the wire format for `INSUFFICIENT_STOCK` + `RESERVATION_ALREADY_EXTENDED` + `WAREHOUSE_OWNERSHIP_REQUIRED` errors emitted by inventory-service) | RFC 9457: Problem Details for HTTP APIs — IETF Datatracker | <https://datatracker.ietf.org/doc/html/rfc9457> | 2026-05-16 |
| 20 | MongoDB GeoJSON objects + 2dsphere index (re-cite — the `vendor.warehouses.location` already shipped at P6 D9; inventory-service consumes it via `WarehouseService.getById()` for the `WarehouseOwnershipGuard` lookup but does NOT add new geospatial indexes) | GeoJSON Objects — MongoDB Manual | <https://www.mongodb.com/docs/manual/reference/geojson/> | 2026-05-16 |

All citations were freshly retrieved on 2026-05-16 — within the 14-day freshness window per `.cursor/rules/always-latest-docs.mdc`.

**Internal references (not in the citation table; cited inline):**

- `@repo/events/builders.ts` — `defineEvent(name, payloadSchema)` factory (returns `{ name, schema }`; consumed by every inventory-service event file).
- `packages/events/README.md` — outbox pattern documentation.
- `.cursor/rules/event-driven-discipline.mdc` — outbox publish must happen inside `withTransaction(connection, session => { ... outbox.publish(..., { session }) })`.
- `.cursor/rules/free-tier-budget.mdc` — Upstash Redis quota line (this PR updates with the 2026-05-16 retrieved quota; previous "10k cmds/day" entry was outdated — the current cap is 500K commands/month + per-second peak 10k cmds, per cite #5).

## 3. Decisions log

Decisions D1–D14 below are the sub-plan's baked-in decisions (`.cursor/plans/p8_inventory-service_pr-18_13ecfd53.plan.md`) plus the user's Q1–Q6 answers folded as D20–D25.

### D1 — Single PR-18

One `feat(inventory)` commit covers `@repo/types/inventory` + `@repo/validators/inventory` (~10 files) + `@repo/events/inventory` (8 v1 events) + `@repo/utils` 2 new files (`reservation-port.ts` + `redis-stock-read-port.ts`) + `services/inventory-service` end-to-end (5 schemas + 11 services + 6 controllers + 1 CLI + WarehouseOwnershipGuard + module + barrel + tests + analytics + env entries) + `apps/api-gateway` wiring + `docs/architecture/cross-service-contracts.md` update + `.cursor/rules/free-tier-budget.mdc` update. Mirrors PR-13/14/15/16/17 cadence — single squash + Copilot iteration in follow-up commits.

### D2 — Event-sourced ledger + async materialized snapshot

Append-only `inventory.stock_ledger` is the source of truth; `inventory.stock_snapshots` is an eventually-consistent projection rebuilt by an outbox subscriber on every `inventory.stock-ledger-appended.v1` event. The snapshot row carries `pendingLedgerCount` so reads can detect lag (>5 pending entries) and fall back to ledger aggregate per D5. Rationale per [cite #10](#2-citations-table-retrieval-dated-2026-05-16) (event sourcing + materialized view pattern).

### D3 — Upstash Redis `SET NX EX 900` reservation model

Redis key shape `inv:reservation:{variantId}:{warehouseId}:{idempotencyKey}` with 15-min TTL. Reservation value JSON `{ qty, extensionCount, cartId?, actorId, createdAt }`. Extension via `EXPIRE key 900 XX` (only updates existing key per [cite #4](#2-citations-table-retrieval-dated-2026-05-16)). Release via `DEL`. The atomic-on-insert NX semantics deliver the dedup-on-idempotency-key behavior we need. Per [cite #11](#2-citations-table-retrieval-dated-2026-05-16), MongoDB TTL indexes are NOT a viable alternative — their 60-second background sweeper is too slow + they have no atomic NX-on-insert primitive.

### D4 — No optimistic locking on the snapshot

The append-only ledger IS the atomic operation. Mongo's unique compound index on `(variantId, warehouseId)` for the snapshot + Redis `SET NX` for reservations together provide all the serialization the marketplace needs at MVP. We explicitly REJECT `findOneAndUpdate` with `$inc` (per [cite #17](#2-citations-table-retrieval-dated-2026-05-16) for what we're rejecting) because two concurrent ledger appends produce two ledger entries with adjacent `ledgerSeq` values — the snapshot updater applies them in order; no read-modify-write race exists at the snapshot layer.

### D5 — `RedisStockReadPort` impl (snapshot-first + ledger-fallback)

`RedisStockReadPort.batchGet(variantIds)` aggregates `inventory.stock_snapshots` by `variantId` (sums `onHand - reservedCount` across all warehouses) — single Mongo `$group` aggregate per call per [cite #16](#2-citations-table-retrieval-dated-2026-05-16). When `pendingLedgerCount > 5` for a snapshot row, the impl falls back to a ledger aggregate for that (variantId, warehouseId) — protects against snapshot lag during burst-write windows. Per [cite #15](#2-citations-table-retrieval-dated-2026-05-16), the compound index `(variantId, warehouseId)` serves both the aggregate (index-prefix on `variantId`) and the per-(variantId, warehouseId) point read (full-key match).

### D6 — Inter-warehouse transfer = admin-CLI-driven MVP

`pnpm inventory:transfer --from <warehouseId> --to <warehouseId> --variant <variantId> --qty <n> --reason <text>`. The CLI bootstraps a standalone Nest app context (same `NestFactory.createApplicationContext(AppModule)` pattern documented in [cite #6](#2-citations-table-retrieval-dated-2026-05-16) for `@nestjs/schedule` worker contexts) + writes two ledger entries atomically inside `withTransaction` + emits `inventory.transferred.v1`. NO UI in P8 — UI deferred to P17 (web-vendor) + P18 (web-admin).

### D7 — Ledger-as-audit-log (no separate audit collection)

Every ledger entry IS an audit log entry — `actorId` + `reason` + `reasonNote` + ulid id + timestamp are all on the ledger row. Per-vendor + per-warehouse filtering via Mongo `$match` on the indexed `vendorId` + `warehouseId` fields. The `inventory.reservation_audit` collection IS separate because Redis is the source of truth for live reservations + the audit row is the immutable trail of reservation lifecycle events that Redis can't durably persist (Upstash free tier has no Redis Streams).

### D8 — `@nestjs/schedule` adoption at L4

First introduction at L4. `ScheduleModule.forRoot()` inside `InventoryServiceModule.forRoot(env)` + `@Cron` decorators on the reservation-sweeper (every 60s) + reorder-detector (daily 9 AM IST) + dead-stock-detector (daily 10 AM IST) services. Version pinned via [cite #7](#2-citations-table-retrieval-dated-2026-05-16) — 6.1.3 (published Apr 2026; peerDeps Nest 10/11). Documented in [cite #6](#2-citations-table-retrieval-dated-2026-05-16) — `@Cron('expression', { timeZone })` decorator + `OnApplicationBootstrap` integration + auto try-catch on every handler.

### D9 — Reservation idempotency key (cart-scoped + header-provided)

Per [cite #8](#2-citations-table-retrieval-dated-2026-05-16) (Stripe Idempotent Requests) + [cite #9](#2-citations-table-retrieval-dated-2026-05-16) (AWS Builders Library — Making Retries Safe with Idempotent APIs). The key MUST be cart-scoped (one cart = one key for the same (variantId, warehouseId, qty) — re-reserves return the existing reservation). Provided by P9 order-service in the `Idempotency-Key` header. Server stores the resulting reservationId in the Redis key value; re-reserves with the same idempotencyKey return that reservationId rather than creating a duplicate.

### D10 — Cross-service authorization via `WarehouseOwnershipGuard`

Inventory writes require `@RequireRole('admin'|'warehouse-manager')` + `WarehouseOwnershipGuard`. The guard resolves `:warehouseId` → `warehouse.vendorId` → `vendor.orgId === session.activeOrganizationId` via `WarehouseService.getById()` cross-service read from `@lotusgift/vendor-service` (legal per P7 D13 precedent + modular-monolith deployment-mode). Cross-service READ via the in-process `RedisStockReadPort` is unauthenticated at the port level — the caller (e.g. product-service) is responsible for its own upstream auth.

### D11 — Outbox + analytics ordering (post-commit)

Analytics `capture()` fires AFTER `withTransaction` commits — NEVER inside the transaction. Per [cite #2](#2-citations-table-retrieval-dated-2026-05-16) (Mongoose `withTransaction` commit/abort semantics — abort wipes the in-memory writes; analytics fired inside the tx would still ship even on abort). PostHog event names per `.cursor/rules/analytics-instrumentation.mdc` `object verb` convention: `inventory stock_decremented` / `inventory stock_incremented` / `inventory reservation_created` / `inventory reservation_extended` / `inventory reservation_expired` / `inventory reservation_consumed` / `inventory transferred` / `inventory low_stock_detected` / `inventory dead_stock_detected` / `inventory reorder_needed` / `inventory adjustment_recorded`. Same lesson P6 + P7 enforced (D18 + D14).

### D12 — Reservation TTL extension (one-time only)

Only ONE extension per reservation allowed. Tracked via `extensionCount: number` in the Redis value JSON; subsequent extends rejected with `RESERVATION_ALREADY_EXTENDED` ProblemDetails per [cite #19](#2-citations-table-retrieval-dated-2026-05-16). Bounds the stock-hold window to 30 min worst-case (15 min original + 15 min extension) — matches Razorpay's auto-capture default minimum of 12 minutes per [cite #13](#2-citations-table-retrieval-dated-2026-05-16) (which lets the payment-flow capture step land before the second TTL window closes).

### D13 — Stock-decrement timing (decrement-at-capture)

Stock decrement happens at payment **capture** (not at payment **auth**). The Redis reservation holds stock between auth + capture (15-min window per D3). On capture, P9 order-service emits `order.placed.v1` which inventory-service subscribes to + writes a `RESERVATION_RELEASED` ledger entry simultaneously with an `ORDER_DECREMENTED` ledger entry (same `withTransaction`). Rationale per [cite #12](#2-citations-table-retrieval-dated-2026-05-16) (Razorpay payment-gateway flow — late-authorization up to 5 days; decrement-at-auth would produce false stock-outs) + [cite #13](#2-citations-table-retrieval-dated-2026-05-16) (Razorpay capture-settings API — auto-capture min 12 min; manual-capture max 7200 min).

### D14 — Atlas M0 + namespacing compliance

All collections via `namespace('inventory', '<entity>')` per `.cursor/rules/deployment-mode.mdc`. Atlas M0 limits per [cite #14](#2-citations-table-retrieval-dated-2026-05-16): 100 DBs + 500 collections + 0.5 GB data + 10 GB rolling-7-day bandwidth + 100 ops/sec — we use 1 DB (lotusgift) + 5 inventory collections (well within budget). NO new Atlas Search index allocation needed (the 3-index M0 budget is allocated to products + vendors + orders per parent plan §9).

### D20 — Q1 answer: Snapshot rebuild = async (eventually consistent)

User accepted the async-rebuild default. Materialized snapshot is updated by an outbox subscriber on every `inventory.stock-ledger-appended.v1` event (~250ms lag via the in-process outbox at 250ms poll interval per `InProcessOutboxPort` default). The `pendingLedgerCount` field on the snapshot doc lets reads detect lag + fall back to ledger aggregate when `pendingLedgerCount > 5` (D5). Revisit trigger: customer-facing PDP "in stock / out of stock" badge flicker reports OR P15 forecasts off by >5%.

### D21 — Q2 answer: Redis fallback = fail-closed in prod, in-memory in dev

User accepted the production-fail-closed + dev-in-memory split. Matches P4 D2 rate-limit gating pattern. The `InventoryServiceModule`'s factory provider for `RESERVATION_PORT` chooses based on `NODE_ENV !== 'production' || (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN)`. Production with neither env var set → hard-warn at bootstrap (NOT a hard fail in the env.schema.ts superRefine — soft warning so single-instance prod can still ship the modular monolith). Revisit trigger: multi-instance Oracle deployment per `docs/runbooks/scaling-up.md` GMV trigger.

### D22 — Q3 answer: Stock-decrement timing = two-phase (decrement-at-capture)

User accepted decrement-at-capture with Redis reservation holding the stock for 15 min between auth + capture (D13). Reservation created at order placement (before payment); extended once at payment-auth (D12); consumed at payment-capture (writes RESERVATION_RELEASED + ORDER_DECREMENTED ledger entries in the same `withTransaction`). Revisit trigger: P10 + Razorpay testing reveals systemic false stock-out from late-authorization (>1% of orders).

### D23 — Q4 answer: Negative-stock = hard-reject in P8 MVP

User accepted hard-reject. `ledger.service.append()` asserts `currentSnapshot.onHand + delta >= 0` before writing; throws `INSUFFICIENT_STOCK` RFC 9457 ProblemDetails per [cite #19](#2-citations-table-retrieval-dated-2026-05-16). Backorder mode gated behind per-product `allowBackorder` flag added in P9 product-service extension (NOT here — this PR doesn't touch product-service). Revisit trigger: first vendor request to enable backorder for a high-value SKU.

### D24 — Q5 answer: Reservation expiry = active sweeper (cron)

User accepted active sweeper. `@Cron('*/60 * * * * *', { timeZone: 'Asia/Kolkata' })` scans Redis for keys whose stored `expiresAt` is past + emits `inventory.reservation-expired.v1` + writes the `inventory.reservation_audit` row. Idempotent via outbox LRU dedup on `idempotencyKey`. P12 notification-service consumes the expired event to notify the buyer "your cart was released — re-add items". Revisit trigger: P12 determines a passive flow + Redis Keyspace Notifications would suffice.

### D25 — Q6 answer: Low-stock threshold = per-warehouse

User accepted per-warehouse threshold. Stored on `inventory.stock_snapshots.lowStockThreshold` field (default 10 from `INVENTORY_DEFAULT_LOW_STOCK_THRESHOLD` env). Vendor can override per-(variantId, warehouseId) via `PUT /api/inventory/low-stock-config`. Global "in stock" badge for the customer-facing PDP/PLP is calculated by product-service from the `StockReadPort.batchGet` result (sum across warehouses) — emerges from per-warehouse data without a separate global threshold. Revisit trigger: vendor feedback that per-warehouse thresholds are too noisy.

## 4. Open questions (4, parked beyond Q1-Q6 user defaults)

### Q-OPEN-1 — Reservation sweeper resilience under Upstash quota throttling

If a single 60-second sweeper tick scans (worst case) 500 expired keys, that's 500 + 500 + 500 = 1500 Redis ops per tick (peek + EXPIRE-check + DEL). At sustained peak that's 1500 × 1440 = 2.16M ops/day — over the 500K/month free-tier budget after ~7 days. **Park resolution to first month of production data**: if peak reservation count > 100 concurrent per minute, switch the sweeper from per-key DEL to a single `SCAN cursor MATCH inv:reservation:* COUNT 100` + bulk `DEL key1 key2 ...` per batch (5× ops reduction). For MVP launch we expect <10 concurrent reservations + the sweeper is well within budget.

### Q-OPEN-2 — `inventory.stock_snapshots` vs Atlas Search index for the public availability endpoint

The `POST /api/inventory/availability` public endpoint reads from `inventory.stock_snapshots` (Mongo aggregate). For PLP search-with-stock-filter ("show me products in stock"), P7 product-service's `product.search_index` + the `RedisStockReadPort` pair already covers this. **Park resolution to P15 insights-service**: if forecasting/demand needs faster joins between catalog + stock at PLP scale, add a denormalized stock field to `product.search_index` synced from `inventory.stock-ledger-appended.v1` events.

### Q-OPEN-3 — Per-tier reservation TTL override (vendor subscription tiers)

Enterprise vendors may want longer reservation TTLs (e.g. 30 min for high-value B2B carts). MVP uses a single env-default `INVENTORY_RESERVATION_TTL_SECONDS = 900` for all reservations. **Park resolution to P14 promotions-service** where the per-tier feature matrix lands; tier override would extend the JSON payload of the Redis value with `ttlSec: number` resolved at reserve-time from the active vendor tier.

### Q-OPEN-4 — Reservation-audit retention policy

`inventory.reservation_audit` rows are immutable + carry no PII (only ulid ids + qty + timestamps + idempotencyKey). Mongo TTL index could expire rows after N days (cite #11) — N TBD. **Park resolution to P21 observability**: align with the general retention policy for audit collections (likely 90 days hot + cold-archive to Cloudflare R2 per `docs/runbooks/backup-restore.md`).

## 5. Implementation checklist (mirrors sub-plan §5)

### `@repo/types`

- [ ] `packages/types/src/inventory.ts` — `STOCK_LEDGER_REASONS` (14 keys) + `RESERVATION_STATUS_KEYS` (5 keys) + branded `ReservationId` + branded `LedgerEntryId` + `DEFAULT_RESERVATION_TTL_SEC = 900` + `RESERVATION_TTL_MAX_EXTENSIONS = 1`.
- [ ] `packages/types/src/index.ts` — barrel re-export.

### `@repo/validators/src/inventory/` (populates the empty P2 shell)

- [ ] `ledger-row.ts` — `LedgerEntryRequestSchema` + `LedgerEntryResponseSchema` + `LedgerListQuerySchema`.
- [ ] `snapshot-row.ts` — `StockSnapshotSchema` + `BatchAvailabilityQuerySchema`.
- [ ] `reservation-request.ts` — `ReservationCreateRequestSchema` + `ReservationExtendRequestSchema` + `ReservationReleaseRequestSchema` + `ReservationResponseSchema`.
- [ ] `adjustment-request.ts` — `AdjustmentRequestSchema`.
- [ ] `transfer-request.ts` — `TransferRequestSchema`.
- [ ] `low-stock-config.ts` — `LowStockThresholdSchema` + `DeadStockWindowSchema` + `ReorderPointSchema`.
- [ ] `availability-query.ts` — `AvailabilityQuerySchema` + `AvailabilityResponseSchema` mirroring the `StockReadPort.batchGet` contract.
- [ ] `index.ts` barrel.
- [ ] `packages/validators/src/index.ts` — add `export * from './inventory/index.js';`.

### `@repo/events/src/inventory/` (populates the empty P2 shell)

- [ ] `stock-ledger-appended.v1.ts` — `defineEvent('inventory.stock-ledger-appended.v1', { orgId, vendorId, warehouseId, variantId, ledgerEntryId, delta, reason, newOnHand })`.
- [ ] `low-stock-detected.v1.ts` — `defineEvent('inventory.low-stock-detected.v1', { orgId, vendorId, warehouseId, variantId, onHand, threshold, detectedAt })`.
- [ ] `dead-stock-detected.v1.ts` — `defineEvent('inventory.dead-stock-detected.v1', { orgId, vendorId, warehouseId, variantId, onHand, daysSinceLastMovement, detectedAt })`.
- [ ] `reorder-needed.v1.ts` — `defineEvent('inventory.reorder-needed.v1', { orgId, vendorId, warehouseId, variantId, onHand, reorderPoint, suggestedOrderQty, detectedAt })`.
- [ ] `transferred.v1.ts` — `defineEvent('inventory.transferred.v1', { orgId, vendorId, fromWarehouseId, toWarehouseId, variantId, qty, transferId, reasonNote })`.
- [ ] `reservation-created.v1.ts` — `defineEvent('inventory.reservation-created.v1', { orgId, vendorId, warehouseId, variantId, reservationId, qty, ttlSec, idempotencyKey, cartId? })`.
- [ ] `reservation-extended.v1.ts` — `defineEvent('inventory.reservation-extended.v1', { orgId, vendorId, warehouseId, variantId, reservationId, newTtlSec, extensionCount })`.
- [ ] `reservation-expired.v1.ts` — `defineEvent('inventory.reservation-expired.v1', { orgId, vendorId, warehouseId, variantId, reservationId, qty, idempotencyKey })`.
- [ ] `packages/events/src/inventory/index.ts` — barrel re-export the 8 events.
- [ ] `packages/events/src/index.ts` — add `export * from './inventory/index.js';`.

### `@repo/utils`

- [ ] `packages/utils/src/reservation-port.ts` NEW — `ReservationPort` interface + `RESERVATION_PORT` token + `StubReservationPort` class.
- [ ] `packages/utils/src/redis-stock-read-port.ts` NEW — `RedisStockReadPort` class implementing the existing `StockReadPort` interface.
- [ ] `packages/utils/src/reservation-port.test.ts` + `redis-stock-read-port.test.ts` — stubbed Mongo connection + in-process Map for Upstash Redis stub.
- [ ] `packages/utils/src/index.ts` — re-export the 4 new public names.

### `services/inventory-service/src/`

- [ ] `schemas/stock-ledger.schema.ts` — append-only `inventory.stock_ledger`.
- [ ] `schemas/stock-snapshot.schema.ts` — `inventory.stock_snapshots` (unique on (variantId, warehouseId)).
- [ ] `schemas/reservation.schema.ts` — `inventory.reservation_audit` append-only.
- [ ] `schemas/transfer.schema.ts` — `inventory.transfers`.
- [ ] `schemas/low-stock-config.schema.ts` — `inventory.low_stock_config`.
- [ ] `services/ledger.service.ts` — append + emit inside `withTransaction`.
- [ ] `services/snapshot-updater.service.ts` — outbox subscriber.
- [ ] `services/reservation.service.ts` — reserve / extend / release orchestration.
- [ ] `services/redis-reservation.service.ts` — Upstash impl of `ReservationPort`.
- [ ] `services/in-memory-reservation.service.ts` — dev fallback impl of `ReservationPort`.
- [ ] `services/reservation-sweeper.service.ts` — `@Cron('*/60 * * * * *')`.
- [ ] `services/availability.service.ts` — shared by HTTP controller + `RedisStockReadPort`.
- [ ] `services/transfer.service.ts` — atomic two-ledger-entry transfer.
- [ ] `services/adjustment.service.ts` — vendor + admin per-warehouse adjust.
- [ ] `services/reorder-detector.service.ts` — daily 9 AM IST cron.
- [ ] `services/dead-stock-detector.service.ts` — daily 10 AM IST cron.
- [ ] `services/analytics.helper.ts` — `NO_OP_ANALYTICS` + capture wrappers.
- [ ] `services/index.ts` — barrel.
- [ ] `controllers/availability.controller.ts` — `POST /api/inventory/availability`.
- [ ] `controllers/ledger.controller.ts` — `GET /api/inventory/ledger`.
- [ ] `controllers/reservation.controller.ts` — `POST/GET/DELETE /api/inventory/reservations`.
- [ ] `controllers/adjustment.controller.ts` — `POST /api/inventory/adjustments`.
- [ ] `controllers/transfer.controller.ts` — admin-only POST + admin list.
- [ ] `controllers/low-stock-config.controller.ts` — vendor-tunable per-(variantId, warehouseId) override.
- [ ] `controllers/mappers/*.mapper.ts` — 3 response mappers.
- [ ] `controllers/index.ts` — barrel.
- [ ] `decorators/warehouse-ownership.guard.ts`.
- [ ] `decorators/index.ts` — barrel + re-exports `RoleGuard` + `RequireRole` from vendor-service.
- [ ] `cli/inventory-transfer.cli.ts` — admin-CLI transfer wrapper.
- [ ] `session.types.ts` — local SessionPayload mirror.
- [ ] `inventory-service.tokens.ts` — ENV_TOKEN + ANALYTICS_TOKEN + re-exports.
- [ ] `inventory-service.module.ts` — `MongooseModule.forFeature` + `VendorServiceModule.forRoot(env)` + `ScheduleModule.forRoot()` + all providers + RESERVATION_PORT factory + STOCK_READ_PORT override + OnApplicationBootstrap subscriber wiring + OnApplicationShutdown drain.
- [ ] `index.ts` — barrel re-exports `InventoryServiceModule` + 8 v1 event types + guards + tokens + `RedisStockReadPort` + `RedisReservationService`.
- [ ] `package.json` — Nest framework + mongoose as `peerDependencies`; `@nestjs/mongoose` + `@nestjs/schedule` + `@upstash/redis` + `lru-cache` + `nestjs-zod` + `zod` direct deps; workspace deps for `@repo/*` + `@lotusgift/vendor-service`.
- [ ] `tsconfig.json`.
- [ ] `jest.config.ts`.
- [ ] `eslint.config.mjs`.
- [ ] `README.md` — module purpose + ledger + snapshot diagram + reservation TTL flow + cron schedule table + cross-service consumer table.

### `apps/api-gateway/`

- [ ] `src/app.module.ts` — register `InventoryServiceModule.forRoot(env)` after `ProductServiceModule.forRoot(env)`; REMOVE the P7 `{ provide: STOCK_READ_PORT, useClass: StubStockReadPort }` line (the in-module binding wins in DI scope).
- [ ] `package.json` — add `@lotusgift/inventory-service: workspace:*` + new `inventory:transfer` script.
- [ ] `Dockerfile` — add `services/inventory-service/package.json` to deps stage COPY + `services/inventory-service` directory to build stage.

### `packages/config/src/env.schema.ts`

- [ ] Add 7 optional inventory-service env vars + soft-warn production superRefine for missing Upstash creds.

### `.env.example`

- [ ] Append 7 new entries under `# ---- Inventory service (P8) ----` header.

### `docs/architecture/cross-service-contracts.md`

- [ ] UPDATE — move StockReadPort row's "Real impl ships in" cell; add ReservationPort row to §Active ports; remove the matching row from §Upcoming ports.

### `.cursor/rules/free-tier-budget.mdc`

- [ ] UPDATE — bump Upstash Redis line item to the 2026-05-16 retrieved current quota (500K commands/month + 10k cmds/sec peak + 256 MB + 1 DB + 10 GB bandwidth) per cite #5.

### Research note

- [ ] This file. §6 backfilled post-merge.

### GitHub

- [ ] Phase 8 milestone created (does NOT currently exist; phase/P8 label DOES exist from p0-issues seed).
- [ ] Phase 8 Epic + Phase-Acceptance issues under that milestone with `phase/P8` labels.

### Tests (≥28 across 11+ spec files; Tier-1 ≥85% lines / ≥80% branches)

- [ ] `ledger.service.spec.ts` — append + saga happy + saga unhappy + ledgerSeq monotonicity (4+ tests).
- [ ] `snapshot-updater.service.spec.ts` — rebuild + idempotent re-replay + pendingLedgerCount + missing-snapshot auto-create (3-4 tests).
- [ ] `reservation.service.spec.ts` — idempotencyKey dedup + extend one-time cap + release + saga happy + saga unhappy (5+ tests).
- [ ] `redis-reservation.service.spec.ts` — SET NX EX + EXPIRE XX + DEL call shapes (3+ tests).
- [ ] `in-memory-reservation.service.spec.ts` — Map TTL eviction + extension cap + single-instance loss simulation (3 tests).
- [ ] `reservation-sweeper.service.spec.ts` — cron tick + expired emit + audit row + dedup (2-3 tests).
- [ ] `availability.service.spec.ts` — batch read 200-variant cap + aggregate shape matches port contract + missing variantId default-zero (3 tests).
- [ ] `transfer.service.spec.ts` — atomic two-ledger-entry + transferred.v1 emit + rollback on partial failure (2-3 tests).
- [ ] `reorder-detector.service.spec.ts` — scan + emit + idempotent re-run (2 tests).
- [ ] `dead-stock-detector.service.spec.ts` — scan + emit + threshold env (2 tests).
- [ ] `warehouse-ownership.guard.spec.ts` — orgId match + admin bypass + 403 mismatch (3 tests).
- [ ] `packages/utils/src/redis-stock-read-port.test.ts` — batchGet aggregate + stale-snapshot fallback (2-3 tests).
- [ ] `packages/utils/src/reservation-port.test.ts` — stub semantics (1-2 tests).

## 6. Implementation reference

To be backfilled post-merge with:

- PR-18 URL
- Squash SHA on `main`
- Copilot review iteration count + themes
- Lessons learned for P9 order-service (especially around `ReservationPort` consumption, idempotencyKey threading from cart to reservation, and the StockReadPort.batchGet hot-path under load)

## 7. Versions captured

Captured via `pnpm ls --depth=0 --filter @lotusgift/inventory-service` after PR-18 lockfile sync:

```text
(captured post-install)
```

To be filled after the local smoke run.
