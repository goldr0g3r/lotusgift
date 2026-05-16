# Phase 7 — services/product-service (PR-17)

## 1. Goal

Ship `services/product-service` end-to-end in a single PR so the marketplace gains its catalog half: corporate-gifting product taxonomy (occasion / recipientType / customizable / brandingAreas / moq / leadTimeDays / sampleAvailable / hsnCode), variant subdoc array with 2D `attributes` matrix, per-product image gallery on Cloudflare R2 via 5-minute presigned PUT URLs (mime-whitelist + post-upload HEAD validation), MongoDB Atlas Search mapping for products (allocates 1-of-3 of the M0 search-index budget, dev-mode `$regex` fallback), page-based search with facet counts, buyer-review moderation queue, and 5 outbox events (`created.v1`, `updated.v1`, `status-changed.v1`, `image-uploaded.v1`, `review-submitted.v1`).

This phase **populates** the empty P2 shells (`@repo/validators/product`, `@repo/events/product`) and extends `@repo/types` with `product-categories.ts` so future phases (P8 inventory, P9 order, P9b RFQ, P11 shipping, P12 notification, P13 tax, P14 promotions, P15 insights, P16 web-customer, P17 web-vendor, P18 web-admin) can consume the taxonomy + variant + event types without circular imports.

This phase also introduces the **`StockReadPort` cross-service contract** at `@repo/utils` — a stub at P7, real impl at P8 inventory-service. Documented in [`docs/architecture/cross-service-contracts.md`](../architecture/cross-service-contracts.md).

Q1–Q5 from the sub-plan are resolved with the defaults the user pre-approved (see §3 Decisions D2/D3/D4/D5/D6).

## 2. Citations table (retrieval-dated 2026-05-15)

| # | Topic | Title | URL | Retrieved |
| --- | --- | --- | --- | --- |
| 1 | MongoDB Atlas Search overview + M0 free-tier compat | About Atlas Search — MongoDB Atlas Docs | <https://www.mongodb.com/docs/atlas/atlas-search/atlas-search-overview/> | 2026-05-15 |
| 2 | Atlas Search field-mapping (static mappings) | Define Field Mappings in Atlas Search — MongoDB Atlas Docs | <https://www.mongodb.com/docs/atlas/atlas-search/define-field-mappings/> | 2026-05-15 |
| 3 | Atlas Search `lucene.standard` analyzer | Standard Analyzer — MongoDB Atlas Docs | <https://www.mongodb.com/docs/atlas/atlas-search/analyzers/standard/> | 2026-05-15 |
| 4 | Atlas Search autocomplete operator (edgeGram) | autocomplete — Atlas Search Operators | <https://www.mongodb.com/docs/atlas/atlas-search/autocomplete/> | 2026-05-15 |
| 5 | Atlas Search facets via `$searchMeta` | Facet — Atlas Search Operators | <https://www.mongodb.com/docs/atlas/atlas-search/facet/> | 2026-05-15 |
| 6 | Atlas Search M0 free-tier limits + 3 search-index cap | Atlas M0 (Free Cluster) limits — MongoDB Atlas Docs | <https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/> | 2026-05-15 |
| 7 | AWS SDK for JavaScript v3 S3 client | @aws-sdk/client-s3 — npm | <https://www.npmjs.com/package/@aws-sdk/client-s3> | 2026-05-15 |
| 8 | AWS SDK S3 request presigner | @aws-sdk/s3-request-presigner — npm | <https://www.npmjs.com/package/@aws-sdk/s3-request-presigner> | 2026-05-15 |
| 9 | Cloudflare R2 S3 API compatibility | Use the S3 API to interact with R2 — Cloudflare Docs | <https://developers.cloudflare.com/r2/api/s3/api/> | 2026-05-15 |
| 10 | Cloudflare R2 presigned URL spec (max 7d expiry) | Presigned URLs — Cloudflare R2 Docs | <https://developers.cloudflare.com/r2/api/s3/presigned-urls/> | 2026-05-15 |
| 11 | CBIC HSN code (4/6/8-digit format) | HSN Code Classification — Central Board of Indirect Taxes and Customs (CBIC) | <https://www.cbic.gov.in/htdocs-cbec/gst/hsn_codes/hsn_classification> | 2026-05-15 |
| 12 | Mongoose subdoc array vs discriminator | Subdocuments — Mongoose Docs | <https://mongoosejs.com/docs/subdocs.html> | 2026-05-15 |
| 13 | Mongoose schema indexing (`schema.index()`) | Schema Index — Mongoose Docs | <https://mongoosejs.com/docs/guide.html#indexes> | 2026-05-15 |
| 14 | nestjs-zod 5.3 `createZodDto` pattern | nestjs-zod 5.3.0 — npm | <https://www.npmjs.com/package/nestjs-zod> | 2026-05-15 |
| 15 | `@nestjs/mongoose` 11.0.4 module | @nestjs/mongoose — npm | <https://www.npmjs.com/package/@nestjs/mongoose> | 2026-05-15 |
| 16 | `lru-cache` 11.2.x (atlas-search-sync dedup + category cache) | lru-cache — npm | <https://www.npmjs.com/package/lru-cache> | 2026-05-15 |
| 17 | PostHog Node SDK (server-side capture + shutdown) | posthog-node — PostHog Docs | <https://posthog.com/docs/libraries/node> | 2026-05-15 |
| 18 | RFC 9457 Problem Details (already used at P4) | RFC 9457 — IETF Datatracker | <https://datatracker.ietf.org/doc/html/rfc9457> | 2026-05-15 |

All citations were re-verified within the 14-day freshness window per `.cursor/rules/always-latest-docs.mdc`.

## 3. Decisions log

Decisions D1–D15 are the sub-plan's baked-in decisions (`.cursor/plans/p7_product-service_pr-17_a94f79e1.plan.md`). Q1–Q5 user-approved defaults are folded into D2/D3/D4/D5/D6 (the corresponding decision row notes the Q-mapping).

### D1 — Single PR-17

One `feat(product)` commit covers `@repo/types/product-categories` + `@repo/validators/product` (12 files) + `@repo/events/product` (5 v1 events) + `@repo/utils/stock-read-port` + `services/product-service` end-to-end + api-gateway wiring + atlas-search workflow extension + cross-service-contracts doc. Mirrors PR-13/14/15/16 cadence (single squash, Copilot iteration in follow-up commits).

### D2 — Presigned R2 URLs for image upload (Q1 answer)

`POST /api/products/:productId/images/upload-url` returns a 5-minute presigned PUT URL via `@aws-sdk/s3-request-presigner` ([cite #8](#2-citations-table-retrieval-dated-2026-05-15)) against the R2 S3-compatible endpoint ([cite #9](#2-citations-table-retrieval-dated-2026-05-15)). Client uploads direct to R2 (bandwidth-free egress per Cloudflare R2 pricing). Server `confirm` step HEAD-validates the R2 object + persists the `ProductImage` row.

**Why not stream through the gateway?** Oracle A1.Flex 4 GB RAM has finite multipart buffer headroom; R2 egress is free anyway. Per [cite #10](#2-citations-table-retrieval-dated-2026-05-15), R2 presigned URLs support up to 7-day expiry but 5 min is the sweet spot for the corporate-gifting upload UX (forces a fresh sign per upload).

### D3 — Mongoose subdoc-array variants (Q2 answer)

Per `Subdocuments` ([cite #12](#2-citations-table-retrieval-dated-2026-05-15)), embedded subdocs reduce PDP-load to a single document fetch (vs. a $lookup join if variants were a separate collection). `attributes: Record<string, string>` handles the 2D matrix (size × color × etc.) without separate-collection-per-attribute complexity. Max 200 variants per product enforced in code (Mongoose 16 MB doc limit caps at ~50k variants — plenty of headroom).

### D4 — Flat 2-level category enum (Q3 answer)

`@repo/types.PRODUCT_CATEGORY_KEYS` is a 24-entry flat enum. Tree taxonomy (parent → children → grandchildren) parked to P21 once category volume + analytics inform the depth. Flatness matches Atlas Search `stringFacet` semantics ([cite #5](#2-citations-table-retrieval-dated-2026-05-15)) — every category is a single facet bucket, no path tokenization.

### D5 — Page-based search pagination (Q4 answer)

`?page=1&pageSize=20` query. Cursor-based pagination parked — the product catalog isn't a high-write-rate feed (no insertion races); page-based is the right MVP tradeoff. Cursor-based revisited at P21 if catalog volume + concurrent edits cause page-drift bugs.

### D6 — Auto-rebuild Atlas Search mapping via existing CI workflow (Q5 answer)

`services/product-service/atlas-search-mapping.json` is a sibling file (auto-generated from the TS constant in `src/config/atlas-search-mapping.config.ts`). The existing `.github/workflows/atlas-search-mapping-drift.yml` workflow ([cite #6](#2-citations-table-retrieval-dated-2026-05-15) enforces the 3-index M0 budget) is extended in PR-17 to glob `services/*/atlas-search-mapping.json` AND the legacy `infrastructure/atlas/search/*.json`. Both count toward the cap.

### D7 — Atlas Search vs `$regex` dev fallback

`services/product-service/src/services/search.service.ts` gates on `env.ATLAS_SEARCH_INDEX_NAME` — if set (prod), uses `$search` aggregation against the Atlas Search index; if unset (dev), falls back to `$regex` over name + description. Same controller surface; same response shape; no env-conditional logic in the controller. Avoids dev needing an Atlas cluster locally.

### D8 — Product status state machine (`DRAFT → PENDING_REVIEW → ACTIVE → ARCHIVED` + REJECTED)

Inline exhaustive-switch in `product.service.ts.transitionStatus()` per the P6 D12 precedent (XState rejected for linear flows). Per-transition guards split between vendor (`vendor-submit-for-review`, `vendor-archive`, `vendor-resubmit-after-reject`) and admin (`admin-approve`, `admin-reject`, `admin-archive`, `admin-restore`). Every transition emits `product.status-changed.v1` to the outbox.

### D9 — Product-review moderation (PENDING → APPROVED|REJECTED)

Every buyer review starts `PENDING`. Admin approves → APPROVED (public-visible); admin rejects → REJECTED with reason (hidden + auditable). Auto-approve parked to P14 (promotions-service trust-score integration). One review per (buyerId, productId) enforced via unique compound index.

### D10 — HSN code format (4 OR 6 OR 8 digit)

Per CBIC ([cite #11](#2-citations-table-retrieval-dated-2026-05-15)), HSN codes use 4-digit (small-turnover), 6-digit (most goods), or 8-digit (customs-tariff specifics). `HsnCodeSchema = z.string().regex(/^(\d{4}|\d{6}|\d{8})$/)`. P13 tax-service queries `product.hsn_registry` for the GST-rate lookup at order-line tax computation. Live HSN-rate API integration parked to P13.

### D11 — Image dimensions + mime whitelist

`image/jpeg`, `image/png`, `image/webp` only. AVIF rejected (browser support gaps); SVG rejected (XSS risk via embedded scripts). Max 8 MB per file (enforced at presign + re-verified at confirm via R2 HEAD `Content-Length`). Soft-warn at confirm-time when dimensions are below `hero ≥ 1200×1200` / `gallery ≥ 800×800` recommendations. Image variants (thumbnails, srcset sizes) deferred to a P21 image-transform-on-CDN integration.

### D12 — Vendor-ownership gate (re-impl of P6 pattern)

Every product mutation goes through `ProductOwnershipGuard` which resolves `:productId → product.vendorId → vendor.orgId` via `@Inject(VendorService)` from `@lotusgift/vendor-service`. Admin role bypasses ownership. Re-uses the established P6 `RequireRole` decorator. Same DI-singleton-safe pattern (Nest peer-deps on framework packages + `@Global()` OutboxModule from PR-16).

### D13 — `StockReadPort` cross-service contract

Per `.cursor/rules/microservice-boundaries.mdc`, product-service does NOT own stock data — that's P8 inventory-service. `StockReadPort` interface in `@repo/utils` + `StubStockReadPort` stub at the gateway (returns `[]`). P8 inventory-service replaces the binding at `apps/api-gateway/src/app.module.ts` with the real impl. Contract documented in [`docs/architecture/cross-service-contracts.md`](../architecture/cross-service-contracts.md).

### D14 — Outbox publishing inside `withTransaction` (PR-16 D14 lesson)

Every write path that emits an event MUST wrap the Mongo write + `outbox.publish` in `withTransaction(connection, async session => { ... })` per `.cursor/rules/event-driven-discipline.mdc` + the 26-comment PR-16 Copilot review. Analytics POST-commit (outside the transaction) so failed Mongo writes never ghost-emit. NO outbox publish inside event handlers (atlas-search-sync subscribes but doesn't re-publish — avoids the infinite-loop pattern).

### D15 — `createZodDto` + discriminated unions (PR-16 D14 lesson)

For endpoint payloads that are Zod discriminated unions (`PresignedUploadRequestSchema`, `ProductStatusTransitionSchema`, `AdminReviewDecisionSchema`), `createZodDto(union)` fails TS 2509 (class can't extend a union type expression). Workaround per PR-16: define controller param as `@Body() raw: unknown` and call `const dto = UnionSchema.parse(raw)` inline. Same validation guarantee; just a different DTO shape.

## 4. Open questions (parked)

### OQ1 — Variant pricing inheritance from Product

At MVP every variant carries its own `priceInrPaise`. Should product-level `defaultPriceInrPaise` exist (variants inherit unless overridden)? **Defer** — variant-level pricing keeps the data model clean; cart logic reads the variant directly.

### OQ2 — Per-variant images

Currently `product.heroImageR2Key` + image gallery is product-level. Some products (apparel in 5 colors) need per-variant primary images. **Defer to a future PR** — the data model accepts `variant.imageR2Key?: string` without migration but no UI surfaces it yet.

### OQ3 — HSN-rate live API

The `hsn-registry` collection is admin-CLI-seeded at MVP. P13 tax-service may need live HSN-rate lookups (CBIC publishes updates quarterly). **Decision deferred to P13 research note**.

### OQ4 — Atlas Search index name suffix per environment

Prod uses `products`; staging should use `products-staging`. Currently `env.ATLAS_SEARCH_INDEX_NAME` is the single env var — sufficient for MVP. **Defer multi-env indexing strategy to P21**.

### OQ5 — Product-tagging beyond categories

Free-text tags or controlled vocabulary? **Defer until UX research surfaces a need** (likely P16 web-customer or P18 web-admin).

## 5. Implementation checklist (file-by-file)

### `@repo/types`

- [x] `packages/types/src/product-categories.ts` — 24-entry flat enum + occasion + recipientType + brandingArea + status + review-status + image-kind + mime constants.
- [x] `packages/types/src/index.ts` — barrel re-export.

### `@repo/validators/src/product/`

- [x] `categories.ts` — Zod enums.
- [x] `hsn.ts` — `HsnCodeSchema`.
- [x] `variant.ts` — `VariantSchema` + `VariantAttributesSchema` + dimensions.
- [x] `image.ts` — `ProductImageSchema` + `ConfirmUploadRequestSchema`.
- [x] `product-row.ts` — `ProductCreateRequest` + `ProductUpdateRequest` + `ProductResponse` + `ProductListResponse`.
- [x] `presign-upload.ts` — `PresignedUploadRequestSchema` (discriminated union) + `PresignedUploadResponseSchema`.
- [x] `search.ts` — `ProductSearchQuerySchema` + `ProductSearchResponseSchema` + facet counts.
- [x] `review.ts` — `ProductReviewCreateRequestSchema` + `AdminReviewDecisionSchema` (discriminated union).
- [x] `status-transition.ts` — `ProductStatusTransitionSchema` (discriminated union).
- [x] `admin-list.ts` — `AdminProductListQuerySchema` + `AdminReviewListQuerySchema`.
- [x] `category.ts` — `CategoryListResponseSchema`.
- [x] `product-stock.ts` — `StockRowSchema` + `ProductWithStockResponseSchema`.
- [x] `index.ts` — barrel re-export + top-level `@repo/validators` barrel update.

### `@repo/events/src/product/`

- [x] `created.v1.ts` — `product.created.v1`.
- [x] `updated.v1.ts` — `product.updated.v1`.
- [x] `status-changed.v1.ts` — `product.status-changed.v1`.
- [x] `image-uploaded.v1.ts` — `product.image-uploaded.v1`.
- [x] `review-submitted.v1.ts` — `product.review-submitted.v1`.
- [x] `index.ts` — barrel.
- [x] `events.test.ts` — round-trip tests for all 5 events.

### `@repo/utils`

- [x] `stock-read-port.ts` — `StockReadPort` interface + `StubStockReadPort` impl + `STOCK_READ_PORT` token.
- [x] `index.ts` — barrel.

### `services/product-service/src/`

- [x] `schemas/product.schema.ts` + `product-variant.schema.ts` + `product-image.schema.ts` + `product-review.schema.ts` + `hsn-registry.schema.ts` + `index.ts`.
- [x] `services/product.service.ts` + `variant.service.ts` + `r2-upload.service.ts` + `atlas-search-sync.service.ts` + `review.service.ts` + `category.service.ts` + `search.service.ts` + `hsn.service.ts` + `analytics.helper.ts` + `index.ts`.
- [x] `controllers/product.controller.ts` + `variant.controller.ts` + `image-upload.controller.ts` + `search.controller.ts` + `review.controller.ts` + `admin-review.controller.ts` + `status-transition.controller.ts` + `mappers/product-response.mapper.ts` + `index.ts`.
- [x] `decorators/product-ownership.guard.ts` + `index.ts`.
- [x] `config/atlas-search-mapping.config.ts`.
- [x] `product-service.module.ts` + `product-service.tokens.ts` + `session.types.ts` + `index.ts`.
- [x] `package.json` + `tsconfig.json` + `jest.config.ts` + `README.md`.

### `services/product-service/atlas-search-mapping.json`

- [x] Sibling JSON consumed by the atlas-search-mapping-drift workflow.

### `apps/api-gateway/`

- [x] `src/app.module.ts` — import + register `ProductServiceModule.forRoot(env)` + bind `StubStockReadPort` at `STOCK_READ_PORT`.
- [x] `package.json` — add `@lotusgift/product-service: workspace:*`.
- [x] `Dockerfile` — add product-service package.json to deps stage + full directory to build stage.

### `packages/config/src/env.schema.ts`

- [x] Add R2 env vars + ATLAS_SEARCH_INDEX_NAME + production-superRefine guards.

### `.env.example`

- [x] Append the new env entries under a `# ---- Cloudflare R2 + Atlas Search (P7 product-service) ----` header.

### `.github/workflows/atlas-search-mapping-drift.yml`

- [x] Extend glob to include `services/*/atlas-search-mapping.json` alongside `infrastructure/atlas/search/*.json`.

### `docs/architecture/cross-service-contracts.md`

- [x] New file documenting the `StockReadPort` contract.

### Tests (≥20 individual tests across 8 spec files)

- [x] `services/product-service/src/services/product.service.spec.ts` — CRUD + status-transition matrix.
- [x] `services/product-service/src/services/variant.service.spec.ts` — add/remove/update + dupe SKU.
- [x] `services/product-service/src/services/r2-upload.service.spec.ts` — presign + confirm + HEAD validation + prefix check.
- [x] `services/product-service/src/services/search.service.spec.ts` — dev fallback + facet maps + pagination.
- [x] `services/product-service/src/services/review.service.spec.ts` — create + decide approve/reject.
- [x] `services/product-service/src/services/category.service.spec.ts` — flat enum + count join + cache.
- [x] `services/product-service/src/services/atlas-search-sync.service.spec.ts` — subscribe + dedup + shutdown.
- [x] `services/product-service/src/decorators/product-ownership.guard.spec.ts` — admin bypass + owner match + 403.

## 6. Implementation reference

**Merged:** 2026-05-16. PR <https://github.com/goldr0g3r/lotusgift/pull/41>. Squash SHA
`1a045daf410bbe5f90337c5b47ed488143600b7e`. Delivered: 86 files / +7472 / -55 across 3 commits
squashed.

### Copilot iteration timeline

- **Commit 1 — `981687f`** (initial wire, 86 files): product-service module + P2 shell population +
  StockReadPort + cross-service-contracts doc + Atlas mapping + gateway wiring. All 16 required CI
  checks green on first push.
- **Copilot review** (state `COMMENTED`, 6 inline comments): duplicate barrel exports (validators +
  events), plain `Error` → RFC 9457 in product controller, duplicate `VendorServiceModule.forRoot`
  registration, variant update/remove missing searchVersion bump, search `$regex` case sensitivity.
- **Commit 2 — `c655a9b`**: all 6 inline comments addressed.
- **Commit 3 — `2d42164`**: `vendorId` on product create now resolves `VendorService.getByOrgId()`
  → `vendor.id` (P6 ULID) instead of incorrectly using the Better-Auth `orgId` (Copilot
  low-confidence review + schema field docs).

### Lessons learned for P8 inventory-service

1. **Cross-module ports bind at the owning module** — P8 should register `InventoryStockReadPort`
   inside `InventoryServiceModule.forRoot` and remove the gateway-level `StubStockReadPort` binding
   (see P8 sub-plan lesson #8).
2. **`vendorId` ≠ `orgId`** — every FK onto P6 vendor aggregates must use the domain ULID (`vendor.id`),
   not the Better-Auth organization id; denormalize `orgId` separately for ownership-guard lookups.
3. **`withTransaction` + outbox** — carry forward from P6/P7; inventory ledger appends are financial-grade
   writes and must publish outbox events inside the same Mongo session.
4. **Duplicate `forRoot` is silent breakage** — only one module should call `VendorServiceModule.forRoot`;
   transitive imports register controllers once.
5. **Atlas Search M0** — denormalized `search_index` snapshot + `searchVersion` dedup is the correct
   pattern; inventory availability should NOT join live stock in the search snapshot (read via
   `StockReadPort` at query time instead).
6. **R2 presign** — production `EnvSchema.superRefine` must list all four R2 keys; test fixtures need
   valid URLs (no angle-bracket placeholders — Zod `.url()` rejects them).

## 7. Versions captured

Captured via `pnpm ls --depth=0 --filter @lotusgift/product-service` on 2026-05-16 post-merge:

```text
@lotusgift/product-service@0.0.0
@aws-sdk/client-s3 3.1048.0
@aws-sdk/s3-request-presigner 3.1048.0
@nestjs/mongoose 11.0.4
nestjs-zod 5.3.0
zod 4.4.3
mongoose 8.23.0
lru-cache 11.3.6
typescript 5.9.2
jest 30.3.0
```
