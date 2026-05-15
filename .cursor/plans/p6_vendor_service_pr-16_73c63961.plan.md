---
name: P6 vendor-service PR-16
overview: Build services/vendor-service end-to-end in a single PR-16 — self-serve onboarding wizard (6-step linear state machine), KYC validation (GSTIN mod-36 checksum inline + PAN 4th-char entity enum + IFSC regex + UPI VPA + bank-account length), admin approval gate (vendor cannot list products until activated), multi-warehouse registry (geocoded address via OSM Nominatim + 28-state + 8-UT enum + per-weekday operating hours + per-carrier pickup cutoffs + service-zone discriminated union pincodes-or-2dsphere-polygon + ownerType vendor|platform forward-compat), sliding commission schedule + tier-gated warehouse limits (Starter=1 / Growth=5 / Enterprise=∞), read-only payouts ledger (write-path gated to P10), read-only per-warehouse SLA scoring (compute cron deferred to P21), 5 outbox events (onboarding-started / kyc-submitted / activated / warehouse-added / tier-upgraded) bound to a Better-Auth vendor-org Organization. Populates the empty P2 shells in @repo/validators/vendor + @repo/events/vendor + extends @repo/types with the new india.ts file. Wires VendorServiceModule into apps/api-gateway/src/app.module.ts.
todos:
  - id: research-note-p6
    content: Write docs/research/phase-6-vendor-service.md with ≥12 retrieval-dated 2026-05-15 citations (GSTIN checksum, gstin-validator npm staleness, PAN format + 4th-char enum, IFSC regex, UPI VPA, Nominatim usage policy + 1 req/sec, MapMyIndia free tier, MongoDB 2dsphere + Atlas M0 GeoJSON, ISO 3166-2:IN 28 states + 8 UTs, Shiprocket + Delhivery pickup cutoffs, Razorpay fund-account-API, XState v5 stance, nestjs-zod 5.3 createZodDto pattern) + ≥12 decisions + ≥3 open questions (parked from sub-plan) + implementation checklist + versions captured table.
    status: pending
  - id: phase-6-issues
    content: Create Phase 6 milestone (#7 if not yet existing) + Phase 6 Epic + Phase-Acceptance issues with labels phase/P6,area/infra,epic + phase/P6,phase-acceptance. (Milestone may already exist from p0-issues seed — verify via gh api repos/goldr0g3r/lotusgift/milestones; create only if absent.)
    status: pending
  - id: branch-pr-16
    content: git checkout -b pr-16-vendor-service from main + flip parent plan p6 todo content noting PR-16 is the PR-of-record.
    status: pending
  - id: deps
    content: Add mongoose ^8 (peer), @nestjs/mongoose ^11, xstate-free state machine (inline guard — no xstate dep at MVP per decision D12), undici ^7 (Nominatim HTTP client; Node 22 fetch is fine — keep undici as devDep for typed Response stubs in tests), node-cache or lru-cache ^11 for the 24h geocode-result cache. Add @repo/database + @repo/types + @repo/validators + @repo/events + @repo/utils + @repo/analytics-sdk + @repo/config as workspace deps on services/vendor-service. Add @lotusgift/vendor-service workspace dep to apps/api-gateway.
    status: pending
  - id: types-india-extension
    content: packages/types/src/india.ts — IN_STATE_CODES (28 states + 8 UTs ISO 3166-2:IN literal-union type) + WAREHOUSE_OWNER_TYPES + VENDOR_TIER_KEYS + KYC_STATUS_KEYS + PAN_ENTITY_KINDS branded types. Re-export from packages/types/src/index.ts.
    status: pending
  - id: validators-vendor-schemas
    content: Populate packages/validators/src/vendor/ empty shell with 8 files — india.ts (IN state enum + PanEntityKindEnum + KycStatusEnum + VendorTierEnum + WarehouseOwnerTypeEnum Zod parsers); pan.ts (PAN Zod schema with format + 4th-char enum); ifsc.ts (IFSC Zod schema 4-letter+0+6-alphanumeric); upi-vpa.ts (VPA Zod schema 2-256@3-65 alphabetic); bank-account.ts (account-number length 9-18 + holder name + IFSC join); gstin-checksum.ts (mod-36 checksum function + Zod superRefine that wraps the existing GstinIndiaSchema with the checksum check); onboarding-request.ts (per-wizard-step request schemas — VendorBasicStepSchema + KycStepSchema + BankStepSchema + WarehousesStepSchema + TierStepSchema); warehouse-row.ts (full warehouse CreateRequest + UpdateRequest + ListResponse with embedded operating-hours + carrier-cutoffs + service-zone discriminated union + GeoJSON.Point Zod parser); tier-upgrade.ts (TierUpgradeRequest + TierMatrixResponse); payout-row.ts (PayoutRowSchema for read-only ledger). Extend packages/validators/src/index.ts barrel.
    status: pending
  - id: events-vendor-schemas
    content: Populate packages/events/src/vendor/ empty shell with 5 v1 event files via defineEvent() — onboarding-started.v1.ts ({ orgId, vendorId, startedBy }), kyc-submitted.v1.ts ({ orgId, vendorId, kycSubmissionId, gstin, panEntityKind }), activated.v1.ts ({ orgId, vendorId, approvedBy, activatedAt }), warehouse-added.v1.ts ({ orgId, vendorId, warehouseId, state, pincode }), tier-upgraded.v1.ts ({ orgId, vendorId, fromTier, toTier, effectiveAt }). Index.ts barrel re-exports all 5.
    status: pending
  - id: vendor-service-domain
    content: services/vendor-service/src/schemas/ — vendor.schema.ts (vendor.vendors with orgId FK to Better-Auth organization.id + status DRAFT|PENDING_REVIEW|ACTIVATED|REJECTED|SUSPENDED + tier STARTER|GROWTH|ENTERPRISE + commissionOverride? + audit fields via baseSchemaPlugin); warehouse.schema.ts (vendor.warehouses with embedded address + GeoJSON.Point location + 2dsphere index + operatingHours per-weekday + carrierCutoffs per-carrier + serviceZone discriminated union + ownerType + enabled + pickupSlaHours); kyc-submission.schema.ts (vendor.kyc_submissions append-only with GSTIN + PAN + bankAccountId + reviewerId + reviewedAt + decision); payout.schema.ts (vendor.payouts read-only at MVP — { vendorId, periodStart, periodEnd, grossPaise, commissionPaise, netPaise, status, razorpayPayoutId? }); tier-history.schema.ts (vendor.tier_history append-only audit row per upgrade/downgrade); warehouse-sla-score.schema.ts (vendor.warehouse_sla_scores per-warehouse-per-day rollup row — computed by P21 cron). All collections via namespace('vendor', '<entity>').
    status: pending
  - id: vendor-service-services
    content: services/vendor-service/src/services/ — vendor.service.ts (CRUD on vendor profile + status transition guards); onboarding.service.ts (6-step linear wizard state machine via inline exhaustive-switch guard — BASIC -> KYC -> BANK -> WAREHOUSES -> TIER -> SUBMITTED_FOR_REVIEW transitions + per-step partial-validation); kyc.service.ts (GSTIN mod-36 checksum + PAN regex + 4th-char enum + IFSC + UPI VPA + bank-account length validation + writes kyc_submissions row + emits vendor.kyc-submitted.v1); warehouse.service.ts (warehouse CRUD + Nominatim geocoding wrapper with 24h LRU cache + 1 req/sec semaphore + ServiceZoneValidator for the discriminated union + emits vendor.warehouse-added.v1); tier.service.ts (tier upgrade/downgrade + sliding commission-rate matrix lookup + writes tier_history row + emits vendor.tier-upgraded.v1 + enforces per-tier warehouse count caps); payout.service.ts (READ-ONLY list/get APIs at MVP — listByVendor + getById + getCurrentPeriodTotals; write-path PARKED to P10 payment-service via consume-event handler on payment.captured.v1); sla-scoring.service.ts (READ-ONLY list/get APIs at MVP — the per-warehouse-per-day rollup writer cron lives in P21); commission-rates.config.ts (sliding tier x category-bucket matrix constants).
    status: pending
  - id: vendor-service-controllers
    content: services/vendor-service/src/controllers/ — vendor.controller.ts (/api/vendors CRUD + admin-only GET /api/vendors with status filter); onboarding.controller.ts (/api/vendors/onboarding POST {step, payload} returns next-step hints + GET /api/vendors/onboarding/status returns current step + completion %); admin-approval.controller.ts (/api/admin/vendor-approvals — list pending, GET detail, POST :id/approve, POST :id/reject — all gated by @RequireRole('admin')); warehouse.controller.ts (/api/vendors/:vendorId/warehouses CRUD + POST :id/toggle-enabled + GET /api/warehouses/search?state=...&pincode=... for shipping-service lookup); tier.controller.ts (/api/vendors/:id/tier GET current + POST upgrade + GET /api/vendor-tiers list available plans); payout.controller.ts (/api/vendors/:id/payouts GET list read-only). Every controller class extends createZodDto for request/response per .cursor/rules/api-type-safety.mdc.
    status: pending
  - id: vendor-service-decorators-and-guard
    content: services/vendor-service/src/decorators/require-role.decorator.ts — @RequireRole('admin'|'owner'|'member'|...) parameter decorator that AuthGuard reads via Reflector and throws 403 ProblemDetails on mismatch. Lightweight extension of the existing global AuthGuard — does NOT create a second guard; uses SetMetadata(REQUIRE_ROLE_KEY, role).
    status: pending
  - id: vendor-service-module
    content: services/vendor-service/src/vendor-service.module.ts — imports MongooseModule.forFeature for all 6 schemas, declares all 7 services + 6 controllers, exports VendorService + WarehouseService + TierService (consumed by P9 order-service + P11 shipping-service for cross-service reads via the gateway's internal API client). Index.ts barrel re-exports VendorServiceModule + the 5 v1 event types + RequireRole decorator + service tokens.
    status: pending
  - id: api-gateway-wiring
    content: apps/api-gateway/src/app.module.ts — import + register VendorServiceModule under the existing AuthServiceModule.forRoot(env) entry. apps/api-gateway/package.json — add @lotusgift/vendor-service workspace dep. apps/api-gateway/Dockerfile — add services/vendor-service/package.json to deps stage COPY + services/vendor-service directory copy to build stage (same PR-13/14/15 pattern). Verify openapi-drift CI catches the new routes (it should, the export-openapi.ts placeholder loops over modules).
    status: pending
  - id: analytics-instrumentation
    content: Wire @repo/analytics-sdk/server.capture() calls inside each of the 5 service write paths so the 5 events from docs/analytics/events.md vendor section emit. PII-redact via the SDK's built-in @repo/utils.redact (no raw GSTIN/PAN/phone/email in property bags). Calls fire AFTER the outbox transaction commits.
    status: pending
  - id: env-example
    content: .env.example — append NOMINATIM_BASE_URL (defaults to https://nominatim.openstreetmap.org/search; override for self-hosted instance per scaling-up.md), NOMINATIM_USER_AGENT (per OSM policy must identify the application), GEOCODE_CACHE_TTL_SECONDS (default 86400 = 24h). packages/config/src/env.schema.ts — add 3 optional entries with defaults.
    status: pending
  - id: tests-p6
    content: ≥18 individual tests across 7 spec files. services/vendor-service/src/services/kyc.service.spec.ts (GSTIN mod-36 checksum positive + negative + edge cases; PAN format + 4th-char enum branches; IFSC regex; UPI VPA; bank-account length); services/vendor-service/src/services/warehouse.service.spec.ts (Nominatim wrapper with stubbed fetch — happy path + 429 retry + rate-limit semaphore + 24h cache hit; 2dsphere index assertion via Mongoose schema introspection; service-zone discriminated-union round-trip); services/vendor-service/src/services/tier.service.spec.ts (commission-rate lookup matrix per tier × category bucket; warehouse-count cap enforcement); services/vendor-service/src/services/onboarding.service.spec.ts (6-step linear state machine — forward transitions allowed, backward + skip rejected; per-step partial-validation); services/vendor-service/src/controllers/vendor.controller.spec.ts (CRUD + admin-only list-with-status-filter); services/vendor-service/src/controllers/admin-approval.controller.spec.ts (RequireRole('admin') 403 on non-admin + activation flow happy path emitting vendor.activated.v1); services/vendor-service/src/decorators/require-role.decorator.spec.ts (SetMetadata wiring + Reflector lookup). Convention: .spec.ts extension (matches existing nest jest testRegex); no @jest/globals imports — ts-jest auto-injects.
    status: pending
  - id: dockerfile
    content: apps/api-gateway/Dockerfile — add services/vendor-service/package.json to deps stage COPY block (alphabetical after auth-service) + services/vendor-service full directory COPY in build stage. Same pattern PR-13/PR-14/PR-15 used for workspace package additions.
    status: pending
  - id: local-smoke-p6
    content: Full local pipeline — pnpm install --no-frozen-lockfile + pnpm check-types (expect 34/34 after the new package lands) + pnpm lint (37/37) + pnpm test (16-18/16-18 turbo tasks — the +2-4 are the vendor-service suites) + pnpm build (9/9) + pnpm dep-cruiser (0 errors — the L4 boundary catches any accidental service-to-service direct import) + pnpm dlx markdownlint-cli2 docs/research/phase-6-vendor-service.md .cursor/plans/p6_vendor_service_pr-16_73c63961.plan.md (0 errors).
    status: pending
  - id: commit-push-pr-16
    content: Single feat(vendor) commit + branch push + gh pr create PR-16 with HEREDOC body summarizing scope/changes/tests/CI/decisions baked.
    status: pending
  - id: ci-poll
    content: gh pr checks 16 — poll the 16 required checks (build-push is the longest ~5-10min for the multi-arch image). Use AwaitShell with 300-540s blocks.
    status: pending
  - id: copilot-review
    content: gh pr edit 16 --add-reviewer copilot-pull-request-reviewer; address every Copilot comment + re-poll CI.
    status: pending
  - id: admin-squash-merge
    content: gh pr merge 16 --squash --admin --subject 'feat(vendor): ship vendor-service end-to-end (P6, PR-16)' --body via Set-Content tmpfile.
    status: pending
  - id: status-sync-pr16
    content: Close epic + acceptance issues, close Phase 6 milestone, flip parent plan p6 -> completed, backfill phase-6 research note §6, sync project board (Status=Done / Phase=P6 / Workstream=vendor / Layer=L4 / Type=feat), delete branch local + remote.
    status: pending
isProject: false
---

# Sub-plan: P6 — services/vendor-service (PR-16)

The sub-plan that **drafts P6**, ready for user review BEFORE execution. Scope-decisions captured in the Decisions baked section; open questions await user input. Implementation happens in a separate session after review.

## Decisions baked in

- **D1 — Scope split:** single PR-16 covering @repo/types india extension + @repo/validators/vendor (8 files populating the P2 empty shell) + @repo/events/vendor (5 v1 event files populating the empty shell) + services/vendor-service full polish (6 schemas + 7 services + 6 controllers + 1 decorator + module + barrel + tests + Dockerfile updates + analytics + env entries) + apps/api-gateway wiring + research note. Mirrors the PR-13/PR-14/PR-15 cadence — single feat(vendor) commit, Copilot iteration, admin squash merge.
- **D2 — Geocoding provider for warehouse addresses:** **OSM Nominatim** with `Nominatim-Policy`-compliant 1-req/sec rate-limit semaphore + 24h LRU/Mongo-backed cache keyed on the normalized address hash. Reasoning: per `.cursor/rules/free-tier-budget.mdc` we default to free-tier providers; per-warehouse geocoding is a ONE-TIME write at warehouse-registration (not a per-request hot path), so 1 req/sec + 24h cache absorbs any realistic onboarding volume. **MapMyIndia/Mappls** + **Google Maps Geocoding** documented as upgrade paths in `docs/runbooks/scaling-up.md` (cost-justified when daily geocode volume exceeds Nominatim's bulk cap of 4 req/min sustained). Citations #5–#6 of the research-note draft. **Awaiting user sign-off — see Q1.**
- **D3 — KYC depth at MVP:** **regex + checksum validation only** (no live API verification). Covers: GSTIN mod-36 checksum (inline; see D4) + PAN 10-char format + 4th-char entity enum (P/C/H/F/A/T/B/L/J/G) + IFSC 11-char `[A-Z]{4}0[A-Z0-9]{6}` + UPI VPA `[a-zA-Z0-9.-]{2,256}@[a-zA-Z]{2,64}` + bank account length 9–18 digits. **Razorpay fund-account-validation API** (verifies beneficiary name + account active) is **PARKED to P10** (payment-service ships with the Razorpay live keys; vendor-service emits `vendor.kyc-submitted.v1` and P10 subscribes to enrich the submission asynchronously). **Awaiting user sign-off — see Q2.**
- **D4 — GSTIN checksum implementation:** **inline** mod-36 algorithm in `packages/validators/src/vendor/gstin-checksum.ts` (~30 LOC: char-to-numeric mapping, position-based multiplication with mod-36 wrap, sum % 36 → expected check char comparison). Reasoning: the `gstin-validator` npm package was last published **September 2020** (v1.1.3 per registry check 2026-05-15); pulling a 5+ year-stale single-purpose dep into the L1 validators layer fails the spirit of `.cursor/rules/always-latest-docs.mdc`. The algorithm is ICAI-documented + well-cited in OSS implementations (tk120404/gst + SGFGOV/gstin-validator) — inline keeps `@repo/validators` dep-free.
- **D5 — PAN 4th-char entity enum surface:** **full enum allowed at parse time** (`P|C|H|F|A|T|B|L|J|G`) but admin-approval queue surfaces non-individual entity types (`C|H|F|A|T|B|L|J|G`) with a "verify additional documents" hint per Income Tax Department PAN structure docs. KYC depth per entity kind is a P18 (web-admin) UX concern, not a vendor-service gate. The Zod enum lives in `packages/validators/src/vendor/india.ts` so other services (P7 product, P13 tax) can reuse it.
- **D6 — Vendor ↔ Better-Auth Org binding:** **1 vendor = 1 `vendor-org` Better-Auth Organization**. The `vendor.vendors` document's `orgId` is a foreign key onto Better-Auth's `organization.id` (lives in the isolated `lotusgift_auth` database per P5b decision D15). Warehouse-level role assignments (warehouse-manager + inventory-manager) use Better-Auth's organization-membership API with an extension property `assignedWarehouseIds: string[]` (P5b shipped the org plugin but the membership-extension lands here). Multi-vendor-per-org explicitly disallowed at MVP — keeps the auto-router + payout-ledger semantics 1:1.
- **D7 — Multi-warehouse limit per tier (HARD cap):** `Starter = 1` warehouse, `Growth = 5`, `Enterprise = unlimited` (default). Configurable via `services/vendor-service/src/config/tier-limits.config.ts` (consumed by both vendor-service warehouse-create endpoint AND P14 promotions-service when subscriptions ship). HARD cap returns `ProblemDetails 422 { code: 'WAREHOUSE_TIER_LIMIT_EXCEEDED', detail, currentCount, tierMax }` at warehouse-create time. Soft cap (warn + email vendor) explicitly rejected — silent capacity overshoots are operationally confusing. **Awaiting user sign-off on the exact tier breakdown — see Q3.**
- **D8 — Auto-approve vs admin-approve gate:** **HARD admin-approve gate** for ALL new vendors at MVP. No auto-approval pathway (even for existing `corporate-buyer-org` accounts upgrading to also-be a `vendor-org`). Reasoning: marketplace-trust-foundation; auto-approval shipping later (P18 admin-policy configurator) is additive, retrofitting an admin-gate later is breaking. Existing-buyer fast-track parked as Q4.
- **D9 — Service zone storage (dual mode):** Mongoose discriminated union on the warehouse document — `serviceZone.mode = 'pincodes'` with `serviceZone.pincodes: string[]` (cheap, no index needed beyond a compound on `[state, pincodes]`) OR `serviceZone.mode = 'polygon'` with `serviceZone.polygon: GeoJSON.MultiPolygon`. The polygon-backed warehouses get a `2dsphere` index on `serviceZone.polygon`; the `$geoWithin` query at shipping-rate-quote time (P11) finds candidate warehouses for a recipient coordinate. **Atlas M0 confirmed supports `2dsphere`** (M0 limits doc lists storage + replica + backup caps but NOT geospatial features — citation #7 retrieval 2026-05-15). The 3 Atlas Search index budget (allocated to products/vendors/orders per parent plan §9) is **separate** from `2dsphere` indexes — no quota conflict.
- **D10 — Indian states + UTs enum:** **ISO 3166-2:IN** literal-union baked into `packages/types/src/india.ts` as `IN_STATE_CODES` (36 entries: 28 states + 8 UTs). Zod parser in `packages/validators/src/vendor/india.ts`. Used by warehouse address (P6 here), recipient-list row (P9c), and tax-service GST origin/destination computation (P13). Source: Wikipedia ISO 3166-2:IN page (post-2019 J&K split into J&K + Ladakh + 2020 Dadra-Nagar-Haveli + Daman-Diu merger reflected).
- **D11 — Pickup SLA + carrier cutoff schema:** per-warehouse embedded sub-doc `carrierCutoffs: { [carrier in 'shiprocket'|'delhivery'|'bluedart']: { cutoffByWeekday: Record<'mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun', 'HH:mm' | null> } }`. Reasoning: Shiprocket's same-day pickup deadline is 4 PM standard / 2 PM for next-day-delivery products + Delhivery's manual-pickup cutoff is 2 PM, and both vary by zone — encoding per-weekday-per-carrier captures Sunday closures + zone-specific differences (citations #11–#12). Pickup SLA itself (`pickupSlaHours`) is the lead-time from order-placed-to-picked-up; defaults to 24h. Holiday-calendar overrides parked to P11 shipping-service.
- **D12 — Onboarding wizard state machine:** **inline exhaustive-switch** guard in `onboarding.service.ts`, NOT `xstate`. The wizard is 6 linear steps (`BASIC → KYC → BANK → WAREHOUSES → TIER → SUBMITTED_FOR_REVIEW`) with no loops, no parallel regions, no spawning children — XState's 56 KB minified + actor model + statechart authoring overhead doesn't pay off for a strictly-linear 6-step flow. If/when the wizard grows (per-tier upsell branches, KYC re-submission paths), refactor to XState v5 in a dedicated PR. XState v5.31.1 is current per npm 2026-05-15 — pinned as the upgrade target.
- **D13 — Sliding commission schedule:** per-tier × per-category-bucket commission-rate matrix as a TS constant in `services/vendor-service/src/config/commission-rates.config.ts`. Per-vendor override via `vendor.vendors.commissionOverride?: { categoryBucket: string; ratePct: number }[]` (admin-only field). Read API `GET /api/vendors/:id/commission-rate?categoryBucket=corporate-gifts` returns the resolved rate. P9 order-service queries this at order-line price computation; P10 payment-service consumes the same lookup for payout calculation. The actual sliding curve (volume-based discounts within a tier) lands as Q5 — defer the algorithm definition until ops/finance signs off.
- **D14 — Payouts ledger MVP scope:** **READ-only at MVP**. Schemas live here (`vendor.payouts` collection); the WRITE path is gated to P10 payment-service which consumes `payment.captured.v1` events + computes commission + emits `payout.requested.v1` that vendor-service subscribes to (Q-handler signature stubbed; impl in P10). MVP exposes `GET /api/vendors/:id/payouts` returning an empty array until P10 wires the producer. Razorpay PayoutLink integration parked to P10 alongside the fund-account-validation decision (D3 stub).
- **D15 — Per-warehouse SLA scoring MVP scope:** schemas live here (`vendor.warehouse_sla_scores` with per-warehouse-per-day rollups: `{ warehouseId, date, ordersPickedOnTime, ordersPickedLate, sla7DayAvg }`); the **compute cron** lands at P21 (observability hardening) alongside Grafana dashboards. MVP exposes `GET /api/warehouses/:id/sla-score?days=7` returning empty arrays. Justification: SLA scoring is a derived metric that needs P11 shipping events + P21 cron infra — building the writer without those dependencies invites rewriting it.
- **D16 — Operating hours timezone:** **Asia/Kolkata fixed** for MVP. Encoded as `operatingHours: Record<'mon'..'sun', { open: 'HH:mm'; close: 'HH:mm' } | { closed: true }>` interpreted in IST. Multi-timezone support (international vendor expansion) parked to `docs/runbooks/scaling-up.md` — the schema is forward-compat (just adds a `timezone` field per-warehouse later).
- **D17 — `ownerType` forward-compat discriminator:** `warehouse.ownerType: 'vendor' | 'platform'` from day one. `platform` (FBA-style platform-owned warehouses) is parked to scaling-up.md but the discriminator lives in the schema today so we don't migrate every warehouse row when platform-owned launches. MVP only `vendor` is enforced at the controller layer (returns 400 if platform passed).
- **D18 — Analytics instrumentation:** the **5 vendor events** already listed in `docs/analytics/events.md` (vendor onboarding-started / vendor kyc-submitted / vendor activated / warehouse added / vendor tier-upgraded) emit via `@repo/analytics-sdk/server.capture()` inside each service write path AFTER the outbox transaction commits (so failed transactions don't ghost-emit). PII (GSTIN/PAN/phone/email) auto-redacted via the SDK's `@repo/utils.redact` pre-flight — only `org_id`/`vendor_id`/`warehouse_id`/`state`/`tier` shapes ship.
- **D19 — `@RequireRole(role)` decorator:** lightweight EXTENSION of the existing global `AuthGuard` from P5b. Uses `SetMetadata(REQUIRE_ROLE_KEY, role)` + the guard reads it via `Reflector`. Does NOT create a second guard. Throws `ForbiddenException` with `code: 'ROLE_INSUFFICIENT', requiredRole, currentRoles` ProblemDetails on mismatch.
- **D20 — `@nestjs/mongoose` choice:** **adopted here at L4** for the first time in the repo. The L2 `@repo/database` deliberately stays raw Mongoose 8 (per phase-3 decision D6) so it can be consumed by Lambda/Worker contexts; the Nest binding lives at L4. `MongooseModule.forFeature([...schemas])` registered in `VendorServiceModule`. This is the established Nest convention + matches the gateway's existing P4 `MongooseModule.forRoot(env.MONGODB_URI)` wiring.
- **D21 — Service library shape mirrors auth-service:** Nest framework packages declared as `peerDependencies` (per P5b decision D14 — avoids DI-singleton splits from double-installed `@nestjs/core`). `mongoose` ALSO as peer (matches the auth-service convention for `mongodb`); the gateway provides the shared instance.

## Files (~50–70 across 1 service + 3 L1 package extensions + tests + research note + GitHub)

### `@repo/types` extensions

- `packages/types/src/india.ts` — `IN_STATE_CODES` const array of 36 ISO 3166-2:IN codes + `InStateCode` derived literal type + `IN_STATE_NAMES` Record for display + `WAREHOUSE_OWNER_TYPES = ['vendor', 'platform'] as const` + `WarehouseOwnerType` + `VENDOR_TIER_KEYS = ['STARTER', 'GROWTH', 'ENTERPRISE'] as const` + `VendorTierKey` + `KYC_STATUS_KEYS = ['PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED'] as const` + `KycStatusKey` + `PAN_ENTITY_KINDS = ['P','C','H','F','A','T','B','L','J','G'] as const` + `PanEntityKind` + branded type `IfscCode = Brand<string, 'IfscCode'>` + `UpiVpa = Brand<string, 'UpiVpa'>`.
- `packages/types/src/index.ts` — barrel re-exports the new public types.

### `@repo/validators/src/vendor/` (populates the empty P2 shell)

- `india.ts` — `InStateCodeSchema = z.enum(IN_STATE_CODES)`, `PanEntityKindSchema = z.enum(PAN_ENTITY_KINDS)`, `KycStatusSchema = z.enum(KYC_STATUS_KEYS)`, `VendorTierSchema = z.enum(VENDOR_TIER_KEYS)`, `WarehouseOwnerTypeSchema = z.enum(WAREHOUSE_OWNER_TYPES)`.
- `pan.ts` — `PanSchema` (10-char `[A-Z]{3}[PCHFATBLJG][A-Z][0-9]{4}[A-Z]` regex + uppercase normalization + branded `PanIndia` type — added to types/scalars.ts alongside).
- `ifsc.ts` — `IfscSchema` (`^[A-Z]{4}0[A-Z0-9]{6}$` regex + uppercase + branded).
- `upi-vpa.ts` — `UpiVpaSchema` (`^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$` regex + lowercase normalization + branded).
- `bank-account.ts` — `BankAccountSchema = z.object({ accountNumber: z.string().regex(/^\d{9,18}$/), ifsc: IfscSchema, holderName: z.string().min(2).max(120), accountType: z.enum(['savings','current']) })`.
- `gstin-checksum.ts` — `assertGstinChecksumValid(gstin: string): boolean` (mod-36 implementation per ICAI spec) + `GstinWithChecksumSchema` that wraps the existing `GstinIndiaSchema` (regex-only, P2) with a `superRefine` calling the checksum function.
- `onboarding-request.ts` — `VendorBasicStepSchema` (display name + contact email + contact phone) + `KycStepSchema` (gstin + pan + entityKind + supportingDocsR2Keys) + `BankStepSchema` (composes BankAccountSchema + optional UPI) + `WarehousesStepSchema` (≥1 warehouse object) + `TierStepSchema` (selected tier).
- `warehouse-row.ts` — `OperatingHoursSchema` (per-weekday open/close or closed) + `CarrierCutoffSchema` (`shiprocket|delhivery|bluedart` × per-weekday `HH:mm`-or-null) + `ServiceZoneSchema` (discriminated union — `{ mode: 'pincodes', pincodes: PincodeIndiaSchema[] }` OR `{ mode: 'polygon', polygon: GeoJsonMultiPolygonSchema }`) + `GeoJsonPointSchema` + `GeoJsonMultiPolygonSchema` + `WarehouseAddressSchema` (line1/line2?/landmark?/city/state via InStateCodeSchema/pincode) + `WarehouseCreateRequestSchema` (all of the above + ownerType + pickupSlaHours) + `WarehouseUpdateRequestSchema` (partial) + `WarehouseResponseSchema` + `WarehouseListResponseSchema` (pagination via PaginatedSchema from P2).
- `tier-upgrade.ts` — `TierUpgradeRequestSchema = z.object({ toTier: VendorTierSchema })` + `TierMatrixResponseSchema = z.array(z.object({ tier, monthlyPriceInr, commissionPct, maxWarehouses, features: z.string().array() }))`.
- `payout-row.ts` — `PayoutRowSchema` (read-only — vendorId + periodStart/End + grossPaise + commissionPaise + netPaise + status + razorpayPayoutId?) + `PayoutListResponseSchema`.
- Extend `packages/validators/src/index.ts` barrel with the 9 new schema modules' public exports.

### `@repo/events/src/vendor/` (populates the empty shell)

- `onboarding-started.v1.ts` — `defineEvent('vendor.onboarding-started.v1', z.object({ orgId, vendorId, startedBy }))`.
- `kyc-submitted.v1.ts` — `defineEvent('vendor.kyc-submitted.v1', z.object({ orgId, vendorId, kycSubmissionId, gstin: GstinIndiaSchema, panEntityKind: PanEntityKindSchema }))`. Note: GSTIN is emitted on the event so consumer services (tax-service P13, notification-service P12) don't have to re-fetch — pre-hashed in the redaction layer if needed.
- `activated.v1.ts` — `defineEvent('vendor.activated.v1', z.object({ orgId, vendorId, approvedBy, activatedAt: IsoDateTimeSchema }))`.
- `warehouse-added.v1.ts` — `defineEvent('vendor.warehouse-added.v1', z.object({ orgId, vendorId, warehouseId, state: InStateCodeSchema, pincode: PincodeIndiaSchema }))`.
- `tier-upgraded.v1.ts` — `defineEvent('vendor.tier-upgraded.v1', z.object({ orgId, vendorId, fromTier: VendorTierSchema, toTier: VendorTierSchema, effectiveAt: IsoDateTimeSchema }))`.
- `packages/events/src/vendor/index.ts` — barrel re-exports the 5 events.

### `services/vendor-service/src/`

- `schemas/vendor.schema.ts` — Mongoose schema for `vendor.vendors` (orgId FK + status + tier + commissionOverride? + contact display fields + audit) with `baseSchemaPlugin` + collection name from `namespace('vendor', 'vendors')`.
- `schemas/warehouse.schema.ts` — `vendor.warehouses` with embedded address + GeoJSON.Point `location` field + `2dsphere` compound index on `location` + on `serviceZone.polygon` (conditional via index spec) + operatingHours + carrierCutoffs + serviceZone discriminated subdoc + ownerType + enabled + pickupSlaHours.
- `schemas/kyc-submission.schema.ts` — `vendor.kyc_submissions` append-only with full GSTIN + PAN + bankAccount (encrypted-at-rest via Mongo field-level encryption — parked to P21; MVP stores plaintext + relies on @repo/utils.redact at log boundaries) + reviewerId + reviewedAt + decision.
- `schemas/payout.schema.ts` — `vendor.payouts` read-only at MVP.
- `schemas/tier-history.schema.ts` — `vendor.tier_history` append-only.
- `schemas/warehouse-sla-score.schema.ts` — `vendor.warehouse_sla_scores` per-warehouse-per-day rollup.
- `services/vendor.service.ts` — vendor profile CRUD + status transition guards.
- `services/onboarding.service.ts` — 6-step linear wizard state machine.
- `services/kyc.service.ts` — GSTIN mod-36 + PAN + IFSC + UPI VPA + bank-account validation + writes `kyc_submissions` + emits `vendor.kyc-submitted.v1`.
- `services/warehouse.service.ts` — warehouse CRUD + Nominatim geocoding wrapper (1 req/sec semaphore + 24h LRU cache + `User-Agent: 'LotusGift v2 (P6 vendor-service)/<gw-sha>'` per OSM policy) + `ServiceZoneValidator` + emits `vendor.warehouse-added.v1`.
- `services/tier.service.ts` — tier upgrade/downgrade + commission-rate matrix lookup + writes `tier_history` + emits `vendor.tier-upgraded.v1` + enforces per-tier warehouse-count caps.
- `services/payout.service.ts` — READ-ONLY list/get APIs at MVP.
- `services/sla-scoring.service.ts` — READ-ONLY list/get APIs at MVP.
- `config/commission-rates.config.ts` — sliding tier × category-bucket matrix constants.
- `config/tier-limits.config.ts` — per-tier warehouse-count + product-listing caps.
- `controllers/vendor.controller.ts` — `/api/vendors` CRUD.
- `controllers/onboarding.controller.ts` — `/api/vendors/onboarding`.
- `controllers/admin-approval.controller.ts` — `/api/admin/vendor-approvals` (gated by `@RequireRole('admin')`).
- `controllers/warehouse.controller.ts` — `/api/vendors/:vendorId/warehouses` + `/api/warehouses/search` (internal — for shipping-service cross-service read).
- `controllers/tier.controller.ts` — `/api/vendors/:id/tier` + `/api/vendor-tiers`.
- `controllers/payout.controller.ts` — `/api/vendors/:id/payouts` read-only.
- `decorators/require-role.decorator.ts` — `@RequireRole(role)` + `REQUIRE_ROLE_KEY` symbol.
- `vendor-service.module.ts` — `MongooseModule.forFeature` for all 6 schemas + 7 services + 6 controllers wired.
- `index.ts` — barrel re-exports `VendorServiceModule` + the 5 v1 event type re-exports + `RequireRole` decorator + service tokens.
- `package.json` — Nest framework packages as `peerDependencies` per P5b D14 + `mongoose ^8` as peer + `@nestjs/mongoose ^11` as direct dep + `@repo/database` + `@repo/types` + `@repo/validators` + `@repo/events` + `@repo/utils` + `@repo/analytics-sdk` + `@repo/config` workspace deps + `lru-cache ^11` direct dep (geocode cache).
- `tsconfig.json` — extends `@repo/typescript-config/library.json` with `useDefineForClassFields: false` (per P5b lesson #6) + `experimentalDecorators: true`.
- `jest.config.ts` — extends `@repo/jest-config/library` per P5b convention.
- `README.md` — module purpose + onboarding wizard flow diagram + KYC validation matrix + warehouse schema reference + cross-service consumer table (P9 order, P11 shipping, P10 payment, P13 tax, P14 promotions all read from here).

### `apps/api-gateway/src/`

- `app.module.ts` — import + register `VendorServiceModule` (right after `AuthServiceModule.forRoot(env)`).
- `package.json` — add `@lotusgift/vendor-service: workspace:*`.
- `Dockerfile` — add `services/vendor-service/package.json` to deps stage COPY block + `services/vendor-service` directory copy in build stage.

### `packages/config/src/env.schema.ts`

- Add 3 optional vendor-service env vars (all default-friendly so dev works without setup): `NOMINATIM_BASE_URL` (default `https://nominatim.openstreetmap.org/search`), `NOMINATIM_USER_AGENT` (default `LotusGift-v2-Dev/0.1`, prod superRefine requires explicit override), `GEOCODE_CACHE_TTL_SECONDS` (default `86400`).

### `.env.example`

- Append the 3 new entries under a `# ---- OSM Nominatim (P6 vendor-service warehouse geocoding) ----` comment header.

### Tests (~18–22 across 7 spec files)

- `services/vendor-service/src/services/kyc.service.spec.ts` — GSTIN mod-36 checksum positive (known-good `27AAPFU0939F1ZV` from research cite #1) + negative (corrupted check char) + edge cases (all-numeric segments, mixed-case input normalization); PAN format + 4th-char enum branches per `PAN_ENTITY_KINDS`; IFSC regex (positive `SBIN0125620` + negative wrong-5th-char `SBIN1125620`); UPI VPA positive `name@bank` + negative whitespace + missing `@`; bank-account length boundary 9/18/19.
- `services/vendor-service/src/services/warehouse.service.spec.ts` — Nominatim wrapper with stubbed `fetch` — happy path + 429 retry-after + rate-limit semaphore enforces 1 req/sec across concurrent callers + 24h cache hit short-circuits the network call; 2dsphere index assertion via Mongoose schema introspection (`schema.indexes()` includes `[{ location: '2dsphere' }, ...]`); service-zone discriminated-union round-trip (pincodes mode + polygon mode).
- `services/vendor-service/src/services/tier.service.spec.ts` — commission-rate lookup matrix per tier × category bucket (3 × 3 = 9 assertions); warehouse-count cap enforcement (Starter user creating a 2nd warehouse → 422 with WAREHOUSE_TIER_LIMIT_EXCEEDED); per-vendor override beats tier default.
- `services/vendor-service/src/services/onboarding.service.spec.ts` — 6-step linear state machine — forward transitions allowed (BASIC → KYC OK, KYC → BANK OK, etc.); backward (KYC → BASIC) rejected with state-machine error; skip (BASIC → BANK) rejected; per-step partial-validation (KYC step validates the GSTIN-checksum schema, BANK step validates the IFSC, etc.).
- `services/vendor-service/src/controllers/vendor.controller.spec.ts` — CRUD via `@AllowAnonymous` on signup (creates DRAFT vendor + emits `vendor.onboarding-started.v1`); auth-gated on update (401 without session, 200 with active org member session); admin-only list filter (non-admin → 403).
- `services/vendor-service/src/controllers/admin-approval.controller.spec.ts` — `@RequireRole('admin')` 403 on non-admin session; activation happy path persists status flip + emits `vendor.activated.v1` with correct payload; rejection flow with reason.
- `services/vendor-service/src/decorators/require-role.decorator.spec.ts` — `SetMetadata(REQUIRE_ROLE_KEY, 'admin')` wiring + `Reflector.get` lookup roundtrip.

### Research note

- `docs/research/phase-6-vendor-service.md` — ≥12 retrieval-dated 2026-05-15 citations + ≥12 decisions + ≥3 open questions + implementation checklist + versions captured table. **Draft citation table is in §"Research-note citation table draft" below** so the user can sanity-check sources before kickoff.

### GitHub

- Phase 6 milestone (#7 if not yet seeded — verify first via `gh api repos/goldr0g3r/lotusgift/milestones`).
- Phase 6 Epic issue (`phase/P6,area/infra,epic` labels) under that milestone.
- Phase 6 Phase-Acceptance issue (`phase/P6,phase-acceptance` labels) under that milestone.

## Research-note citation table draft (for sanity-check before kickoff)

The execution-time research note `docs/research/phase-6-vendor-service.md` ships with this table — included here so the user can confirm the sources before any code lands.

| # | Topic | URL | Notes |
| --- | --- | --- | --- |
| 1 | GSTIN mod-36 checksum algorithm | <https://stackoverflow.com/questions/44431819/regular-expression-for-gst-identification-number-gstin> | Position-based char-to-numeric mapping + mod-36 wrap; ICAI-documented; cited OSS impls in `tk120404/gst` + `SGFGOV/gstin-validator`. Algorithm: per char (except last 14) multiply by `(pos%2+1)`, if result >36 use `1+(result-36)`, sum all, check char = `36 - (sum%36)` mapped back to `0-9|A-Z`. Known-good test vector: `27AAPFU0939F1ZV`. |
| 2 | `gstin-validator` npm staleness check | <https://www.npmjs.com/package/gstin-validator> | Last published Sept 2020 (v1.1.3). Stale per `.cursor/rules/always-latest-docs.mdc` 14-day fresh-dep policy → implement inline. |
| 3 | India PAN structure + 4th-char entity kind | <https://www.incometaxindia.gov.in/documents/d/guest/1-permanent-account-number-pan-pdf> | Official Income Tax Dept PDF: 10-char `[A-Z]{3}[CPHABGJLFT][A-Z][0-9]{4}[A-Z]`. 4th char enum: P=individual, C=company, H=HUF, F=firm/LLP, A=AOP, T=trust, B=BOI, L=local authority, J=juridical, G=government. |
| 4 | IFSC code format | <https://en.wikipedia.org/wiki/Indian_Financial_System_Code> | 11-char `^[A-Z]{4}0[A-Z0-9]{6}$` — 4-letter bank code + literal `0` + 6-char branch code (typically numeric but alpha allowed). Valid example: `SBIN0125620`. |
| 5 | UPI VPA format | <https://www.geeksforgeeks.org/dsa/validating-upi-ids-using-regular-expressions/> | `^[a-zA-Z0-9.-]{2,256}@[a-zA-Z]{2,64}$` — identifier + `@` + provider, no whitespace, no multiple `@`. |
| 6 | OSM Nominatim usage policy | <https://operations.osmfoundation.org/policies/nominatim/> | **Max 1 req/sec absolute**. Bulk (long-running scripts): 4 req/min. Required: HTTP Referer or User-Agent identifying the app; ODbL attribution; results must be cached client-side. Self-hosted instance recommended for higher throughput. |
| 7 | MapMyIndia Mappls Geocoding (upgrade path) | <https://about.mappls.com/api/search-and-geocoding/> | India-focused alternative. Free tier requires sign-up; pincode-level `podFilter`; 238-country coverage. Pricing not public — quote per use case. Documented in `scaling-up.md` as the upgrade target when Nominatim throughput insufficient. |
| 8 | MongoDB 2dsphere + GeoJSON polygon | <https://www.mongodb.com/docs/manual/reference/geojson/> | `2dsphere` index supports GeoJSON Point/LineString/Polygon/MultiPolygon. `$geoWithin` for "find warehouses whose service-zone contains this point" queries. |
| 9 | Atlas M0 free-tier limits | <http://www.mongodb.org/docs/atlas/reference/free-shared-limitations/> | M0 confirmed runs MongoDB 8.0; storage + replica + backup + cluster-config caps documented but **NO restrictions on 2dsphere indexes or GeoJSON queries**. The 3 Atlas Search index budget is a separate quota (allocated to products/vendors/orders per parent plan §9). |
| 10 | ISO 3166-2:IN states + UTs | <https://en.wikipedia.org/wiki/ISO_3166-2:IN> | 28 states + 8 UTs. Post-2019: J&K split into J&K + Ladakh. Post-2020: Dadra-Nagar-Haveli + Daman-Diu merged into IN-DH. Full code list baked into `packages/types/src/india.ts`. |
| 11 | Shiprocket pickup cutoffs | <https://www.shiprocket.in/instant-pickup-services/> | Standard same-day pickup cutoff **4 PM**; for next-day-delivery products **2 PM**. Instant pickup = 2-hour SLA in 7 metros (Delhi NCR, Mumbai, Bengaluru, Kolkata, Ahmedabad, Surat, Jaipur). Zones: A=intracity, B=intercity, C=metro-metro. |
| 12 | Delhivery pickup cutoffs | <https://help.delhivery.com/docs/pickup-request> | Manual pickup cutoff **2 PM** for same-day pickup. Auto-pickup configurable per location. Economy dispatch cutoff 12–1 PM. No public Sunday/holiday calendar — encoded as nullable per-weekday slot. |
| 13 | Razorpay Fund-Account Validation API | <https://razorpay.com/docs/x/fund-account-validation/> | RazorpayX Lite endpoint `POST /v1/fund_accounts/validations` — verifies beneficiary name + account active. Charges apply (reversed on failure). PARKED to P10 when live Razorpay keys ship. |
| 14 | XState v5.31.1 status | <https://www.npmjs.com/package/xstate> | Latest v5.31.1 (2026-05-10). 5.1M weekly downloads. Zero deps. Requires TypeScript ≥5.0. Not adopted at P6 (6-step linear wizard doesn't warrant 56 KB + actor model); pinned as future upgrade target. |
| 15 | nestjs-zod 5.3 createZodDto pattern | <https://www.npmjs.com/package/nestjs-zod> | v5.3.0 (released 2026-04-05). Pairs `createZodDto(ZodSchema)` with `@ZodResponse({ type: Dto })` for round-trip request + response validation. Already wired globally at the gateway (P4 PR-13 `app.module.ts` providers — `APP_PIPE: ZodValidationPipe`, `APP_INTERCEPTOR: ZodSerializerInterceptor`). |
| 16 | Better-Auth Organization plugin (cross-ref P5b) | <https://www.better-auth.com/docs/plugins/organization> | One vendor-org Organization = one vendor profile. Organization-membership API exposed; `assignedWarehouseIds` extension via the `metadata` field on `members`. |

## Open questions parked for sub-plan refinement (user input wanted before kickoff)

- **Q1 — Geocoding provider final pick:** Decision D2 defaults to **OSM Nominatim** (free, 1 req/sec, 24h cache). MapMyIndia/Mappls offers a free tier but pricing isn't public; Google Maps Geocoding is paid (~$5 per 1000 reqs after the $200/mo free credit). **Recommendation:** Nominatim for MVP, MapMyIndia upgrade-path on day 1 of >50 warehouse registrations/day. **Needs user sign-off on accepting OSM's data-quality + ODbL attribution requirement.**
- **Q2 — KYC depth at MVP:** Decision D3 defaults to **regex + checksum only** (no live API verification). Razorpay fund-account-validation (~₹0.50–₹2/verification, reversed on failure) requires live Razorpay keys which don't exist until P10. **Recommendation:** ship D3 as-is; subscribe to `vendor.kyc-submitted.v1` from P10 and enrich the submission asynchronously with the Razorpay verification result. **Alternative:** delay vendor activation until P10 ships — but that blocks the entire MVP launch on a P10 dependency. **Needs user sign-off on the async-enrichment plan.**
- **Q3 — Multi-warehouse limit per tier:** Decision D7 defaults to **Starter=1, Growth=5, Enterprise=unlimited**. These numbers are placeholder until promotions-service (P14) ships the actual tier pricing. **Needs user sign-off on the exact breakdown** (or flag as TBD-from-P14 and start with 3 / 10 / unlimited as a more generous MVP default).
- **Q4 — Auto-approve vs admin-approve gate:** Decision D8 defaults to **HARD admin-approve gate for ALL new vendors**. **Alternative:** auto-approve for existing `corporate-buyer-org` accounts that pass KYC (Their org is already trusted by the platform; double-gating is friction.) **Recommendation:** ship D8 as-is — admin-approval is the safer marketplace-trust default; add the fast-track later as an admin-policy toggle in P18.
- **Q5 — SLA scoring algorithm:** Decision D15 defers the **compute writer** to P21. The READ APIs land here returning empty arrays. **Needs user sign-off on the deferral** — alternative would be a placeholder mock-scorer that hard-codes 95% per warehouse (acceptable for dashboard wireframes but misleading for vendor expectation-setting). **Recommendation:** stick with empty arrays + "Coming P21" UX hint until real data flows.

## Implementation cadence

- **~50–70 files** in a single PR (PR-16) per the established pattern:
  - 9 files in `packages/types/src/india.ts` + barrel update
  - 9 files in `packages/validators/src/vendor/` + barrel update
  - 5 files in `packages/events/src/vendor/` + barrel update
  - ~36 files in `services/vendor-service/src/` (6 schemas + 7 services + 2 configs + 6 controllers + 1 decorator + module + barrel + tests + jest.config + README + package.json + tsconfig)
  - 3 file edits in `apps/api-gateway/` (`app.module.ts`, `package.json`, `Dockerfile`)
  - 2 file edits in `packages/config/` + `.env.example`
  - 1 new file: `docs/research/phase-6-vendor-service.md`
- **~18–22 individual tests** across 7 spec files
- **~3–5 commits squashed** (initial bulk + Copilot review iterations + likely lockfile re-sync after `pnpm install` + likely Dockerfile fix for new workspace dep)
- **Expected runtime:** 1.5–2 hours from PR-open to merge given the CI cycle (16 required checks; `build-push` is the long pole at 5–10 min for the multi-arch image)

## Acceptance criteria

- `pnpm check-types` — 34/34 green (was 33; +1 for `@lotusgift/vendor-service`).
- `pnpm lint` — 37/37 green.
- `pnpm test` — 16–18/16–18 turbo tasks green (current 15 + vendor-service suites).
- `pnpm build` — 9/9 green.
- `pnpm dep-cruiser` — 0 errors (the L4 microservice-boundaries rule catches any accidental direct cross-service import).
- `pnpm dlx markdownlint-cli2 docs/research/phase-6-vendor-service.md .cursor/plans/p6_vendor_service_pr-16_73c63961.plan.md` — 0 errors.
- All 16 required CI checks green on PR-16's final commit.
- `/api/vendors/onboarding` round-trips: POST step-1 → 200 with next-step hint → POST step-6 → 200 with `status: 'submitted_for_review'`.
- `/api/admin/vendor-approvals/:id/approve` from an admin session flips `vendor.status` to `ACTIVATED` AND emits `vendor.activated.v1` to the outbox AND captures the analytics event.
- `/api/vendors/:id/warehouses` POST geocodes via Nominatim within the 1 req/sec semaphore + caches the result + populates `location.coordinates` + persists `2dsphere`-indexed.
- Vendor in `DRAFT` or `PENDING_REVIEW` status CANNOT create products (enforced by P7 product-service which reads `vendor.vendors.status` via the gateway internal-client; P6 only needs to expose that read path).
- Copilot review addressed.
- Admin squash-merged, branch deleted local + remote.
- Parent plan `p6` todo flipped to `status: completed` (separate post-merge commit; sub-plan flip from `pending → in_progress → completed` mirrors P5b status-sync workflow).
- Phase 6 milestone closed.

## Status-sync closing step (post-merge)

1. `git checkout main && git pull && git branch -d pr-16-vendor-service && git push origin --delete pr-16-vendor-service`.
2. `gh issue close <epic-num> --reason completed` + `gh issue close <acceptance-num> --reason completed`.
3. `gh api -X PATCH repos/goldr0g3r/lotusgift/milestones/<phase-6-num> -f state=closed`.
4. Update parent plan `p6` todo content (PR-16 squash SHA + 1-paragraph delivery summary) + `status: completed`.
5. Backfill `docs/research/phase-6-vendor-service.md` §6 with PR-16 link + squash SHA + lessons learned (e.g. any Copilot review themes worth carrying into P7).
6. Project board: add PR + issues via `gh project item-add`, then `gh project item-edit` for Status=Done / Phase=P6 / Workstream=vendor / Layer=L4 / Type=feat.
7. `git push origin main` for the closeout commit.
