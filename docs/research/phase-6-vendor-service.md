# Phase 6 — services/vendor-service (PR-16)

## 1. Goal

Ship `services/vendor-service` end-to-end in a single PR so the marketplace gains its first
vendor-side surface area: self-serve onboarding wizard (6 linear steps), KYC validation
(GSTIN mod-36 + PAN 4th-char enum + IFSC + UPI VPA + bank-account length), admin approval gate
(vendor cannot list products until activated), multi-warehouse registry (geocoded address +
ISO 3166-2:IN state + GeoJSON Point with `2dsphere` index + per-weekday operating hours + per-carrier
pickup cutoffs + service-zone discriminated union of pincode list OR polygon), per-tier warehouse
limits (Starter=1 / Growth=5 / Enterprise=∞), sliding commission schedule + tier history audit log,
read-only payouts ledger (writer in P10), read-only per-warehouse SLA scoring (compute cron in P21),
and 5 outbox events bound to a Better-Auth `vendor-org` Organization.

This phase **populates** the empty P2 shells (`@repo/validators/vendor`, `@repo/events/vendor`)
and extends `@repo/types` with `india.ts` so P7 product-service, P9 order-service, P11
shipping-service, P13 tax-service, and P14 promotions-service can all consume the vendor +
warehouse types without circular imports.

Q1–Q5 from the sub-plan are resolved in §3 (Decisions log).

## 2. Citations table (retrieval-dated 2026-05-15)

| # | Topic | Title | URL | Retrieved |
| --- | --- | --- | --- | --- |
| 1 | GSTIN mod-36 checksum algorithm | How to verify GSTIN Number in India? — LookupTax | <https://lookuptax.com/docs/how-to-verify/gstin-verification-india> | 2026-05-15 |
| 2 | GSTIN Luhn mod-36 reference impl | GSTIN Format Validator 2026 — Mark IT | <https://www.markitsolutions.in/tools/gstin-validator> | 2026-05-15 |
| 3 | India PAN structure + 4th-char entity kind | How PAN is formed — Income Tax India | <https://www.incometaxindia.gov.in/w/how-pan-is-formed-and-how-it-gets-its-unique-identity-> | 2026-05-15 |
| 4 | IFSC code format | Indian Financial System Code — Wikipedia | <https://en.wikipedia.org/wiki/Indian_Financial_System_Code> | 2026-05-15 |
| 5 | UPI VPA regex | Validating UPI IDs using regex — GeeksforGeeks | <https://www.geeksforgeeks.org/dsa/validating-upi-ids-using-regular-expressions/> | 2026-05-15 |
| 6 | OSM Nominatim usage policy (1 req/sec absolute) | OSM Foundation Nominatim policy issue tracker | <https://github.com/odoo/odoo/issues/134197> | 2026-05-15 |
| 7 | Nominatim search endpoint manual | Search — Nominatim 5.3.2 Manual | <https://nominatim.org/release-docs/latest/api/Search/> | 2026-05-15 |
| 8 | MongoDB 2dsphere + GeoJSON polygon | GeoJSON Objects — MongoDB Manual | <https://www.mongodb.com/docs/manual/reference/geojson/> | 2026-05-15 |
| 9 | `$geoWithin` polygon queries | $geoWithin query predicate operator — MongoDB Manual | <https://www.mongodb.com/docs/manual/reference/operator/query/geoWithin/> | 2026-05-15 |
| 10 | ISO 3166-2:IN (28 states + 8 UTs) | ISO 3166-2:IN — Wikipedia | <https://en.wikipedia.org/wiki/ISO_3166-2:IN> | 2026-05-15 |
| 11 | Shiprocket pickup cutoffs | Instant Pickup Services — Shiprocket | <https://www.shiprocket.in/instant-pickup-services/> | 2026-05-15 |
| 12 | Delhivery pickup cutoffs | Pickup Request — Delhivery Help | <https://help.delhivery.com/docs/pickup-request> | 2026-05-15 |
| 13 | Razorpay Fund-Account Validation (P10 enrichment target) | Fund Account Validation — Razorpay X | <https://razorpay.com/docs/x/fund-account-validation/> | 2026-05-15 |
| 14 | nestjs-zod 5.3 createZodDto pattern | nestjs-zod 5.3.0 — npm | <https://www.npmjs.com/package/nestjs-zod> | 2026-05-15 |
| 15 | `@nestjs/mongoose` 11.0.4 | @nestjs/mongoose — npm | <https://www.npmjs.com/package/@nestjs/mongoose> | 2026-05-15 |
| 16 | lru-cache 11.2.x (24h geocode cache) | lru-cache — npm | <https://www.npmjs.com/package/lru-cache> | 2026-05-15 |
| 17 | Better-Auth Organization plugin (vendor-org binding) | Organization Plugin — Better Auth Docs | <https://www.better-auth.com/docs/plugins/organization> | 2026-05-15 |

## 3. Decisions log

Decisions D1–D21 below are the sub-plan's baked-in decisions (`.cursor/plans/p6_vendor_service_pr-16_73c63961.plan.md`)
plus the user's Q1–Q5 answers (D22–D26 — see appendix). Brevity here; rationale lives in
the sub-plan and the appendix.

### D1 — Single PR-16

One `feat(vendor)` commit covers `@repo/types` india + `@repo/validators/vendor` (9 files) +
`@repo/events/vendor` (5 files) + `services/vendor-service` end-to-end + api-gateway wiring.
Mirrors PR-13/14/15 cadence (single squash, Copilot iteration in follow-up commits).

### D2 — OSM Nominatim for warehouse geocoding (MVP)

Free, ODbL-compliant. Hard 1-req/sec limit per OSM Foundation policy ([cite #6](#2-citations-table-retrieval-dated-2026-05-15));
absorb via in-process semaphore + 24h LRU cache keyed on normalized address hash. MapMyIndia
documented as `docs/runbooks/scaling-up.md` upgrade path. See **D22** (Q1 answer).

### D3 — KYC depth = regex + checksum at MVP

Razorpay fund-account-validation API parked to P10; async-enriched via the
`vendor.kyc-submitted.v1` event so vendor activation doesn't block on payment-service
not-yet-shipping. See **D23** (Q2 answer).

### D4 — Inline GSTIN mod-36 checksum

`gstin-validator` npm last published Sept 2020 — fails the ≤14d freshness rule. ~30-LOC inline
implementation in `packages/validators/src/vendor/gstin-checksum.ts` (Luhn mod-36 per [cite #2](#2-citations-table-retrieval-dated-2026-05-15)).

### D5 — PAN entity-kind enum surface

Full enum `P|C|H|F|A|T|B|L|J|G` allowed at parse; admin-approval UX surfaces non-individual
kinds (`C|H|F|A|T|B|L|J|G`) with a "verify additional documents" hint per Income Tax PAN docs
([cite #3](#2-citations-table-retrieval-dated-2026-05-15)). Lives in
`packages/validators/src/vendor/india.ts` so P7/P13 can re-use.

### D6 — Vendor ↔ Better-Auth Org = 1:1

`vendor.vendors.orgId` is a foreign key onto Better-Auth `organization.id` ([cite #17](#2-citations-table-retrieval-dated-2026-05-15))
in the isolated `lotusgift_auth` database (per P5b D15). Multi-vendor-per-org disallowed at MVP
— keeps auto-router + payout-ledger semantics 1:1.

### D7 — Per-tier warehouse caps (HARD)

Starter=1, Growth=5, Enterprise=∞. Returns `ProblemDetails 422` with code
`WAREHOUSE_TIER_LIMIT_EXCEEDED` at warehouse-create. See **D24** (Q3 answer).

### D8 — HARD admin-approve gate at MVP

No auto-approval pathway. Existing `corporate-buyer-org` fast-track parked to P18.
See **D25** (Q4 answer).

### D9 — Service-zone discriminated union

`{ mode: 'pincodes', pincodes: string[] }` OR `{ mode: 'polygon', polygon: GeoJSON.MultiPolygon }`.
Polygon-mode warehouses get a `2dsphere` index on `serviceZone.polygon` so shipping-service (P11)
can run `$geoWithin` ([cite #9](#2-citations-table-retrieval-dated-2026-05-15)) at rate-quote time.
Atlas M0 supports `2dsphere` ([cite #8](#2-citations-table-retrieval-dated-2026-05-15)) — no quota
conflict with the 3 Atlas Search index allocation.

### D10 — ISO 3166-2:IN literal-union enum

`packages/types/src/india.ts` exports `IN_STATE_CODES` (36 entries — 28 states + 8 UTs per
[cite #10](#2-citations-table-retrieval-dated-2026-05-15)). Post-2019 J&K split + post-2020
Dadra-Nagar-Haveli + Daman-Diu merger reflected.

### D11 — Per-carrier pickup-cutoff schema

`carrierCutoffs: Record<'shiprocket'|'delhivery'|'bluedart', { cutoffByWeekday: Record<Weekday, 'HH:mm' | null> }>`.
Shiprocket same-day 4 PM ([cite #11](#2-citations-table-retrieval-dated-2026-05-15)),
Delhivery manual 2 PM ([cite #12](#2-citations-table-retrieval-dated-2026-05-15)).
Per-weekday-per-carrier encoding captures Sunday closures + zone-specific differences.

### D12 — Inline switch state-machine, not XState

6 linear steps, no loops or actors. XState v5 (~56 KB minified) overkill; the algorithm is
~40 LOC. Sub-plan pins XState as upgrade target if/when wizard branches.

### D13 — Sliding commission schedule (TS const)

`services/vendor-service/src/config/commission-rates.config.ts` — tier × category-bucket matrix
+ optional per-vendor `commissionOverride[]`. Read API `GET /api/vendors/:id/commission-rate?categoryBucket=...`.

### D14 — Payouts ledger MVP = READ-only

Schemas ship here; write-path gated to P10 payment-service via `payment.captured.v1` consumer.
`GET /api/vendors/:id/payouts` returns `[]` until P10 wires the producer.

### D15 — Per-warehouse SLA scoring MVP = READ-only

Schemas ship here; compute cron lands at P21. `GET /api/warehouses/:id/sla-score?days=7` returns
`[]` until P21 cron writes daily rollups. See **D26** (Q5 answer).

### D16 — Operating-hours timezone fixed to IST

`Asia/Kolkata` only at MVP. Schema is forward-compat (add per-warehouse `timezone` field
when international vendor expansion lands per scaling-up.md).

### D17 — `ownerType` discriminator from day one

`'vendor' | 'platform'` on every warehouse row. Controller layer rejects `platform` at MVP
(`vendor`-only). Lets us add FBA-style platform-owned warehouses later without migrating
existing rows.

### D18 — Analytics emission AFTER outbox commit

`@repo/analytics-sdk/server.capture()` calls fire after the Mongo transaction commits — never
inside it. Failed transactions cannot ghost-emit. PII auto-redacted via `@repo/utils.redact`
(only `org_id` / `vendor_id` / `warehouse_id` / `state` / `tier` shapes ship — no GSTIN/PAN/phone/email).

### D19 — `@RequireRole(role)` decorator

Lightweight extension of the existing global `AuthGuard` from P5b. `SetMetadata(REQUIRE_ROLE_KEY, role)` +
the guard reads it via `Reflector`. Throws `ForbiddenException` with `code: 'AUTH_FORBIDDEN'` on
mismatch (ProblemDetails envelope rendered by the global filter).

### D20 — `@nestjs/mongoose` 11 adopted at L4 (first time)

L2 `@repo/database` deliberately stays raw Mongoose 8 (per P3 D6) so it can run in Lambda/worker
contexts. The Nest binding lives at L4 via `MongooseModule.forFeature([...schemas])` ([cite #15](#2-citations-table-retrieval-dated-2026-05-15)).
Matches the gateway's existing `MongooseModule.forRoot(env.MONGODB_URI)` wiring.

### D21 — Service-library shape mirrors auth-service

Nest framework packages + `mongoose` declared as `peerDependencies` per P5b D14 (avoids
DI-singleton splits from double-installed `@nestjs/core`). `@nestjs/mongoose` 11 + `lru-cache` 11
ship as direct dependencies (no DI-singleton concern; both are pure factories).

## 4. Open questions

1. **Q-OPEN-1 — Service-zone polygon validation depth.** MongoDB rejects self-intersecting
   polygons at insert time; should we also pre-validate counter-clockwise winding order at the
   Zod schema layer? Defer until first vendor-uploaded polygon errors surface — most warehouses
   will use `mode: 'pincodes'` at MVP.
2. **Q-OPEN-2 — Per-carrier holiday calendar.** D11 encodes per-weekday Sunday closures as
   `null`, but national holidays (Diwali, Republic Day) aren't modeled. Park to P11
   shipping-service where the carrier-aggregator integration can pull the canonical holiday
   table from each carrier's API.
3. **Q-OPEN-3 — Per-vendor commission override audit trail.** D13's `commissionOverride[]`
   field is admin-only edit; should every change emit a `vendor.commission-override-changed.v1`
   event for compliance audit? Park to P10 (the consumer of these rates) — P10 will need this
   in payout reconciliation regardless.

## 5. Implementation checklist

### `@repo/types`

+ [ ] `packages/types/src/india.ts` — `IN_STATE_CODES` const array (36 entries) + `InStateCode` type + `IN_STATE_NAMES` Record + `WAREHOUSE_OWNER_TYPES` + `VENDOR_TIER_KEYS` + `KYC_STATUS_KEYS` + `PAN_ENTITY_KINDS` + branded `IfscCode` + `UpiVpa` + `PanIndia`.
+ [ ] `packages/types/src/index.ts` — re-export `india.ts` public types.

### `@repo/validators/vendor/` (populates the empty P2 shell)

+ [ ] `india.ts` — Zod parsers for the 5 enums + `InStateCodeSchema`.
+ [ ] `pan.ts` — `PanSchema` (10-char + 4th-char enum + uppercase normalize + brand).
+ [ ] `ifsc.ts` — `IfscSchema` (`^[A-Z]{4}0[A-Z0-9]{6}$` + uppercase + brand).
+ [ ] `upi-vpa.ts` — `UpiVpaSchema` (regex + lowercase + brand).
+ [ ] `bank-account.ts` — `BankAccountSchema`.
+ [ ] `gstin-checksum.ts` — `assertGstinChecksumValid` mod-36 impl + `GstinWithChecksumSchema` wrapper.
+ [ ] `onboarding-request.ts` — 5 per-wizard-step request schemas.
+ [ ] `warehouse-row.ts` — OperatingHours + CarrierCutoffs + ServiceZone (discriminated union) + GeoJsonPoint + GeoJsonMultiPolygon + WarehouseAddress + Create/Update/Response/List schemas.
+ [ ] `tier-upgrade.ts` — TierUpgradeRequest + TierMatrixResponse.
+ [ ] `payout-row.ts` — PayoutRow + PayoutListResponse.
+ [ ] `packages/validators/src/index.ts` — barrel re-export of the 9 vendor modules.

### `@repo/events/vendor/` (populates the empty P2 shell)

+ [ ] `onboarding-started.v1.ts` — `defineEvent('vendor.onboarding-started.v1', { orgId, vendorId, startedBy })`.
+ [ ] `kyc-submitted.v1.ts` — `defineEvent('vendor.kyc-submitted.v1', { orgId, vendorId, kycSubmissionId, gstin, panEntityKind })`.
+ [ ] `activated.v1.ts` — `defineEvent('vendor.activated.v1', { orgId, vendorId, approvedBy, activatedAt })`.
+ [ ] `warehouse-added.v1.ts` — `defineEvent('vendor.warehouse-added.v1', { orgId, vendorId, warehouseId, state, pincode })`.
+ [ ] `tier-upgraded.v1.ts` — `defineEvent('vendor.tier-upgraded.v1', { orgId, vendorId, fromTier, toTier, effectiveAt })`.
+ [ ] `packages/events/src/vendor/index.ts` — barrel.

### `services/vendor-service/src/`

+ [ ] `schemas/vendor.schema.ts` — `vendor.vendors`.
+ [ ] `schemas/warehouse.schema.ts` — `vendor.warehouses` + `2dsphere` indexes.
+ [ ] `schemas/kyc-submission.schema.ts` — `vendor.kyc_submissions` append-only.
+ [ ] `schemas/payout.schema.ts` — `vendor.payouts` read-only at MVP.
+ [ ] `schemas/tier-history.schema.ts` — `vendor.tier_history` append-only.
+ [ ] `schemas/warehouse-sla-score.schema.ts` — `vendor.warehouse_sla_scores`.
+ [ ] `services/vendor.service.ts` — vendor profile CRUD + status guards.
+ [ ] `services/onboarding.service.ts` — 6-step linear state machine.
+ [ ] `services/kyc.service.ts` — full validation + submission write + event emit.
+ [ ] `services/warehouse.service.ts` — CRUD + geocoder + service-zone validator + event emit + cap enforcement.
+ [ ] `services/tier.service.ts` — upgrade/downgrade + history write + event emit + commission lookup.
+ [ ] `services/payout.service.ts` — read-only list/get.
+ [ ] `services/sla-scoring.service.ts` — read-only list/get.
+ [ ] `services/geocoder.service.ts` — Nominatim wrapper + 1 req/sec semaphore + 24h LRU cache.
+ [ ] `config/commission-rates.config.ts` — tier × category-bucket matrix.
+ [ ] `config/tier-limits.config.ts` — per-tier caps.
+ [ ] `controllers/vendor.controller.ts` — `/api/vendors`.
+ [ ] `controllers/onboarding.controller.ts` — `/api/vendors/onboarding`.
+ [ ] `controllers/admin-approval.controller.ts` — `/api/admin/vendor-approvals`.
+ [ ] `controllers/warehouse.controller.ts` — `/api/vendors/:vendorId/warehouses` + `/api/warehouses/search`.
+ [ ] `controllers/tier.controller.ts` — `/api/vendors/:id/tier` + `/api/vendor-tiers`.
+ [ ] `controllers/payout.controller.ts` — `/api/vendors/:id/payouts` read-only.
+ [ ] `decorators/require-role.decorator.ts` — `@RequireRole` + key constant.
+ [ ] `vendor-service.module.ts` — `MongooseModule.forFeature` + providers + exports.
+ [ ] `index.ts` — public surface.
+ [ ] `package.json` — peer dep Nest + mongoose; direct dep `@nestjs/mongoose` + `lru-cache` + workspace pkgs.
+ [ ] `tsconfig.json` — extends `@repo/typescript-config/library.json` + decorators.
+ [ ] `jest.config.ts` — extends `@repo/jest-config/nest`.
+ [ ] `eslint.config.mjs` — extends `@repo/eslint-config/library`.
+ [ ] `README.md` — module purpose + onboarding flow + KYC matrix + cross-service consumer table.

### `apps/api-gateway/`

+ [ ] `src/app.module.ts` — register `VendorServiceModule`.
+ [ ] `package.json` — add `@lotusgift/vendor-service` workspace dep.
+ [ ] `Dockerfile` — add `services/vendor-service/package.json` to deps stage + directory to build stage.

### `packages/config/`

+ [ ] `src/env.schema.ts` — add `NOMINATIM_BASE_URL` + `NOMINATIM_USER_AGENT` + `GEOCODE_CACHE_TTL_SECONDS`.

### `.env.example`

+ [ ] Append 3 vendor-service env vars under a new section header.

### Tests (≥15 individual tests across ≥6 spec files; none import `@jest/globals`)

+ [ ] `kyc.service.spec.ts` — GSTIN positive/negative/edge + PAN format + 4th-char enum + IFSC + UPI VPA + bank-account length.
+ [ ] `warehouse.service.spec.ts` — geocoder stub (happy + cache-hit) + 2dsphere index assertion + service-zone discriminated round-trip.
+ [ ] `tier.service.spec.ts` — commission-rate matrix lookup + warehouse-count cap enforcement.
+ [ ] `onboarding.service.spec.ts` — 6-step linear state machine (forward OK, backward + skip rejected).
+ [ ] `admin-approval.controller.spec.ts` — `@RequireRole('admin')` 403 + activation flow emits `vendor.activated.v1`.
+ [ ] `require-role.decorator.spec.ts` — `SetMetadata` + `Reflector.get` roundtrip.

### Research note

+ [ ] This file. §6 backfilled post-merge.

### GitHub

+ [ ] Phase 6 Epic + Phase-Acceptance issues under milestone #7 with `phase/P6` labels.

## 6. Versions captured

To be filled after `pnpm install --no-frozen-lockfile`:

```text
TBD — output of `pnpm ls --depth=0 --filter @lotusgift/vendor-service` after install.
```

## 7. Post-merge backfill (lessons learned)

**Merged:** 2026-05-15. PR <https://github.com/goldr0g3r/lotusgift/pull/38>. Squash SHA
`0456d4c439e6efd8878a9103e798ab23527d4e7e`. Delivered: 84 files / +6264 / -49 across 2 commits
squashed.

### Copilot iteration timeline

+ **Commit 1 — `0382144`** (initial wire, 81 files / +5721 LOC): types/india + validators/vendor
  (12 files including inline GSTIN mod-36) + events/vendor (5 v1 events) + services/vendor-service
  (6 Mongoose schemas + 8 services + 7 controllers + RoleGuard + RequireRole + 6 spec files) +
  api-gateway wiring + Dockerfile workspace COPY additions + research note + README. All 16 required
  CI checks green on this commit alone.
+ **Copilot review** (state `COMMENTED`, 26 inline comments): grouped into four themes — transactional
  outbox (6 comments), authorization on every vendor-scoped endpoint (7 comments), createZodDto pattern
  per `api-type-safety.mdc` (7 comments), and 6 misc (Nominatim timeout, PostHog shutdown, query-param
  validation, applyStep test, comment doc clarification on india.ts, race on warehouse cap).
+ **Commit 2 — `d0a6bb7`** (Copilot fixes, 25 files / +840 -300): all 5 write services rewritten to use
  `withTransaction(connection, ...)` so the domain write + outbox publish commit together (D18 enforced
  at the schema layer); new `@Global() OutboxModule` so vendor-service can `@Inject(OUTBOX_PORT)` (root
  AppModule providers aren't visible to imported modules without `@Global()`); new `VendorOwnershipGuard`
  wired across 8 endpoints (vendor read + warehouse create/list + tier read/upgrade + commission lookup +
  payout list + SLA score) so any signed-in user can't read/write another vendor's data by guessing the id;
  `createZodDto` DTOs on 6 mutation/query endpoints (warehouse create + tier upgrade + admin vendor list +
  vendor list + payout pagination + SLA score days-window); onboarding-wizard tier-ordering fix so
  GROWTH-onboarding can register 2-5 warehouses up front (passed `tierOverride` into the warehouse
  cap-check); 10s `AbortController` timeout on Nominatim fetch; `OnApplicationShutdown` drains the
  PostHog Node SDK queue; new `onboarding.apply-step.spec.ts` covering forward/backward/skip transitions;
  query-param Zod DTOs replace ad-hoc `Number(raw)` casts. All 16 required CI checks green on this commit.

### Numbers

+ Test count: 42 individual tests across 7 spec files (was 38 pre-Copilot-fix). 16/16 turbo `pnpm test`
  tasks green.
+ check-types: 33/33. lint: 36/36 (warnings only). build: 8/8. dep-cruiser: 0 errors. markdownlint:
  0 errors.
+ CI runtime: ~14 min per cycle (build-push multi-arch image is the long pole at 11-13 min).

### Lessons worth carrying into P7 product-service

1. **`@Global()` OutboxModule is required when imported service modules inject `OUTBOX_PORT`.** The
   inline `providers: [OUTBOX_PROVIDER]` in AppModule (P4 PR-13) was sufficient for the gateway's own
   controllers but NOT for L4 service modules — they live in a separate DI scope. Now wrapped in
   `apps/api-gateway/src/common/outbox.module.ts`; P7+ services inherit it automatically.
2. **`createZodDto` can't extend discriminated unions** (TS 2509 "base constructor return type is not
   an object type or intersection"). The admin-approval decision endpoint + onboarding wizard endpoint
   keep manual `Schema.parse(raw)` parsing with explanatory comments. P7 should design discriminated
   request shapes as separate routes when possible, or accept the manual-parse trade-off.
3. **`withTransaction` + `session` is the only correct outbox pattern.** The pre-Copilot pattern of
   "emit outside transaction + swallow failures" violates `event-driven-discipline.mdc`. Every P7+
   write must wrap the domain insert + `OutboxPort.publish({ session })` in a single
   `withTransaction(this.connection, async (session) => { ... })`.
4. **Analytics capture fires POST-commit, not inside the transaction.** Otherwise a Mongo abort can
   ghost-emit PostHog events. D18 enforced — keep this discipline.
5. **Per-endpoint ownership guards are required** for any vendor-scoped read/write endpoint that
   returns PII or accepts mutations. The `VendorOwnershipGuard` pattern (resolve `:vendorId` →
   look up vendor → check `session.activeOrganizationId` match OR admin role) is the template for
   P7 product-service (each product belongs to a vendor → same gate applies).
6. **Nominatim + any external HTTP must have an `AbortController` timeout.** A stalled response
   without a timeout blocks every queued request behind the 1 req/sec rate-limit semaphore.
7. **Test spec files MUST provide `getConnectionToken()` stubs** when the SUT uses
   `withTransaction()`. The stub: `{ startSession: () => Promise.resolve({ withTransaction: fn =>
   fn(), endSession: () => Promise.resolve() }) }`. Add this pattern to the test scaffolding for P7+.
8. **`@nestjs/mongoose` 11 at L4** is the established pattern. `MongooseModule.forFeature([...])`
   inside `forRoot(env)` dynamic module. `@repo/database` stays raw Mongoose 8 at L2 so worker/Lambda
   contexts can consume it (D20).

## Appendix — Q1–Q5 answers (user-confirmed pre-execution)

### D22 — Q1 answer: Geocoding provider = OSM Nominatim

User accepted OSM Nominatim for MVP with 1 req/sec semaphore + 24h LRU cache. MapMyIndia/Mappls
documented as `docs/runbooks/scaling-up.md` upgrade path; trigger threshold is >50 warehouse
registrations/day. ODbL attribution requirement acknowledged.

### D23 — Q2 answer: KYC depth = regex + checksum only at MVP

User accepted async-enrichment plan: vendor-service emits `vendor.kyc-submitted.v1`; P10
payment-service subscribes once Razorpay live keys ship and enriches the kyc-submission row
with the fund-account-validation result. Vendor activation does NOT block on this enrichment
— it's purely informational for the admin-approval queue UX in P18.

### D24 — Q3 answer: Per-tier warehouse caps = 1 / 5 / ∞

User accepted the conservative defaults (Starter=1, Growth=5, Enterprise=unlimited). Returns
`ProblemDetails 422 { code: 'WAREHOUSE_TIER_LIMIT_EXCEEDED', currentCount, tierMax }` at
warehouse-create time. Tier pricing + monthly rates land in P14 promotions-service.

### D25 — Q4 answer: Admin-approve gate = HARD for every vendor at MVP

User accepted the safe-default. Existing `corporate-buyer-org` accounts upgrading to also-be a
`vendor-org` go through the same admin-review queue. Auto-approval fast-track is parked to P18
(web-admin) as a configurable admin policy.

### D26 — Q5 answer: SLA scorer = empty-arrays read-only endpoints at MVP

User accepted the deferral. Schemas + GET endpoints land here; compute cron + Grafana dashboards
land in P21. P17 web-vendor surfaces a "Coming P21" UX hint on the per-warehouse SLA scorecard
so vendors aren't confused by empty data.
