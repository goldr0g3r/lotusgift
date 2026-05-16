---
name: P8 inventory-service PR-18
overview: Build services/inventory-service end-to-end in a single PR-18 — event-sourced per-(variantId, warehouseId) stock ledger in `inventory.stock_ledger` + materialized snapshot in `inventory.stock_snapshots` (rebuilt async on every ledger append via outbox subscriber) + Upstash Redis-backed TTL reservations (`SET NX EX` with 15-min TTL keyed `inv:reservation:{variantId}:{warehouseId}:{idempotencyKey}`) + per-warehouse low-stock + dead-stock + reorder feeds emitted via @nestjs/schedule cron + availability query API via the new `InventoryStockReadPort` impl (replaces `StubStockReadPort` bound at gateway by P7) + admin-CLI-driven inter-warehouse transfer (`pnpm inventory:transfer`) emitting `inventory.transferred.v1` + ledger entries serve as the audit log (no separate audit collection). Populates the empty P2 shells in @repo/validators/inventory + @repo/events/inventory + extends @repo/utils with `RedisStockReadPort` (the real impl behind the StockReadPort interface introduced at P7 D12) + adds new `RESERVATION_PORT` + `StubReservationPort` cross-module surface to @repo/utils for future order-saga consumption (P9). Wires InventoryServiceModule into apps/api-gateway/src/app.module.ts via .forRoot(env) + flips the gateway STOCK_READ_PORT binding from `StubStockReadPort` → `RedisStockReadPort`. Authorization layered as global P5b AuthGuard + @RequireRole('admin'|'warehouse-manager') + new `WarehouseOwnershipGuard` (resolves `:warehouseId` → `warehouse.vendorId` → vendor.orgId match OR admin bypass — mirrors P6 `VendorOwnershipGuard` pattern). 8 outbox events (`stock-ledger-appended.v1` / `low-stock-detected.v1` / `dead-stock-detected.v1` / `reorder-needed.v1` / `transferred.v1` / `reservation-created.v1` / `reservation-extended.v1` / `reservation-expired.v1`). Tier-1 test coverage gate (≥85% lines / ≥80% branches; saga happy + unhappy path tests required).
todos:
  - id: research-note-p8
    content: Write docs/research/phase-8-inventory-service.md with ≥12 retrieval-dated 2026-05-16 citations + ≥12 D-decisions (collapsing the sub-plan's D1–D14 + Q1–Q6 answers as D20–D25) + ≥4 open questions + implementation checklist + Section 6 placeholder (backfilled post-merge with PR-18 link + Copilot iteration timeline + lessons for P9 order-service).
    status: pending
  - id: phase-8-issues
    content: Verify Phase 8 milestone exists (gh api repos/goldr0g3r/lotusgift/milestones?state=all — phase/P8 label already exists from p0-issues seed; milestone NOT yet seeded). If absent, create via `gh api -X POST repos/goldr0g3r/lotusgift/milestones -f title="Phase 8 - Inventory Service" -f description="Per-(variantId, warehouseId) stock ledger + Redis TTL reservations + InventoryStockReadPort binding (PR-18)"`. Then create the Phase 8 Epic ("Phase 8 — Epic: services/inventory-service (stock ledger + Redis reservations + StockReadPort real impl)") + Phase-Acceptance issues with labels `phase/P8,area/infra,epic` and `phase/P8,phase-acceptance` mirroring the body structure of #39/#40 (P7 issues).
    status: pending
  - id: branch-pr-18
    content: After P7/PR-17 merges to main, `git fetch origin && git checkout -b pr-18-inventory-service origin/main` (or rebase the pre-created local branch onto the post-P7 main if it exists from planning). Flip parent plan p8 todo to in_progress with note that PR-18 is the PR-of-record.
    status: pending
  - id: deps
    content: Add `@upstash/redis ^1` + `@nestjs/schedule ^6` + `@nestjs/mongoose ^11` + `mongoose ^8` (peer) + `nestjs-zod ^5.3` + `zod ^4.4` + `lru-cache ^11` (in-memory reservation fallback when Upstash unset in dev) to services/inventory-service/package.json. Nest framework packages + mongoose declared as peerDependencies per P5b D14 + P6 D21. Workspace deps on @repo/database + @repo/types + @repo/validators + @repo/events + @repo/utils + @repo/analytics-sdk + @repo/config + @lotusgift/vendor-service (cross-service public-surface read for WarehouseService.getById in WarehouseOwnershipGuard — same legality as P7 D13 VendorService cross-service read). Add `@lotusgift/inventory-service: workspace:*` to apps/api-gateway/package.json.
    status: pending
  - id: utils-reservation-port
    content: packages/utils/src/reservation-port.ts NEW — `ReservationPort` interface (`reserve(input): Promise<ReservationResult>`, `extend(input): Promise<ReservationResult>`, `release(input): Promise<void>`, `peek(variantId, warehouseId): Promise<ReservationSnapshot[]>` — for the materialized snapshot's `reserved` field rebuild) + `RESERVATION_PORT = Symbol.for('@repo/utils#ReservationPort')` token + `StubReservationPort` class (returns `{ ok: true, reservationId, ttlSec }` for every reserve call; no actual persistence). Real impl `RedisReservationPort` lands in services/inventory-service/src/services/redis-reservation.service.ts (Upstash Redis-backed) + `InMemoryReservationPort` fallback for dev when UPSTASH_REDIS_REST_URL is unset (mirrors P4 D2 rate-limit gating pattern). Re-export interface + token + stub from packages/utils/src/index.ts so consumers (P9 order-saga in the future) share the typed contract.
    status: pending
  - id: utils-redis-stock-port
    content: packages/utils/src/redis-stock-read-port.ts NEW — `RedisStockReadPort` class implementing the existing `StockReadPort` interface (introduced at P7 D12). The class is constructed with a Mongoose `Connection` + an injected `ReservationPort`; its `batchGet(variantIds)` queries the `inventory.stock_snapshots` collection (Mongo aggregate, indexed on `(variantId, warehouseId)` — sums on-hand across all warehouses for the variant + subtracts the live reservation count from `ReservationPort.peek()` per (variantId, warehouseId)) + returns the canonical `Map<variantId, { available, reserved, updatedAt }>` shape. Lives at L2 (not L4) so dep-cruiser stays happy AND the apps/api-gateway DI binding can swap from `StubStockReadPort` → `RedisStockReadPort` with a single `useClass:` edit (D12 in the sub-plan). Tests in packages/utils/src/redis-stock-read-port.test.ts cover the batchGet aggregation contract + the missing-variantId default-zero branch + the stale-snapshot fallback to ledger aggregate.
    status: pending
  - id: types-inventory-extension
    content: packages/types/src/inventory.ts NEW — `STOCK_LEDGER_REASONS` (literal-union 14 keys — RECEIVED|RECEIVED_RETURN|RESERVED|RESERVATION_EXPIRED|RESERVATION_RELEASED|ORDER_DECREMENTED|ORDER_CANCELLED|TRANSFER_OUT|TRANSFER_IN|ADJUSTMENT_INCREASE|ADJUSTMENT_DECREASE|COUNT_CORRECTION|DAMAGED_OUT|EXPIRED_OUT) + `RESERVATION_STATUS_KEYS` (PENDING|EXTENDED|EXPIRED|RELEASED|CONSUMED) + branded `ReservationId` + branded `LedgerEntryId` types + `DEFAULT_RESERVATION_TTL_SEC` constant (900 = 15 min) + `RESERVATION_TTL_MAX_EXTENSIONS` constant (1, per D12). Re-export from packages/types/src/index.ts.
    status: pending
  - id: validators-inventory-schemas
    content: Populate packages/validators/src/inventory/ empty shell with ~10 files — ledger-row.ts (`LedgerEntryRequestSchema` + `LedgerEntryResponseSchema` + `LedgerListQuerySchema` with per-(variantId|warehouseId|vendorId|reason|since|until) filters); snapshot-row.ts (`StockSnapshotSchema` matching `inventory.stock_snapshots` shape — variantId + warehouseId + onHand + reserved + available virtual + lowStockThreshold + pendingLedgerCount + updatedAt; `BatchAvailabilityQuerySchema` for the /api/inventory/availability POST body); reservation-request.ts (`ReservationCreateRequestSchema` with variantId + warehouseId + qty + idempotencyKey + cartId? + actorId; `ReservationExtendRequestSchema`; `ReservationReleaseRequestSchema`; `ReservationResponseSchema`); adjustment-request.ts (`AdjustmentRequestSchema` — variantId + warehouseId + delta with both-signs allowed + reason from STOCK_LEDGER_REASONS + reasonNote required for negative); transfer-request.ts (`TransferRequestSchema` — fromWarehouseId + toWarehouseId + variantId + qty + reasonNote); low-stock-config.ts (`LowStockThresholdSchema` per (variantId, warehouseId) override; `DeadStockWindowSchema` 30-90 days; `ReorderPointSchema`); availability-query.ts (`AvailabilityQuerySchema` for the public batch read endpoint consumed by P7 product-service via the cross-module port — same shape as `StockReadPort.batchGet` so HTTP test fixtures double as port-contract tests); index.ts barrel re-exports all public schemas. Top-level packages/validators/src/index.ts adds `export * from './inventory/index.js';`.
    status: pending
  - id: events-inventory-schemas
    content: Populate packages/events/src/inventory/ empty shell with 8 v1 event files via `defineEvent()` — stock-ledger-appended.v1.ts ({ orgId, vendorId, warehouseId, variantId, ledgerEntryId, delta, reason, newOnHand }); low-stock-detected.v1.ts ({ orgId, vendorId, warehouseId, variantId, onHand, threshold, detectedAt }); dead-stock-detected.v1.ts ({ orgId, vendorId, warehouseId, variantId, onHand, daysSinceLastMovement, detectedAt }); reorder-needed.v1.ts ({ orgId, vendorId, warehouseId, variantId, onHand, reorderPoint, suggestedOrderQty, detectedAt }); transferred.v1.ts ({ orgId, vendorId, fromWarehouseId, toWarehouseId, variantId, qty, transferId, reasonNote }); reservation-created.v1.ts ({ orgId, vendorId, warehouseId, variantId, reservationId, qty, ttlSec, idempotencyKey, cartId? }); reservation-extended.v1.ts ({ orgId, vendorId, warehouseId, variantId, reservationId, newTtlSec, extensionCount }); reservation-expired.v1.ts ({ orgId, vendorId, warehouseId, variantId, reservationId, qty, idempotencyKey }). Index.ts barrel re-exports all 8 + the top-level packages/events/src/index.ts adds `export * from './inventory/index.js';`.
    status: pending
  - id: inventory-service-schemas
    content: services/inventory-service/src/schemas/ — stock-ledger.schema.ts (`inventory.stock_ledger` collection via `namespace('inventory','stock_ledger')` — variantId FK + warehouseId FK + orgId + vendorId + delta integer signed + reason enum from STOCK_LEDGER_REASONS + reasonNote nullable + actorId + relatedReservationId? + relatedTransferId? + relatedOrderId? + ledgerSeq monotonic counter scoped to (variantId, warehouseId) for snapshot rebuild ordering + ulid id via baseSchemaPlugin; append-only — no update/delete in the service layer); stock-snapshot.schema.ts (`inventory.stock_snapshots` — variantId + warehouseId + vendorId + orgId + onHand int ≥0 + reservedCount int ≥0 + lowStockThreshold int default 10 + reorderPoint int default 5 + reorderQty int default 50 + lastMovementAt date + pendingLedgerCount int default 0 + lastSnapshotLedgerSeq int + updatedAt; unique compound index on (variantId, warehouseId)); reservation.schema.ts OPTIONAL — `inventory.reservation_audit` append-only audit row written every time a reservation is created/extended/expired (Redis is the source of truth; this is the immutable trail for compliance + chargeback investigation; same orgId + vendorId + warehouseId + variantId + reservationId + qty + status + ttlExpiresAt + cartId? fields). transfer.schema.ts (`inventory.transfers` — transferId ulid + fromWarehouseId + toWarehouseId + variantId + qty + reasonNote + status PENDING|IN_TRANSIT|COMPLETED|CANCELLED + initiatedBy + initiatedAt + completedAt?). low-stock-config.schema.ts (`inventory.low_stock_config` per-(variantId, warehouseId) override — vendor-tunable; default values live on the snapshot when no override). All collections namespaced via @repo/database `namespace('inventory', ...)`.
    status: pending
  - id: inventory-service-services
    content: services/inventory-service/src/services/ — ledger.service.ts (append-only ledger entry insertion inside `withTransaction(connection, async session => { ... outbox.publish(StockLedgerAppendedV1.schema.parse(...), { session }) })`; emits `inventory.stock-ledger-appended.v1` for the snapshot updater + emits `inventory.low-stock-detected.v1` / `reorder-needed.v1` synchronously after-commit if the delta would cross the threshold per the snapshot; analytics `capture()` fires POST-commit per D11); snapshot-updater.service.ts (OnApplicationBootstrap subscribes to `inventory.stock-ledger-appended.v1` outbox events via `OutboxPort.subscribe()`; replays ledger entries in `ledgerSeq` order to rebuild the materialized snapshot row; tracks `pendingLedgerCount` so reads can detect lag and short-circuit to the ledger aggregate if lag > 5 entries — Q1 default async + pendingLedgerCount); reservation.service.ts (Redis-backed reserve/extend/release wrappers + ledger emission on every state change; idempotencyKey lookup via `SET NX EX` per the Redis SET docs; one-extension cap enforced via JSON value `{ qty, extensionCount, cartId, expiresAt }`); redis-reservation.service.ts (implements `ReservationPort` from @repo/utils — Upstash `@upstash/redis` client wrapping `SET key value NX EX 900` for reserve; `EXPIRE key 900 XX` for extend; `DEL key` for release; key shape `inv:reservation:{variantId}:{warehouseId}:{idempotencyKey}` per D9); in-memory-reservation.service.ts (Map<string, { value, expiresAt }>-backed fallback used when UPSTASH_REDIS_REST_URL is unset, e.g. local dev + CI; lossy + single-instance only — emits a warn log at bootstrap per Q2 default); reservation-sweeper.service.ts (`@Cron('*/60 * * * * *', { timeZone: 'Asia/Kolkata' })` per Q5 default — scans Redis for keys older than TTL and emits `inventory.reservation-expired.v1` for each + writes the corresponding reservation_audit row; idempotent via the idempotencyKey LRU dedup in the outbox); availability.service.ts (the cross-module read API consumed by P7 product-service via `RedisStockReadPort.batchGet` AND the public HTTP `POST /api/inventory/availability` endpoint — single implementation, both surfaces share the same Mongo aggregate against `inventory.stock_snapshots`); transfer.service.ts (admin-CLI-driven inter-warehouse transfer — atomic two-ledger-entry write inside `withTransaction(connection, session => { ledger.append(transferOut, -qty); ledger.append(transferIn, +qty); outbox.publish(transferred.v1, { session }) })`); adjustment.service.ts (vendor + admin per-warehouse stock adjustments writing a single ledger entry with reason ADJUSTMENT_INCREASE|ADJUSTMENT_DECREASE|COUNT_CORRECTION|DAMAGED_OUT|EXPIRED_OUT — vendor scope gated by `WarehouseOwnershipGuard`); reorder-detector.service.ts (`@Cron('0 0 9 * * *', { timeZone: 'Asia/Kolkata' })` daily 9 AM IST — scans `inventory.stock_snapshots` for `onHand < reorderPoint` rows + emits `inventory.reorder-needed.v1` for each; idempotent — the dedup LRU in the outbox prevents repeated emission within the cache window); dead-stock-detector.service.ts (`@Cron('0 0 10 * * *', { timeZone: 'Asia/Kolkata' })` daily 10 AM IST — scans `inventory.stock_snapshots` for `lastMovementAt < now - deadStockWindow` rows + emits `inventory.dead-stock-detected.v1` for each); analytics.helper.ts (`NO_OP_ANALYTICS` + capture wrappers mirroring the P6 vendor-service + P7 product-service patterns).
    status: pending
  - id: inventory-service-controllers
    content: services/inventory-service/src/controllers/ — availability.controller.ts (`POST /api/inventory/availability` GET-equivalent batch read endpoint — public, consumes `BatchAvailabilityQuerySchema` with up to 200 variantIds per request, returns `Map<variantId, StockSnapshot[]>` indexed by warehouseId for per-warehouse availability — primary HTTP fallback when consumers don't have the in-process port; per-IP rate-limited via P4 ratelimit guard when UPSTASH_REDIS_REST_URL is set); ledger.controller.ts (`GET /api/inventory/ledger?variantId&warehouseId&since&until&page&limit` paginated ledger read; gated by `WarehouseOwnershipGuard` if `warehouseId` provided OR `@RequireRole('admin')` for cross-warehouse queries); reservation.controller.ts (`POST /api/inventory/reservations` create with idempotencyKey header de-dup per `Idempotency-Key` Stripe docs; `POST /api/inventory/reservations/:id/extend`; `DELETE /api/inventory/reservations/:id`; `GET /api/inventory/reservations/:id`; all gated by `@RequireRole('admin'|'warehouse-manager')` AND `WarehouseOwnershipGuard` for non-admin); adjustment.controller.ts (`POST /api/inventory/adjustments` — vendor + admin per-warehouse adjust; consumes `AdjustmentRequestSchema`; gated by `WarehouseOwnershipGuard` OR `@RequireRole('admin')`); transfer.controller.ts (`POST /api/inventory/transfers` — admin-only at MVP per D6; `GET /api/inventory/transfers?vendorId&fromWarehouseId&toWarehouseId&status` admin list); low-stock-config.controller.ts (`GET /api/inventory/low-stock-config?variantId&warehouseId` + `PUT /api/inventory/low-stock-config` — vendor-tunable per (variantId, warehouseId) with `WarehouseOwnershipGuard`). Every controller class uses `createZodDto` for request/response per .cursor/rules/api-type-safety.mdc; discriminated-union request bodies parsed manually per the P6 lesson #2.
    status: pending
  - id: inventory-service-cli
    content: services/inventory-service/src/cli/inventory-transfer.cli.ts NEW + a root-level `pnpm inventory:transfer` script in apps/api-gateway/package.json (wraps `node --import tsx services/inventory-service/src/cli/inventory-transfer.cli.ts --from <warehouseId> --to <warehouseId> --variant <variantId> --qty <n> --reason <text>`). The CLI bootstraps a standalone NestJS application context (`NestFactory.createApplicationContext(AppModule)`) so it shares the same DI + Mongo connection + outbox provider as the running gateway — admin runs this against the production Atlas cluster from their workstation with `MONGODB_URI=mongodb+srv://...` set. Logs the resulting `transferId` + emitted `inventory.transferred.v1` event id + exits 0 on success, 1 on validation failure or transfer error. Per D6 — admin-CLI-driven only; no UI in P8.
    status: pending
  - id: inventory-service-decorators
    content: services/inventory-service/src/decorators/ — warehouse-ownership.guard.ts (resolves `:warehouseId` param → loads warehouse via cross-service `WarehouseService.getById()` from `@lotusgift/vendor-service` (P6 public-surface cross-service read — legal per modular-monolith deployment-mode + the P7 D13 precedent) → asserts `warehouse.vendorId === vendor.id` where `vendor.orgId === session.activeOrganizationId` OR session has `admin` role — throws RFC 9457 `AUTH_FORBIDDEN` ProblemDetails on mismatch; re-uses P6 `VendorOwnershipGuard` pattern). Re-export `RequireRole` + `RoleGuard` from vendor-service via the decorators barrel for ergonomic import. session.types.ts (local `SessionPayload` + `@Session()` + `@CurrentUser()` decorators mirroring vendor-service/session.types.ts + product-service/session.types.ts to avoid cross-service direct import per microservice-boundaries rule). decorators/index.ts barrel.
    status: pending
  - id: inventory-service-module
    content: services/inventory-service/src/inventory-service.module.ts — `forRoot(env: Env): DynamicModule` imports `MongooseModule.forFeature` for all 5 schemas + `VendorServiceModule.forRoot(env)` (cross-service module import — same pattern P7 ProductServiceModule used for `VendorService` cross-service read; legal per parent plan §4 modular-monolith + .cursor/rules/microservice-boundaries.mdc) + `ScheduleModule.forRoot()` from `@nestjs/schedule` (first introduction at L4 — cite #6 in the research note); registers all 11 services + 6 controllers + WarehouseOwnershipGuard + RoleGuard; declares the `RESERVATION_PORT` provider — `{ provide: RESERVATION_PORT, useFactory: (env: Env) => env.UPSTASH_REDIS_REST_URL ? new RedisReservationService(env) : new InMemoryReservationService() }` (gates on UPSTASH_REDIS_REST_URL per Q2 default + free-tier-budget rule + P4 D2 precedent); declares the `STOCK_READ_PORT` provider override `{ provide: STOCK_READ_PORT, useClass: RedisStockReadPort }` (overrides the gateway's P7 `useClass: StubStockReadPort` — the module's provider wins because it's in the more-specific DI scope per Nest fundamentals); wires the snapshot-updater + reservation-sweeper + reorder-detector + dead-stock-detector OnApplicationBootstrap subscriptions; exports `AvailabilityService` + `LedgerService` + `ReservationService` + `TransferService` + RESERVATION_PORT for downstream consumers (P9 order-saga). Index.ts barrel re-exports `InventoryServiceModule` + the 8 v1 event types + the guards + service tokens + `RedisStockReadPort` + `RedisReservationService`.
    status: pending
  - id: api-gateway-wiring
    content: apps/api-gateway/src/app.module.ts — import + register `InventoryServiceModule.forRoot(env)` AFTER the existing `ProductServiceModule.forRoot(env)` entry (P9 order-service registration will go after this). REMOVE the P7 `{ provide: STOCK_READ_PORT, useClass: StubStockReadPort }` provider line at the gateway level — the binding now lives inside `InventoryServiceModule` (the consuming code in `ProductService` is unchanged; the swap is transparent per the StockReadPort contract). Or — alternative wire — keep the gateway provider line but flip `useClass: StubStockReadPort → useClass: RedisStockReadPort`, and import `RedisStockReadPort` from `@lotusgift/inventory-service` directly. Sub-plan defaults to the in-module binding (cleaner ownership; the gateway only knows about the InventoryServiceModule). apps/api-gateway/package.json — add `@lotusgift/inventory-service: workspace:*`. apps/api-gateway/Dockerfile — add `services/inventory-service/package.json` to deps stage COPY block (alphabetical position) + `services/inventory-service` directory copy in build stage (same PR-13/14/15/16/17 pattern).
    status: pending
  - id: env-redis-inventory
    content: .env.example — append `INVENTORY_RESERVATION_TTL_SECONDS` (default 900 = 15min) + `INVENTORY_DEAD_STOCK_WINDOW_DAYS` (default 60) + `INVENTORY_DEFAULT_REORDER_POINT` (default 5) + `INVENTORY_DEFAULT_REORDER_QTY` (default 50) + `INVENTORY_DEFAULT_LOW_STOCK_THRESHOLD` (default 10) + `INVENTORY_RESERVATION_SWEEPER_INTERVAL_SECONDS` (default 60) + `INVENTORY_BATCH_AVAILABILITY_MAX_VARIANTS` (default 200) under a new `# ---- Inventory service (P8) ----` header. packages/config/src/env.schema.ts — add 7 optional entries with sensible defaults. NOTE: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` already exist in env.schema.ts from P4 — no schema change needed; the new production-superRefine adds a soft warning (NOT a hard fail) when both env vars are unset in production because the in-memory fallback IS supported in production at the cost of multi-instance reservation drift (Q2 default).
    status: pending
  - id: cross-service-contracts-update
    content: docs/architecture/cross-service-contracts.md UPDATE — under §"Active ports" add a new subsection `### ReservationPort — P8 (PR-18) — produced by P8 inventory-service` documenting the new interface + DI token + stub + real impl. Move the `StockReadPort` row's "Real impl ships in" cell from "**P8 inventory-service** — ... at P8" to "**P8 inventory-service** — `RedisStockReadPort` (Redis SUNION + Mongo aggregate); the gateway binding flipped at PR-18 from `useClass: StubStockReadPort → useClass: RedisStockReadPort` via the in-module binding in InventoryServiceModule." Also remove the `ReservationPort` entry from §"Upcoming ports" (now live) and add a new `### LedgerReadPort` upcoming entry if P9 order-saga needs to read append-only ledger entries (TBD with P9 sub-planning). Update README pointers.
    status: pending
  - id: free-tier-budget-rule-update
    content: .cursor/rules/free-tier-budget.mdc UPDATE — bump the Upstash Redis line item from "10k cmds/day" to "500K commands/month (≈16k/day average); per-second peak 10k cmds; 256 MB data; 1 database; 10 GB monthly bandwidth (retrieved 2026-05-16 per https://upstash.com/docs/redis/overall/pricing)". Per the Free-Tier Budget rule, every dependency line that ages past 14 days must be re-fetched; the Upstash row now ties to the PR-18 introduction of reservations as the first non-trivial Redis consumer. Update the rule's `## Concrete example` block to include the Upstash row with the 2026-05-16 retrieval date.
    status: pending
  - id: analytics-instrumentation-p8
    content: Wire `@repo/analytics-sdk/server.capture()` calls inside ledger.service + reservation.service + transfer.service + adjustment.service + reorder-detector + dead-stock-detector AFTER the outbox transaction commits per D11. PostHog event names per the analytics-instrumentation rule "object verb" convention: `inventory stock_decremented` (ledger entry with negative delta) / `inventory stock_incremented` / `inventory reservation_created` / `inventory reservation_extended` / `inventory reservation_expired` / `inventory reservation_consumed` / `inventory transferred` / `inventory low_stock_detected` / `inventory dead_stock_detected` / `inventory reorder_needed` / `inventory adjustment_recorded`. PII auto-redacted via the SDK built-in `@repo/utils.redact` — only `org_id` / `vendor_id` / `warehouse_id` / `variant_id` / `delta_sign` / `reason` shapes ship (NO actor names; NO reasonNote text).
    status: pending
  - id: tests-p8
    content: ≥28 individual tests across 11 spec files (Tier-1 coverage target — ≥85% lines / ≥80% branches per .cursor/rules/test-coverage.mdc). services/inventory-service/src/services/ledger.service.spec.ts (append + emit happy path + saga happy path — append + snapshot updater materializes correctly via in-memory outbox stub; saga unhappy path — outbox.publish throws → withTransaction rolls back → no ledger row written + no snapshot delta; ledgerSeq monotonicity); services/inventory-service/src/services/snapshot-updater.service.spec.ts (rebuild on stock-ledger-appended.v1 + idempotent re-replay + pendingLedgerCount tracking + missing snapshot row auto-create); services/inventory-service/src/services/reservation.service.spec.ts (reserve idempotencyKey dedup + extend one-time cap + release happy path + saga happy + unhappy — reserve + payment commit → consume; reserve + payment timeout → sweeper expires → emit reservation-expired.v1; SET NX EX collision returns existing reservation per Redis docs); services/inventory-service/src/services/redis-reservation.service.spec.ts (Upstash client stub — SET NX EX call shape + EXPIRE XX call shape + DEL call shape; in-memory fallback covered separately); services/inventory-service/src/services/in-memory-reservation.service.spec.ts (Map TTL eviction + extension cap + single-instance loss simulation); services/inventory-service/src/services/reservation-sweeper.service.spec.ts (60s cron tick scans Redis → emits expired event per stale key + writes reservation_audit row + idempotent dedup via outbox LRU); services/inventory-service/src/services/availability.service.spec.ts (batch read 200-variant cap + aggregate output shape matches StockReadPort.batchGet contract + missing variantId default-zero); services/inventory-service/src/services/transfer.service.spec.ts (atomic two-ledger-entry write inside withTransaction + transferred.v1 emit; rollback on partial failure); services/inventory-service/src/services/reorder-detector.service.spec.ts (snapshot scan triggers reorder-needed.v1 per matching row + idempotent re-run within dedup window); services/inventory-service/src/services/dead-stock-detector.service.spec.ts (snapshot scan triggers dead-stock-detected.v1 per matching row + threshold from env); services/inventory-service/src/decorators/warehouse-ownership.guard.spec.ts (orgId match via VendorService stub + admin bypass + 403 mismatch). packages/utils/src/redis-stock-read-port.test.ts (the @repo/utils tests cover the L2 surface — batchGet via Mongo aggregate stub + stale-snapshot ledger fallback). packages/utils/src/reservation-port.test.ts (stub semantics). Convention — .spec.ts extension; no @jest/globals imports (ts-jest auto-injects); stub Mongo connection via the `fakeConnection` pattern from vendor-service tests; stub Upstash Redis via in-process Map per the @upstash/redis test guide.
    status: pending
  - id: dockerfile
    content: apps/api-gateway/Dockerfile — add `services/inventory-service/package.json` to deps stage COPY block (alphabetical: BETWEEN `auth-service` and `product-service`) + `services/inventory-service` full directory COPY in build stage. Same pattern PR-13/14/15/16/17 used for workspace package additions.
    status: pending
  - id: local-smoke-p8
    content: Full local pipeline — `pnpm install --no-frozen-lockfile` + `pnpm install --frozen-lockfile` (lockfile sync verify) + `pnpm check-types` (expect ~36/36 after the inventory-service deps update — was 35 post-P7) + `pnpm lint` (~39/39) + `pnpm test` (~20-22/20-22 turbo tasks — the +1-2 are the inventory-service suites + the new @repo/utils RedisStockReadPort + ReservationPort tests) + `pnpm build` (~11/11) + `pnpm dep-cruiser` (0 errors — services/inventory-service may NOT import services/order-service or services/product-service directly; cross-service VendorService import legal per modular-monolith) + `pnpm dlx markdownlint-cli2 docs/research/phase-8-inventory-service.md services/inventory-service/README.md .cursor/plans/p8_*.md docs/architecture/cross-service-contracts.md .cursor/rules/free-tier-budget.mdc` (0 errors). Manually test the CLI in dev — `pnpm inventory:transfer --from <warehouseId> --to <warehouseId> --variant <variantId> --qty 5 --reason "test"`; verify `transferId` returned + `inventory.transferred.v1` row in `outbox.events` collection.
    status: pending
  - id: commit-push-pr-18
    content: Single `feat(inventory)` commit + branch push + `gh pr create` PR-18 with HEREDOC body summarizing scope/changes/tests/CI/decisions baked. PR title — `feat(inventory): wire inventory-service module — event-sourced stock ledger + Redis TTL reservations + RedisStockReadPort impl + cron-driven low-stock/dead-stock/reorder feeds`.
    status: pending
  - id: ci-poll
    content: `gh pr checks 18` — poll the 16 required checks (build-push is the longest ~5-10min for the multi-arch image). Use `AwaitShell` with 300-540s blocks per the P6/P7 cadence. Re-poll after each Copilot fix commit.
    status: pending
  - id: copilot-review
    content: `gh pr edit 18 --add-reviewer copilot-pull-request-reviewer`; address every Copilot comment + re-poll CI. Expected themes — withTransaction + session usage; per-endpoint WarehouseOwnershipGuard wiring on every vendor-scoped endpoint; createZodDto on every POST/PUT body; @nestjs/schedule cron expression timezone explicit; analytics POST-commit + redactor coverage of new event fields; @upstash/redis client timeout; in-memory fallback hard-warn at bootstrap; reservation-sweeper idempotency-key collision; reorder-detector + dead-stock-detector dedup window.
    status: pending
  - id: admin-squash-merge
    content: `gh pr merge 18 --squash --admin --subject 'feat(inventory): wire inventory-service module — event-sourced stock ledger + Redis reservations + RedisStockReadPort impl + low-stock cron feeds' --body via Set-Content tmpfile`. Update parent plan p8 todo content with squash SHA + 1-paragraph delivery summary + `status: completed` in a follow-up commit.
    status: pending
  - id: status-sync-pr18
    content: Close Phase 8 Epic + Phase-Acceptance issues, close Phase 8 milestone, flip parent plan p8 → completed, backfill phase-8 research note §6, sync project board (Status=Done / Phase=P8 / Workstream=inventory / Layer=L4 / Type=feat), delete branch local + remote.
    status: pending
isProject: false
---

# Sub-plan: P8 — services/inventory-service (PR-18)

The sub-plan that **drafts P8**, ready for execution. Scope-decisions captured in the Decisions baked section (D1–D14); open questions Q1–Q6 baked to the defaults per user instruction (D20–D25). Mirrors the PR-13/PR-14/PR-15/PR-16/PR-17 cadence — single `feat(inventory)` commit, Copilot iteration, admin squash merge.

P8 execution is **gated on P7/PR-17 merging to main**. PR-17 ships the `StockReadPort` interface + `StubStockReadPort` binding; P8 replaces the stub with `RedisStockReadPort` + adds the real inventory module. Do not start execution until that merge lands — the diff will not apply cleanly otherwise.

## 0. North-star statement

**LotusGift v2's inventory backbone is an event-sourced per-(variantId, warehouseId) stock ledger + a materialized snapshot for hot reads + Redis-backed TTL reservations for in-flight orders.** Every state change is an append to `inventory.stock_ledger` inside the same Mongo transaction as an `inventory.*.v1` outbox event. The materialized `inventory.stock_snapshots` collection is an eventually-consistent projection rebuilt by a `snapshot-updater` outbox subscriber; reads go through it for hot-path availability lookups (PDP, PLP, cart). The Redis layer carries only TTL'd reservation state — no per-request session cache, no rate-limit (P4 owns that), no idempotency key beyond the reservation key — keeping us well inside the Upstash free tier (500K commands/month, retrieved 2026-05-16).

## 1. Scope (in / out)

### In scope (PR-18)

- @repo/types extension: `packages/types/src/inventory.ts` (STOCK_LEDGER_REASONS + RESERVATION_STATUS_KEYS + branded ReservationId + LedgerEntryId + TTL/extension constants)
- @repo/validators/inventory populate: ~10 files (ledger-row + snapshot-row + reservation-request + adjustment-request + transfer-request + low-stock-config + availability-query + barrel)
- @repo/events/inventory populate: 8 v1 events (stock-ledger-appended + low-stock-detected + dead-stock-detected + reorder-needed + transferred + reservation-created + reservation-extended + reservation-expired)
- @repo/utils extension: `ReservationPort` interface + `RESERVATION_PORT` token + `StubReservationPort` class + `RedisStockReadPort` class (the real impl behind the existing P7 `StockReadPort` interface)
- services/inventory-service end-to-end: 5 Mongoose schemas + 11 services + 6 controllers + 1 CLI script + WarehouseOwnershipGuard + module + barrel + tests + Dockerfile updates + analytics + env entries
- apps/api-gateway wiring: `InventoryServiceModule.forRoot(env)` + STOCK_READ_PORT binding flip + RESERVATION_PORT new binding + Dockerfile workspace COPY additions
- docs/architecture/cross-service-contracts.md UPDATE: move StockReadPort row's "Real impl ships in" cell to PR-18; add ReservationPort row to §Active ports; remove the upcoming row
- .cursor/rules/free-tier-budget.mdc UPDATE: refresh Upstash Redis line with 2026-05-16-retrieved current quota (500K/month, not 10k/day)
- Research note + sub-plan (this file)
- 1 root `pnpm inventory:transfer` script wired to the new CLI

### Out of scope (parked)

- Order-saga consumer that calls `ReservationPort.reserve()` at cart checkout — P9 order-service
- Negative-stock allowance / backorder mode — Q4 default hard-reject in MVP; gate behind per-product `allowBackorder` flag in P9
- Per-vendor configurable reservation TTL — single env-default at MVP; per-vendor override parked to P14 promotions-service
- Inter-warehouse transfer UI (web-vendor) — P17
- Insights / forecasting consumers of dead-stock / reorder events — P15 insights-service
- HSN-rate live API for the value-of-stock-on-hand insight — P13 tax-service
- Field-level encryption of reservation rows (cartId, idempotencyKey are not PII but defense-in-depth) — P21 observability hardening
- Razorpay live keys for the auth-vs-capture decrement-timing experiment — P10 payment-service (D11 lesson noted)

## 2. File-by-file deliverables (~30-40 files)

### `@repo/types` extensions

- `packages/types/src/inventory.ts` — 14-key `STOCK_LEDGER_REASONS` + 5-key `RESERVATION_STATUS_KEYS` + branded `ReservationId` + branded `LedgerEntryId` + `DEFAULT_RESERVATION_TTL_SEC = 900` + `RESERVATION_TTL_MAX_EXTENSIONS = 1` constants.
- `packages/types/src/index.ts` — barrel re-export the new public types.

### `@repo/validators/src/inventory/`

- `ledger-row.ts` — `LedgerEntryRequestSchema` + `LedgerEntryResponseSchema` + `LedgerListQuerySchema`.
- `snapshot-row.ts` — `StockSnapshotSchema` + `BatchAvailabilityQuerySchema`.
- `reservation-request.ts` — `ReservationCreateRequestSchema` + `ReservationExtendRequestSchema` + `ReservationReleaseRequestSchema` + `ReservationResponseSchema`.
- `adjustment-request.ts` — `AdjustmentRequestSchema`.
- `transfer-request.ts` — `TransferRequestSchema`.
- `low-stock-config.ts` — `LowStockThresholdSchema` + `DeadStockWindowSchema` + `ReorderPointSchema`.
- `availability-query.ts` — `AvailabilityQuerySchema` + `AvailabilityResponseSchema` mirroring `StockReadPort.batchGet` contract.
- `index.ts` — barrel.
- Top-level `packages/validators/src/index.ts` — add `export * from './inventory/index.js';`.

### `@repo/events/src/inventory/`

- `stock-ledger-appended.v1.ts` — `InventoryStockLedgerAppendedV1` defineEvent.
- `low-stock-detected.v1.ts` — `InventoryLowStockDetectedV1` defineEvent.
- `dead-stock-detected.v1.ts` — `InventoryDeadStockDetectedV1` defineEvent.
- `reorder-needed.v1.ts` — `InventoryReorderNeededV1` defineEvent.
- `transferred.v1.ts` — `InventoryTransferredV1` defineEvent.
- `reservation-created.v1.ts` — `InventoryReservationCreatedV1` defineEvent.
- `reservation-extended.v1.ts` — `InventoryReservationExtendedV1` defineEvent.
- `reservation-expired.v1.ts` — `InventoryReservationExpiredV1` defineEvent.
- `index.ts` — barrel re-export the 8 events.
- Top-level `packages/events/src/index.ts` — add `export * from './inventory/index.js';`.

### `@repo/utils` extension

- `packages/utils/src/reservation-port.ts` NEW — `ReservationPort` interface + `RESERVATION_PORT` token + `StubReservationPort` class.
- `packages/utils/src/redis-stock-read-port.ts` NEW — `RedisStockReadPort` class implementing the existing `StockReadPort` interface (introduced at P7 D12).
- `packages/utils/src/reservation-port.test.ts` + `redis-stock-read-port.test.ts` — both with stubbed Mongo connection + in-process Map for Upstash Redis stub.
- `packages/utils/src/index.ts` — re-export the 3+1 new public names + the `RedisStockReadPort` class.

### `services/inventory-service/src/`

- `schemas/stock-ledger.schema.ts` — append-only `inventory.stock_ledger`.
- `schemas/stock-snapshot.schema.ts` — `inventory.stock_snapshots` (unique on (variantId, warehouseId)).
- `schemas/reservation.schema.ts` — `inventory.reservation_audit` append-only (Redis is the source of truth; this is the immutable trail).
- `schemas/transfer.schema.ts` — `inventory.transfers`.
- `schemas/low-stock-config.schema.ts` — `inventory.low_stock_config`.
- `schemas/index.ts` — barrel.
- `services/ledger.service.ts` — append + emit `stock-ledger-appended.v1` inside `withTransaction`.
- `services/snapshot-updater.service.ts` — outbox subscriber that rebuilds the materialized snapshot.
- `services/reservation.service.ts` — orchestrates reserve / extend / release through `ReservationPort` + writes reservation_audit + emits reservation events.
- `services/redis-reservation.service.ts` — implements `ReservationPort` against Upstash Redis.
- `services/in-memory-reservation.service.ts` — dev fallback impl of `ReservationPort` (Map-backed; lossy single-instance).
- `services/reservation-sweeper.service.ts` — `@Cron('*/60 * * * * *')` expiry sweeper.
- `services/availability.service.ts` — single impl shared by HTTP controller + `RedisStockReadPort.batchGet`.
- `services/transfer.service.ts` — atomic two-ledger-entry transfer inside `withTransaction`.
- `services/adjustment.service.ts` — vendor + admin per-warehouse adjustments.
- `services/reorder-detector.service.ts` — daily 9 AM IST cron emits `reorder-needed.v1`.
- `services/dead-stock-detector.service.ts` — daily 10 AM IST cron emits `dead-stock-detected.v1`.
- `services/analytics.helper.ts` — `NO_OP_ANALYTICS` + capture wrappers.
- `services/index.ts` — barrel.
- `controllers/availability.controller.ts` — `POST /api/inventory/availability`.
- `controllers/ledger.controller.ts` — `GET /api/inventory/ledger`.
- `controllers/reservation.controller.ts` — `POST/GET/DELETE /api/inventory/reservations`.
- `controllers/adjustment.controller.ts` — `POST /api/inventory/adjustments`.
- `controllers/transfer.controller.ts` — `POST /api/inventory/transfers` admin-only + admin list.
- `controllers/low-stock-config.controller.ts` — vendor-tunable per-(variantId, warehouseId) override.
- `controllers/mappers/ledger-response.mapper.ts` + `snapshot-response.mapper.ts` + `reservation-response.mapper.ts`.
- `controllers/index.ts` — barrel.
- `decorators/warehouse-ownership.guard.ts` — orgId match OR admin.
- `decorators/index.ts` — barrel + re-exports `RoleGuard` + `RequireRole` from vendor-service for ergonomic local import.
- `cli/inventory-transfer.cli.ts` — admin-CLI transfer wrapper.
- `session.types.ts` — local `SessionPayload` + decorators mirroring vendor-service + product-service.
- `inventory-service.tokens.ts` — `ENV_TOKEN` + `ANALYTICS_TOKEN` + re-exports `RESERVATION_PORT` + `STOCK_READ_PORT` from @repo/utils.
- `inventory-service.module.ts` — `MongooseModule.forFeature` for all 5 schemas + `VendorServiceModule.forRoot(env)` import + `ScheduleModule.forRoot()` + all 11 services + 6 controllers + 1 guard + RESERVATION_PORT factory provider + STOCK_READ_PORT override; OnApplicationBootstrap wires snapshot-updater + reservation-sweeper + reorder-detector + dead-stock-detector subscriptions; OnApplicationShutdown drains analytics + closes Redis client.
- `index.ts` — barrel re-exports `InventoryServiceModule` + the 8 v1 event types + the guards + service tokens + `RedisStockReadPort` + `RedisReservationService`.
- `package.json` — Nest framework + mongoose as `peerDependencies`; @nestjs/mongoose 11 + @nestjs/schedule 6 + @upstash/redis 1 + lru-cache 11 + nestjs-zod 5.3 + zod 4.4 as direct deps; workspace deps for @repo/* + @lotusgift/vendor-service.
- `tsconfig.json` — extends `@repo/typescript-config/library.json` with `useDefineForClassFields: false` + `experimentalDecorators: true` + `emitDecoratorMetadata: true`.
- `jest.config.ts` — `export default nestConfig;` from `@repo/jest-config`.
- `eslint.config.mjs` — extends `@repo/eslint-config/library`.
- `README.md` — module purpose + ledger + snapshot diagram + reservation TTL flow + cron schedule table + cross-service consumer table.

### `apps/api-gateway/src/`

- `app.module.ts` — import + register `InventoryServiceModule.forRoot(env)` after `ProductServiceModule.forRoot(env)`. Remove the P7 `{ provide: STOCK_READ_PORT, useClass: StubStockReadPort }` provider line (the binding now lives inside InventoryServiceModule).
- `package.json` — add `@lotusgift/inventory-service: workspace:*` + a new `inventory:transfer` script (`tsx services/inventory-service/src/cli/inventory-transfer.cli.ts`).
- `Dockerfile` — add `services/inventory-service/package.json` to deps stage COPY + `services/inventory-service` directory to build stage.

### `packages/config/src/env.schema.ts`

- Add 7 optional inventory-service env vars + a soft-warn (NOT a hard fail) production superRefine entry when both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are unset.

### `.env.example`

- Append the 7 new entries under a `# ---- Inventory service (P8) ----` comment header.

### `docs/architecture/cross-service-contracts.md`

- UPDATE — move StockReadPort row's "Real impl ships in" cell; add ReservationPort row to §Active ports; remove the matching row from §Upcoming ports.

### `.cursor/rules/free-tier-budget.mdc`

- UPDATE — bump Upstash Redis line item to the 2026-05-16-retrieved current quota (500K commands/month; per-second peak 10k cmds; 256 MB data; 1 db; 10 GB monthly bandwidth).

### `docs/research/phase-8-inventory-service.md`

- NEW — ≥12 retrieval-dated 2026-05-16 citations + ≥12 decisions + ≥4 open questions + implementation checklist + §6 placeholder (backfilled post-merge).

### GitHub

- Phase 8 milestone (`gh api -X POST repos/goldr0g3r/lotusgift/milestones -f title="Phase 8 - Inventory Service" -f description="..."` — does NOT currently exist; phase/P8 label DOES exist from p0-issues seed).
- Phase 8 Epic issue (`phase/P8,area/infra,epic` labels) under that milestone.
- Phase 8 Phase-Acceptance issue (`phase/P8,phase-acceptance` labels) under that milestone.

## 3. Architecture decisions (14 D-decisions)

### D1 — Single PR-18

One `feat(inventory)` commit covers @repo/types extension + @repo/validators/inventory populate + @repo/events/inventory populate + @repo/utils 2 new files (ReservationPort + RedisStockReadPort) + services/inventory-service end-to-end + api-gateway wiring + cross-service-contracts doc update + free-tier-budget rule update + research note + CLI script. Mirrors PR-13/14/15/16/17 cadence — single squash, Copilot iteration in follow-up commits.

- **Context:** PR-17 ships the StockReadPort interface; the marketplace cannot show real stock until P8 fills in the impl. Splitting reservations + ledger + snapshot + cron feeds across multiple PRs would force the gateway to live with a stub for weeks.
- **Options considered:** Multi-PR (ledger + snapshots in PR-18a, reservations in PR-18b, cron feeds in PR-18c) vs single-PR.
- **Chosen:** Single PR-18.
- **Why:** Same cadence-discipline argument that drove P6 + P7 — the inventory module is one coherent unit; partial deliveries leave the StockReadPort stub bound + the system in a half-real state.
- **Citation:** Research note citation #1 + #2 (MongoDB transactions docs + Mongoose withTransaction).

### D2 — Stock ledger model (event-sourced + materialized snapshot)

Append-only `inventory.stock_ledger` entries with `delta` + `reason` + `actorId` + `ledgerSeq` monotonic-per-(variantId, warehouseId) + ulid id. The materialized `inventory.stock_snapshots` collection is rebuilt asynchronously by an outbox subscriber on every ledger append (`snapshot-updater.service.ts` subscribes to `inventory.stock-ledger-appended.v1`).

- **Context:** Hot-path reads need a single fast lookup; cold-path reconciliation + audit needs full history.
- **Options considered:** Snapshot-only (single doc per (variantId, warehouseId) updated atomically) vs event-sourced ledger + materialized snapshot vs event-sourced ledger only (compute on every read).
- **Chosen:** Event-sourced ledger + async materialized snapshot.
- **Why:** Snapshot-only loses the audit trail (every adjustment / damage report / count correction needs a history-of-changes for compliance + chargeback investigation); ledger-only blows up read latency at PLP / PDP scale. Materialized-snapshot approach pairs the speed of snapshot-only reads with the auditability + replay-ability of event sourcing. The async rebuild is acceptable because `pendingLedgerCount` lets reads detect lag + fall back to ledger aggregate (Q1 default).
- **Citation:** Research note citation #10 (Martin Fowler — Event Sourcing) + #2 (Mongoose transactions for the atomic ledger + outbox write).

### D3 — Reservation model (Upstash Redis SET NX EX)

Redis `SET key value NX EX 900` with key `inv:reservation:{variantId}:{warehouseId}:{idempotencyKey}` and TTL = 15 min. Reservation value is a JSON blob `{ qty, extensionCount, cartId?, actorId, createdAt }`. Extension uses `EXPIRE key 900 XX` (only updates existing key, not creating new) + checks the JSON's `extensionCount` against the `RESERVATION_TTL_MAX_EXTENSIONS = 1` cap (D12). Release uses `DEL key`.

- **Context:** In-flight cart → checkout → payment flow needs to hold stock for 15 min so two simultaneous buyers can't oversell the same warehouse.
- **Options considered:** Redis TTL (this); Mongo with TTL index (slow background expiry per the TTL docs — runs every 60s, no atomic NX-on-insert); Mongo with explicit expiry field + per-read filter (no atomic acquire).
- **Chosen:** Redis SET NX EX.
- **Why:** Redis `SET NX EX` is atomic-on-insert + the TTL eviction is automatic + reads-during-checkout are guaranteed-fresh. Mongo TTL is too slow (60s background sweeper per the Mongo TTL docs cite #11) + has no atomic NX-on-insert. Per `.cursor/rules/free-tier-budget.mdc`, Upstash free tier is 500K commands/month — well within budget at the expected reservation volume (≤500/day × 4 ops per reservation = 60K/month).
- **Citation:** Research note citation #4 (Redis SET command — NX EX options docs) + #5 (Upstash Redis free-tier quota) + #11 (Mongo TTL — explicit "may take up to 60 seconds" warning).

### D4 — Concurrency model (no optimistic locking)

The append-only ledger IS the atomic operation — Mongoose `findOneAndUpdate` with `$inc` is NOT used. Mongo's unique compound index on `(variantId, warehouseId)` for the snapshot + Redis `SET NX` for reservations together provide all the serialization we need.

- **Context:** Optimistic locking on the snapshot would require a `version` field + retry-on-conflict — adds latency + complexity.
- **Options considered:** Optimistic locking via `findOneAndUpdate` with version check; pessimistic locking via Mongo transactions; no locking + rely on ledger append + Redis NX.
- **Chosen:** No locking; ledger append + Redis NX serialize.
- **Why:** Two concurrent appends to the same `(variantId, warehouseId)` produce two ledger entries with adjacent `ledgerSeq` values — the snapshot updater applies them in order. Two concurrent reserve calls with the SAME idempotencyKey produce one Redis key (the second `SET NX` returns null + caller reads existing) — Stripe's idempotency-key pattern. Two concurrent reserve calls with DIFFERENT idempotencyKeys both succeed; the snapshot reflects the combined reservation count post-sweep.
- **Citation:** Research note citation #4 (Redis SET NX semantics) + #8 (Stripe Idempotent Requests).

### D5 — InventoryStockReadPort impl (snapshot-first + ledger-fallback)

`RedisStockReadPort.batchGet(variantIds)` aggregates `inventory.stock_snapshots` by `variantId` (sums `onHand - reservedCount` across all warehouses for each variant) — single Mongo aggregate per call. If a snapshot row's `pendingLedgerCount > 5` the impl falls back to a ledger aggregate for that (variantId, warehouseId) — protects against snapshot lag during burst-write windows.

- **Context:** Product-service PDP / PLP queries N variants at once; the port returns a Map<variantId, StockSnapshot>.
- **Options considered:** Always-snapshot (fast but lossy on lag) vs always-ledger-aggregate (slow but always-fresh) vs snapshot-with-ledger-fallback (this).
- **Chosen:** Snapshot-first with ledger fallback gated on `pendingLedgerCount`.
- **Why:** Best of both. Average case is one Mongo aggregate; worst case (lag detected) adds a ledger aggregate per affected variant — bounded by the 5-entry threshold.
- **Citation:** Research note citation #2 (Mongoose aggregations with session) + #14 (Mongo $group aggregation).

### D6 — Inter-warehouse transfer (admin-CLI-driven MVP)

Admin runs `pnpm inventory:transfer --from <warehouseId> --to <warehouseId> --variant <variantId> --qty <n> --reason <text>`. The CLI bootstraps a standalone Nest app context + writes two ledger entries atomically inside `withTransaction` + emits `inventory.transferred.v1`. NO UI in P8.

- **Context:** Inter-warehouse rebalancing is a low-frequency operation (1-2/week early-stage); building a UI now is premature.
- **Options considered:** Web-vendor UI (P17 scope); web-admin UI (P18 scope); admin-CLI; admin REST endpoint with no UI.
- **Chosen:** Admin-CLI.
- **Why:** Zero UI surface to design / test / deploy; admin has access to a workstation with `MONGODB_URI` set; the same CLI pattern works against staging + production; logs the transferId for traceability.
- **Citation:** Research note citation #6 (@nestjs/schedule docs — same standalone Nest context bootstrap pattern as cron jobs).

### D7 — Audit log (ledger entries ARE the audit log)

Every ledger entry IS an audit log entry. No separate `inventory.audit_log` collection. Per-vendor + per-warehouse filtering via Mongo `$match` on `vendorId` + `warehouseId`.

- **Context:** Compliance + chargeback investigation needs immutable history-of-changes per warehouse.
- **Options considered:** Separate audit-log collection (denormalize from ledger); ledger-as-audit-log (this).
- **Chosen:** Ledger-as-audit-log.
- **Why:** Avoids double-writes; ledger already has actorId + reason + reasonNote + timestamp + ulid id. Per-vendor filter via `vendorId` index. Reservation audit IS separate (`inventory.reservation_audit`) because Redis is the source of truth for live reservations — the audit row is the immutable trail of reservation lifecycle events that Redis can't durably persist.
- **Citation:** Research note citation #10 (Martin Fowler — Event Sourcing) — ledger-as-audit-log is a standard event-sourcing pattern.

### D8 — `@nestjs/schedule` adoption (first introduction at L4)

`ScheduleModule.forRoot()` inside `InventoryServiceModule.forRoot(env)` + `@Cron` decorators on the sweeper + reorder-detector + dead-stock-detector services. Cite `@nestjs/schedule` 6.1.3 docs in the research note + lock the version via `pnpm ls --depth=0 --filter @lotusgift/inventory-service`.

- **Context:** Need scheduled jobs for reservation expiry + low-stock / dead-stock / reorder detection. Modular-monolith deployment-mode means no separate worker process — crons run inside the api-gateway.
- **Options considered:** Node `setInterval` (manual lifecycle), `@nestjs/schedule` (declarative), node-cron raw (no Nest integration), separate worker process.
- **Chosen:** `@nestjs/schedule`.
- **Why:** First-class Nest support; integrates with `OnApplicationBootstrap` / `OnApplicationShutdown` lifecycles; declarative `@Cron(expression, { timeZone })` decorators; auto-wraps every handler in a try-catch so a single failure doesn't kill the scheduler.
- **Citation:** Research note citation #6 (@nestjs/schedule docs) + #7 (@nestjs/schedule npm 6.1.3).

### D9 — Reservation idempotency key (cart-scoped, header-provided)

Idempotency key MUST be cart-scoped (one cart = one key for the same (variantId, warehouseId, qty) — re-reserves return the existing reservation). Provided by P9 order-service in the `Idempotency-Key` header per the Stripe idempotency-key pattern (cite #8). Reservation Redis key shape: `inv:reservation:{variantId}:{warehouseId}:{idempotencyKey}`.

- **Context:** Cart checkout flow may retry the reserve call (network blip, double-click); we must not over-reserve.
- **Options considered:** Server-generated reservationId (no client idempotency); cart-scoped idempotency key from client (this); per-request idempotency key from gateway (collides with the cart-scope).
- **Chosen:** Cart-scoped idempotency key.
- **Why:** Stripe pattern — well-established + matches consumer expectations; cart-scope (rather than per-request) lets us de-dup retries across the cart's lifetime.
- **Citation:** Research note citation #8 (Stripe Idempotent Requests) + #9 (AWS Builders Library — Making Retries Safe with Idempotent APIs).

### D10 — Cross-service authorization (WarehouseOwnershipGuard mirrors VendorOwnershipGuard)

Inventory writes (ledger appends, transfers, adjustments, reservations) require `@RequireRole('admin'|'warehouse-manager')` AND `WarehouseOwnershipGuard`. The guard resolves `:warehouseId` → `warehouse.vendorId` → `vendor.orgId === session.activeOrganizationId` via `WarehouseService.getById()` cross-service read from `@lotusgift/vendor-service` (legal per P7 D13 + modular-monolith deployment-mode). Cross-service READ via the in-process `RedisStockReadPort` is unauthenticated at the port level — the caller (e.g. product-service) is responsible for its own upstream auth.

- **Context:** Vendor A must NOT be able to read/write Vendor B's warehouse stock.
- **Options considered:** Per-controller manual guard (duplicate code); centralized `WarehouseOwnershipGuard` (this); cross-service Better-Auth org-membership lookup at every endpoint.
- **Chosen:** Centralized `WarehouseOwnershipGuard` mirroring P6 `VendorOwnershipGuard`.
- **Why:** Single point of change; admin role bypasses; same pattern P6 + P7 established for VendorOwnershipGuard + ProductOwnershipGuard.
- **Citation:** Research note citation #13 (nestjs-zod 5.3 + the `createZodDto` pattern) + the P6 + P7 sub-plan precedent.

### D11 — Outbox + analytics ordering (post-commit only)

Analytics `capture()` fires AFTER `withTransaction` commits — NEVER inside the transaction. PostHog event names per `.cursor/rules/analytics-instrumentation.mdc`: `inventory stock_decremented`, `inventory stock_incremented`, `inventory reservation_created`, `inventory reservation_extended`, `inventory reservation_expired`, `inventory reservation_consumed`, `inventory transferred`, `inventory low_stock_detected`, `inventory dead_stock_detected`, `inventory reorder_needed`, `inventory adjustment_recorded`.

- **Context:** Failed Mongo transaction must NEVER ghost-emit a PostHog event.
- **Options considered:** Analytics-inside-tx (ghost-emit risk); analytics-post-commit (this); per-event outbox-consumer-driven analytics (over-engineered for MVP).
- **Chosen:** Analytics-post-commit.
- **Why:** Same lesson P6 enforced (D18) — keep the discipline.
- **Citation:** Research note citation #2 (Mongoose transactions — withTransaction commit/abort semantics) + `.cursor/rules/event-driven-discipline.mdc` + `.cursor/rules/analytics-instrumentation.mdc`.

### D12 — Reservation TTL extension (one-time only)

Only ONE extension per reservation allowed. Tracked via `extensionCount: number` in the Redis value JSON; subsequent `EXPIRE key XX` calls succeed at Redis level but the service-layer rejects the second extension with a `RESERVATION_ALREADY_EXTENDED` ProblemDetails.

- **Context:** Cart → payment-auth → payment-capture flow has natural extension point at payment-auth; unbounded extensions let abandoned carts hold stock forever.
- **Options considered:** Unlimited extensions; one-time (this); fixed-attempt with backoff.
- **Chosen:** One-time.
- **Why:** Matches the natural payment-auth retry behavior + bounds the stock-hold window to 30 min worst-case (15 min original + 15 min extension).
- **Citation:** Research note citation #4 (Redis SET / EXPIRE semantics — `XX` flag only updates existing) + #12 (Razorpay payment flow — auth + capture timing).

### D13 — Stock-decrement timing (decrement-at-capture)

Stock decrement happens at payment capture (not at payment auth). The Redis reservation holds stock between auth + capture (15-min window per D3). On capture, P9 order-service consumes the reservation by emitting `order.placed.v1` which inventory-service subscribes to + writes a `RESERVATION_RELEASED` ledger entry simultaneously with an `ORDER_DECREMENTED` ledger entry (same withTransaction).

- **Context:** Razorpay payment flow has 12-min minimum auto-capture delay + late-authorization window up to 5 days per the Razorpay capture-settings docs.
- **Options considered:** Decrement-at-auth (faster checkout, stock-locked on incomplete payments); decrement-at-capture (no false stock-out, worse UX); two-phase (auth = reserve, capture = decrement — this).
- **Chosen:** Decrement-at-capture with reservation holding the stock between auth + capture.
- **Why:** Avoids the "payment failed but stock locked" failure mode; Razorpay's late-authorization handling (cite #12) means we can't reliably decrement at auth without false stock-outs.
- **Citation:** Research note citation #12 (Razorpay payment flow) + #13 (Razorpay capture settings API).

### D14 — Atlas M0 + namespacing compliance

All collections via `namespace('inventory', '<entity>')` per `.cursor/rules/deployment-mode.mdc`: `inventory.stock_ledger`, `inventory.stock_snapshots`, `inventory.reservation_audit`, `inventory.transfers`, `inventory.low_stock_config`. Atlas M0 free tier limits — confirmed against Atlas M0 docs (cite #14): 100 DBs max, 500 collections max — we use 1 DB (lotusgift) + 5 collections (well within budget). NO Atlas Search index allocation needed for inventory (the 3-index M0 budget is allocated to products + vendors + orders per parent plan §9).

- **Context:** Atlas M0 has hard caps on cluster + collection counts; inventory MUST stay within.
- **Options considered:** Separate Mongo cluster per service (violates free-tier-budget rule); shared cluster + namespacing (this).
- **Chosen:** Shared cluster + namespacing.
- **Why:** Atlas M0 free tier = 1 cluster per project; namespacing is the documented escape hatch per `.cursor/rules/deployment-mode.mdc` + the parent plan §9.
- **Citation:** Research note citation #14 (Atlas M0 free-tier limits) + `.cursor/rules/free-tier-budget.mdc`.

## 4. Open questions (Q1–Q6, each with proposed default)

### Q1 — Snapshot rebuild lag tolerance (sync vs async)

- **Question:** Should the materialized snapshot rebuild be synchronous (inside the same `withTransaction` as the ledger append) or asynchronous (via outbox subscriber, eventually consistent)?
- **Why parked:** Synchronous rebuild adds Mongo write latency to every ledger append (~50ms per the Mongoose 8 transactions docs). Asynchronous rebuild adds eventual-consistency complexity but keeps writes fast.
- **Proposed default (until reversed):** **Async** (eventually consistent ~250ms via in-process outbox at 250ms poll interval per InProcessOutboxPort default), with `pendingLedgerCount` field on the snapshot doc so reads can detect lag + fall back to ledger aggregate when `pendingLedgerCount > 5` (D5).
- **Trigger that would revisit:** Customer-facing PDP "out of stock" / "in stock" badge flicker reports (would indicate lag-induced read inconsistency); P15 insights-service forecasts off by > 5% (would indicate the snapshot is stale enough to affect demand forecasting).

### Q2 — Redis fallback when Upstash is down (in-memory vs fail-closed)

- **Question:** When `UPSTASH_REDIS_REST_URL` is unset OR the Upstash endpoint is unreachable, should the service fall back to an in-memory `Map<string, { value, expiresAt }>` (lossy, single-instance only) OR fail-closed (reject every reservation with `RESERVATION_BACKEND_UNAVAILABLE`)?
- **Why parked:** In-memory fallback works fine in dev + single-instance prod but produces silent over-selling in any multi-instance prod (Oracle A1.Flex could host two gateway replicas under tight memory budget). Fail-closed is safe but breaks dev + makes Upstash a hard dependency for CI.
- **Proposed default (until reversed):** **Fail-closed in production, in-memory in dev/test** — matches P4 D2 rate-limit gating pattern. The InventoryServiceModule's factory provider for RESERVATION_PORT chooses based on `NODE_ENV !== 'production' || (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN)`. Production with neither env var set → hard-warn at bootstrap (NOT a hard fail per the env.schema.ts superRefine).
- **Trigger that would revisit:** Multi-instance Oracle deployment per scaling-up.md GMV trigger (in-memory fallback becomes incorrect at that point even in dev clones of prod).

### Q3 — Stock-decrement timing (auth vs capture vs two-phase)

- **Question:** When does the stock decrement happen — at payment auth (faster checkout but stock-locked on incomplete payments) OR at payment capture (no false stock-out but worse UX) OR two-phase (auth = reserve, capture = decrement)?
- **Why parked:** Depends on payment-flow concurrency — fully resolves at P10 payment-service.
- **Proposed default (until reversed):** **Two-phase: decrement-at-capture with Redis reservation holding the stock for 15 min between auth + capture** (D13). The reservation is created at order placement (before payment); extended once at payment-auth (D12); consumed at payment-capture (writes RESERVATION_RELEASED + ORDER_DECREMENTED ledger entries in the same withTransaction).
- **Trigger that would revisit:** If P10 + Razorpay testing reveals systemic false stock-out from late-authorization (>1% of orders), revisit to allow optional decrement-at-auth gated by per-product `allowOversell` flag.

### Q4 — Negative-stock allowance (backorder mode)

- **Question:** Should ledger entries be allowed to produce negative `onHand` (backorder mode — order accepted with promise to ship when restocked) OR hard-reject (decrement that would produce negative stock returns `INSUFFICIENT_STOCK`)?
- **Why parked:** Backorder mode requires per-product opt-in + customer-facing expected-restock-date UX + P12 notification when restock happens — all P9+ surface.
- **Proposed default (until reversed):** **Hard-reject in P8 MVP**. The ledger.service.ts `append()` method asserts `currentSnapshot.onHand + delta >= 0` before writing; throws `INSUFFICIENT_STOCK` ProblemDetails on violation. Backorder mode gated behind per-product `allowBackorder` flag added in P9 product-service (NOT here — this PR doesn't touch product-service).
- **Trigger that would revisit:** First vendor request to enable backorder for a high-value SKU; P9 order-service decision on whether backorder is a P9b RFQ-only feature or a cart-flow feature too.

### Q5 — Reservation expiry sweeper (passive vs active)

- **Question:** Should reservation expiry rely solely on Redis TTL eviction (passive — no event emitted when key expires) OR run an active sweeper cron that emits `inventory.reservation-expired.v1` per expired key?
- **Why parked:** Passive is simpler but P12 notification-service needs the expired-event to notify the buyer "your cart was released — re-add items"; without an active sweeper P12 has no event hook.
- **Proposed default (until reversed):** **Active sweeper running every 60s** via `@Cron('*/60 * * * * *', { timeZone: 'Asia/Kolkata' })` scans Redis for keys whose stored `expiresAt` is past + emits `inventory.reservation-expired.v1` + writes the `inventory.reservation_audit` row. Idempotent via outbox LRU dedup on `idempotencyKey`.
- **Trigger that would revisit:** P12 notification-service determines a passive flow + Redis Keyspace Notifications would suffice (would let us drop the cron + save Redis commands).

### Q6 — Low-stock threshold scope (per-warehouse vs global)

- **Question:** Per-warehouse threshold (one warehouse can be low while another has stock) OR global per-variant threshold (sum across warehouses)?
- **Why parked:** Per-warehouse threshold matches the vendor's mental model (each warehouse has its own restock cycle); global threshold matches the customer's mental model (variant is "in stock" if any warehouse has stock).
- **Proposed default (until reversed):** **Per-warehouse threshold**, stored on `inventory.stock_snapshots.lowStockThreshold` field (default 10 from `INVENTORY_DEFAULT_LOW_STOCK_THRESHOLD` env). Vendor can override per-(variantId, warehouseId) via `PUT /api/inventory/low-stock-config`. The customer-facing "in stock" badge sums across warehouses (calculated by product-service from the `StockReadPort.batchGet` result) — global view emerges from per-warehouse data without a separate global threshold.
- **Trigger that would revisit:** Vendor feedback that per-warehouse thresholds are too noisy + they want a single per-variant global cap.

## 5. Implementation checklist (mirrors `todos` frontmatter)

See the YAML frontmatter above for the 22-item todo list:

1. research-note-p8
2. phase-8-issues
3. branch-pr-18
4. deps
5. utils-reservation-port
6. utils-redis-stock-port
7. types-inventory-extension
8. validators-inventory-schemas
9. events-inventory-schemas
10. inventory-service-schemas
11. inventory-service-services
12. inventory-service-controllers
13. inventory-service-cli
14. inventory-service-decorators
15. inventory-service-module
16. api-gateway-wiring
17. env-redis-inventory
18. cross-service-contracts-update
19. free-tier-budget-rule-update
20. analytics-instrumentation-p8
21. tests-p8
22. dockerfile
23. local-smoke-p8
24. commit-push-pr-18
25. ci-poll
26. copilot-review
27. admin-squash-merge
28. status-sync-pr18

## 6. Local smoke + CI checklist

### Local validation (run before push)

- `pnpm install --no-frozen-lockfile` (initial dep resolution after adding @upstash/redis + @nestjs/schedule)
- `pnpm install --frozen-lockfile` (lockfile sync verify; expect 0 errors)
- `pnpm check-types` — ~36/36 green (was 35 post-P7; +1 for `@lotusgift/inventory-service`)
- `pnpm lint` — ~39/39 green
- `pnpm test` — ~20-22/20-22 turbo tasks green (+1-2 for inventory-service suites + @repo/utils RedisStockReadPort + ReservationPort tests)
- `pnpm build` — ~11/11 green
- `pnpm dep-cruiser` — 0 errors (verify: services/inventory-service may NOT import services/order-service or services/product-service directly; cross-service VendorService import IS legal per modular-monolith)
- `pnpm dlx markdownlint-cli2 docs/research/phase-8-inventory-service.md services/inventory-service/README.md .cursor/plans/p8_*.md docs/architecture/cross-service-contracts.md .cursor/rules/free-tier-budget.mdc` — 0 errors
- Manually test CLI in dev — `pnpm inventory:transfer --from <warehouseId> --to <warehouseId> --variant <variantId> --qty 5 --reason "test"`; verify `transferId` returned + `inventory.transferred.v1` row in `outbox.events`
- Smoke the StockReadPort swap — start the gateway; hit `GET /api/products/:id`; verify `availableStock` field is sourced from `RedisStockReadPort.batchGet()` (NOT the stub returning 0) by inserting a test ledger row first

### CI (all 16 required checks green on the merge commit)

- `lint` / `check-types` / `test` / `build` (CI workflow)
- `dep-cruiser` (architecture-layers + microservice-boundaries enforcement)
- `markdownlint` / `actionlint`
- `pr-title` (Conventional Commits + Workstream scope)
- `gitleaks` (secret-scan)
- `dependency-review`
- `openapi-drift` (verify Kubb regen after the new endpoints land)
- `atlas-search-mapping-drift` (no new mappings for inventory — passes automatically)
- `corporate-gifting-domain` (the new corporate-gifting-domain-auditor subagent will audit reservation idempotency + audit-log emission)
- `build-push` (multi-arch image)
- `a11y` (no frontend changes — passes automatically)

## 7. Post-merge sync checklist

1. `git checkout main && git pull && git branch -d pr-18-inventory-service && git push origin --delete pr-18-inventory-service`
2. `gh issue close <epic-num> --reason completed` + `gh issue close <acceptance-num> --reason completed`
3. `gh api -X PATCH repos/goldr0g3r/lotusgift/milestones/<phase-8-num> -f state=closed`
4. Update parent plan `p8` todo content (PR-18 squash SHA + 1-paragraph delivery summary) + `status: completed`
5. Backfill `docs/research/phase-8-inventory-service.md` §6 with PR-18 link + squash SHA + Copilot iteration timeline + lessons learned (especially around `withTransaction` + outbox subscriber wiring + Upstash quota-burn for P9 order-saga design)
6. Project board: add PR + issues via `gh project item-add`, then `gh project item-edit` for `Status=Done / Phase=P8 / Workstream=inventory / Layer=L4 / Type=feat`
7. `git push origin main` for the closeout commit

## 8. References

- Parent plan: [`.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md`](lotusgift_v2_architecture_rebuild_512d4adf.plan.md) (`p8` todo)
- Prior art:
  - [`p6_vendor_service_pr-16_73c63961.plan.md`](p6_vendor_service_pr-16_73c63961.plan.md)
  - [`p7_product-service_pr-17_a94f79e1.plan.md`](p7_product-service_pr-17_a94f79e1.plan.md)
- Research note (this PR introduces): `docs/research/phase-8-inventory-service.md`
- Cross-service contracts doc (this PR updates): `docs/architecture/cross-service-contracts.md`
- Free-tier budget rule (this PR updates): `.cursor/rules/free-tier-budget.mdc`
- Always-applied rules consulted: `architecture-layers.mdc`, `microservice-boundaries.mdc`, `event-driven-discipline.mdc`, `deployment-mode.mdc`, `free-tier-budget.mdc`, `test-coverage.mdc`, `analytics-instrumentation.mdc`, `api-type-safety.mdc`, `secrets-and-secrets-handling.mdc`, `research-note-per-module.mdc`, `always-latest-docs.mdc`, `commit-conventions.mdc`, `no-composer-2.mdc`
- StockReadPort contract introduced at P7 D12 (this PR ships the real impl): [`packages/utils/src/stock-read-port.ts`](../../packages/utils/src/stock-read-port.ts)
- Outbox + withTransaction lesson from P6 D18 + P7 D14: every write goes through `withTransaction(connection, async session => { /* domain write + outbox.publish + outbox subscriber */ })` — analytics `capture()` fires POST-commit
