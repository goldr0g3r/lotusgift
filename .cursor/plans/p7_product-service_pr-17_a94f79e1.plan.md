---
name: P7 product-service PR-17
overview: Build services/product-service end-to-end in a single PR-17 — corporate-gifting taxonomy (occasion / recipientType / categoryId 2-level / customizable / brandingAreas / moq / leadTimeDays / sampleAvailable / hsnCode) + Cloudflare R2 image upload via S3-compatible presigned URLs (POST /api/products/:id/images/upload-url issues + POST /api/products/:id/images/confirm finalizes) + single-level variants stored as a Mongoose subdoc-array (attributes Map<string,string>) + 5 outbox events (product.published.v1 / product.unpublished.v1 / product.variant-added.v1 / product.image-confirmed.v1 / product.review-approved.v1) + MongoDB Atlas Search index sync (mapping JSON under infrastructure/atlas/search/products.json; on M0 the runtime sync writes a denormalized snapshot to product.search_index collection until the $search-eligible tier upgrade per docs/runbooks/scaling-up.md) + admin product-review moderation queue (gated by @RequireRole('admin')) + vendor-scoped product CRUD (gated by ProductOwnershipGuard ANDed with VendorActiveGuard that asserts vendor.status === ACTIVATED via VendorService cross-service read) + StockReadPort interface (single batchGet method) at @repo/utils + StubStockReadPort bound at apps/api-gateway/src/app.module.ts (real Redis-backed impl lands in P8 inventory-service). Populates the empty P2 shells in @repo/validators/product + @repo/events/product + extends @repo/types with the new product.ts file. Wires ProductServiceModule into apps/api-gateway/src/app.module.ts via .forRoot(env).
todos:
  - id: research-note-p7
    content: Write docs/research/phase-7-product-service.md with ≥12 retrieval-dated 2026-05-15 citations + ≥12 decisions (collapsing the sub-plan's D1–D15 + Q1–Q5 answers as D20–D24) + ≥3 open questions + implementation checklist + Section 6 placeholder (backfilled post-merge).
    status: pending
  - id: phase-7-issues
    content: Verify Phase 7 milestone exists (#8, already created via p0-issues seed) + create Phase 7 Epic ("Phase 7 — Epic: services/product-service (taxonomy + R2 uploads + Atlas Search + variants)") + Phase-Acceptance issues with labels phase/P7,area/infra,epic + phase/P7,phase-acceptance.
    status: pending
  - id: branch-pr-17
    content: git checkout -b pr-17-product-service + flip parent plan p7 todo to in_progress with note that PR-17 is the PR-of-record.
    status: pending
  - id: deps
    content: Add @nestjs/mongoose ^11 + nestjs-zod ^5.3 + zod ^4.4 + @aws-sdk/client-s3 ^3 + @aws-sdk/s3-request-presigner ^3 + lru-cache ^11 (Atlas search snapshot cache) to services/product-service/package.json. Nest framework + mongoose as peerDependencies per P5b D14 + P6 D21. Workspace deps on @repo/database + @repo/types + @repo/validators + @repo/events + @repo/utils + @repo/analytics-sdk + @repo/config + @lotusgift/vendor-service (for cross-service VendorService read). Add @lotusgift/product-service workspace dep to apps/api-gateway.
    status: pending
  - id: types-product-extension
    content: packages/types/src/product.ts — PRODUCT_OCCASIONS (literal-union of 12 corporate-gifting occasion keys) + RECIPIENT_TYPES (employee | client | partner | event-attendee | self-purchase) + PRODUCT_STATUS_KEYS (DRAFT | PUBLISHED | UNPUBLISHED | ARCHIVED) + PRODUCT_CATEGORY_L1_KEYS + PRODUCT_CATEGORY_L2_KEYS (2-level flat enum per Q3) + BRANDING_AREA_KEYS (printable surface enum) + IMAGE_KIND_KEYS (hero | gallery | mockup) + REVIEW_STATUS_KEYS (PENDING | APPROVED | REJECTED) + branded HsnCode + branded R2ImageKey types. Re-export from packages/types/src/index.ts.
    status: pending
  - id: validators-product-schemas
    content: Populate packages/validators/src/product/ empty shell with ~10 files — taxonomy.ts (occasion + recipientType + category L1+L2 + branding-area + image-kind + review-status + product-status Zod parsers) + hsn.ts (HSN code Zod schema 4-8 digit) + product-row.ts (full ProductCreateRequest + ProductUpdateRequest + ProductResponse + ProductListQuery + ProductListResponse with embedded variants + taxonomy + corporate gifting fields moq/leadTimeDays/sampleAvailable/brandingAreas) + variant-row.ts (VariantCreateRequest / VariantUpdateRequest / VariantResponse — single-level attributes Map<string,string> + SKU + pricePaise + weightGrams + dimensionsMm) + image-upload.ts (UploadUrlRequest with contentType + maxSizeBytes + ImageConfirmRequest with r2Key + kind + altText) + review-row.ts (ReviewCreateRequest with rating 1-5 + comment + ReviewModerationDecision with approve/reject + reason) + search-query.ts (SearchProductsQuery with q + occasion[] + recipientType[] + categoryL1[] + categoryL2[] + vendorId[] + customizable + minMoq + maxMoq + page + limit + SearchProductsResponse) + admin-review-query.ts (AdminReviewListQuery + AdminReviewListResponse for /api/admin/product-reviews). Extend packages/validators/src/index.ts barrel.
    status: pending
  - id: events-product-schemas
    content: Populate packages/events/src/product/ empty shell with 5 v1 event files via defineEvent() — published.v1.ts ({ orgId, vendorId, productId, slug, title, categoryL1, categoryL2, occasions[] }) + unpublished.v1.ts ({ orgId, vendorId, productId, reason? }) + variant-added.v1.ts ({ orgId, vendorId, productId, variantId, sku, attributes }) + image-confirmed.v1.ts ({ orgId, vendorId, productId, r2Key, kind }) + review-approved.v1.ts ({ orgId, vendorId, productId, reviewId, rating, approvedBy }). Index.ts barrel re-exports all 5.
    status: pending
  - id: utils-stock-port
    content: packages/utils/src/stock-read-port.ts — StockReadPort interface (single method batchGet(variantIds: string[]): Promise<Map<string, { available: number; reserved: number; updatedAt: string }>>) + STOCK_READ_PORT symbol token + StubStockReadPort class (returns { available: 0, reserved: 0, updatedAt: ISO-now } for every variantId). Re-export from packages/utils/src/index.ts so the api-gateway provider + product-service consumer share the typed contract. Real implementation lands in P8 inventory-service via Redis SUNION + Mongo aggregate.
    status: pending
  - id: product-service-domain
    content: services/product-service/src/schemas/ — product.schema.ts (product.products with vendorId FK + orgId + title + slug-unique-on-vendor + descriptionMd + status + categoryL1 + categoryL2 + occasions[] + recipientTypes[] + customizable bool + brandingAreas[] + moq min order quantity + leadTimeDays + sampleAvailable + hsnCode + basePricePaise + currency INR + searchVersion incrementing counter + audit fields via baseSchemaPlugin); variant.schema.ts (subdoc-array on product — _id + sku-unique-on-product + attributes Map<string,string> + pricePaise + weightGrams + dimensionsMm + barcode? + enabled); image.schema.ts (product.product_images with productId FK + r2Key + kind + altText + sortOrder + width + height + confirmedAt — created on confirm-upload); review.schema.ts (product.reviews — buyerId + productId + rating + comment + status PENDING|APPROVED|REJECTED + moderatedBy? + moderatedAt? + moderationReason?); search-index.schema.ts (product.search_index — denormalized snapshot for the M0 fallback read path; rebuilt on every product.* outbox event; fields: productId + vendorId + title + descriptionPlain + categoryL1 + categoryL2 + occasions + recipientTypes + customizable + minVariantPricePaise + moq + leadTimeDays + searchTerms (lowercase normalized title + brand for substring match) + indexedAt). All collections via namespace('product', '<entity>').
    status: pending
  - id: product-service-services
    content: services/product-service/src/services/ — product.service.ts (CRUD on product aggregate + slug generation + status transition guards DRAFT→PUBLISHED→UNPUBLISHED→ARCHIVED + emits product.published.v1 / product.unpublished.v1 inside withTransaction); variant.service.ts (add/update/remove variants on product.products[variants] subdoc-array + emits product.variant-added.v1); image.service.ts (issue R2 presigned PUT URL via @aws-sdk/s3-request-presigner with 15min expiry + content-type allow-list image/jpeg|png|webp + max 5MB; confirm-upload reads back from R2 via HEAD to verify upload succeeded + writes product.product_images row + emits product.image-confirmed.v1 inside withTransaction); review.service.ts (create review in PENDING; admin moderate via approve/reject + emits product.review-approved.v1 inside withTransaction on approve; on approve we also recompute the product's average rating in a follow-up update); search.service.ts (read from product.search_index collection for M0; the public search() method runs a regex/text-match query against searchTerms + filters by facets occasion/recipientType/categoryL1/categoryL2/vendorId/customizable + page-based pagination per Q4); atlas-search-sync.service.ts (OnApplicationBootstrap subscribes to product.published.v1 / product.unpublished.v1 / product.variant-added.v1 outbox events via OutboxPort.subscribe(); rebuilds the matching product.search_index row on each event; bulk-sync method for backfill); taxonomy.service.ts (static read-only API returning the 2-level category tree + the occasion enum + branding-area enum — consumed by the web-vendor catalog editor + web-customer faceted-search UI); analytics.helper.ts (NO_OP_ANALYTICS + capture wrappers mirroring vendor-service pattern); r2-client.helper.ts (S3Client factory + getPresignedPutUrl + getPresignedGetUrl + headObject thin wrappers — keeps service layer free of @aws-sdk import sprawl).
    status: pending
  - id: product-service-controllers
    content: services/product-service/src/controllers/ — product.controller.ts (/api/products GET search + GET /:id + GET /by-slug/:slug; POST + PATCH /:id + DELETE /:id gated by VendorActiveGuard + ProductOwnershipGuard; POST /:id/publish + POST /:id/unpublish); variant.controller.ts (/api/products/:productId/variants POST + PATCH /:variantId + DELETE /:variantId gated by ProductOwnershipGuard); image.controller.ts (/api/products/:productId/images/upload-url POST returns presigned URL + /api/products/:productId/images/confirm POST writes the image row; gated by ProductOwnershipGuard); search.controller.ts (/api/products/search GET — public read; consumes SearchProductsQuery Zod DTO + returns SearchProductsResponse with facet counts); taxonomy.controller.ts (/api/product-taxonomy GET — public read; returns categories + occasions + branding areas + recipient types); review.controller.ts (/api/products/:productId/reviews GET public list APPROVED only + POST authenticated buyer creates PENDING); admin-review.controller.ts (/api/admin/product-reviews GET list PENDING + POST /:id/approve + POST /:id/reject gated by @RequireRole('admin') + RoleGuard). Every controller class uses createZodDto for request/response per .cursor/rules/api-type-safety.mdc; discriminated unions parsed manually per P6 lesson #2.
    status: pending
  - id: product-service-decorators-and-guards
    content: services/product-service/src/decorators/ — product-ownership.guard.ts (resolves :productId param → loads product → asserts product.orgId === session.activeOrganizationId OR session.user.role === 'admin'; throws RFC 9457 AUTH_FORBIDDEN on mismatch — mirrors VendorOwnershipGuard pattern from P6); vendor-active.guard.ts (resolves vendor from session.activeOrganizationId via the imported VendorService.getByOrgId(); asserts vendor.status === 'ACTIVATED' before allowing product mutations; throws AUTH_FORBIDDEN with code VENDOR_NOT_ACTIVATED if DRAFT/PENDING_REVIEW/REJECTED/SUSPENDED — gates the entire product write surface per the parent plan §p6 acceptance criterion 'vendor in DRAFT/PENDING_REVIEW CANNOT create products'). Re-export RequireRole + RoleGuard from vendor-service via the decorators barrel for ergonomic import; runtime dep is on the symbol token (cross-service edge is legal at L4→L4 only via the decorator import; if dep-cruiser rejects, we re-define RoleGuard locally per the P6 session.types.ts pattern).
    status: pending
  - id: product-service-module
    content: services/product-service/src/product-service.module.ts — forRoot(env: Env): DynamicModule imports MongooseModule.forFeature for all 5 schemas + VendorServiceModule (NO — we just import VendorService from @lotusgift/vendor-service public surface for cross-service VendorActiveGuard reads, NOT the whole module — modular-monolith allows L4-to-L4 type imports via public barrels per parent plan §4); declares all services + controllers + RoleGuard + ProductOwnershipGuard + VendorActiveGuard; exports ProductService + VariantService + ImageService + ReviewService + SearchService + TaxonomyService + the new guards. Wires the atlas-search-sync OnApplicationBootstrap subscription. Index.ts barrel re-exports ProductServiceModule + the 5 v1 event types + the guards + service tokens.
    status: pending
  - id: api-gateway-wiring
    content: apps/api-gateway/src/app.module.ts — import + register ProductServiceModule.forRoot(env) under the existing VendorServiceModule.forRoot(env) entry. Bind STOCK_READ_PORT provider via useClass StubStockReadPort. apps/api-gateway/package.json — add @lotusgift/product-service workspace dep. apps/api-gateway/Dockerfile — add services/product-service/package.json to deps stage COPY (alphabetical position) + services/product-service directory copy to build stage (same PR-13/14/15/16 pattern).
    status: pending
  - id: env-r2
    content: .env.example — append R2_BUCKET_PRODUCT_IMAGES (defaults to lotusgift-product-images), R2_PRESIGN_EXPIRY_SECONDS (default 900 = 15min), R2_MAX_IMAGE_SIZE_BYTES (default 5_242_880 = 5MB), R2_PUBLIC_BASE_URL (CDN-fronted GET base URL for served images). packages/config/src/env.schema.ts — add 4 optional entries with sensible defaults + production-superRefine assertion that R2_ENDPOINT + R2_ACCESS_KEY_ID + R2_SECRET_ACCESS_KEY + R2_BUCKET_PRODUCT_IMAGES are all set in production.
    status: pending
  - id: cross-service-contracts-doc
    content: docs/architecture/cross-service-contracts.md NEW — documents the StockReadPort contract introduced at PR-17 (interface signature + DI token + stub/real impl gating). Mirrors the existing dep-graph.svg sibling. Sections — Overview + StockReadPort + future ports table (lists upcoming Inter-service ports we'll formalize as the modular monolith grows: ShippingRateReadPort P11, TaxComputePort P13, PaymentCapturePort P10, NotificationDispatchPort P12). Linked from README.md + docs/architecture/README.md.
    status: pending
  - id: analytics-instrumentation
    content: Wire @repo/analytics-sdk/server.capture() calls inside each of the 5 service write paths so the 5 events from docs/analytics/events.md product section emit. PII-redact via the SDK built-in @repo/utils.redact. Calls fire AFTER the outbox transaction commits. Events: 'product published' / 'product unpublished' / 'variant added' / 'product image uploaded' / 'product review approved'.
    status: pending
  - id: tests-p7
    content: ≥20 individual tests across 8 spec files. services/product-service/src/services/product.service.spec.ts (CRUD happy path + slug uniqueness + status transition guard + publish emits product.published.v1); services/product-service/src/services/variant.service.spec.ts (add/update/remove variant subdoc + SKU uniqueness within product + emits product.variant-added.v1); services/product-service/src/services/image.service.spec.ts (presign URL contract + content-type allow-list + 5MB max + confirm-upload writes row + emits product.image-confirmed.v1); services/product-service/src/services/review.service.spec.ts (create PENDING + admin approve emits product.review-approved.v1 + admin reject does NOT emit + rating computation); services/product-service/src/services/search.service.spec.ts (faceted query + page-based pagination + empty result with 0 facet counts); services/product-service/src/services/atlas-search-sync.service.spec.ts (rebuild on product.published.v1 + remove on product.unpublished.v1 + bulk sync); services/product-service/src/decorators/product-ownership.guard.spec.ts (orgId match + admin bypass + 403 on mismatch); services/product-service/src/decorators/vendor-active.guard.spec.ts (ACTIVATED passes + DRAFT/PENDING_REVIEW/REJECTED/SUSPENDED throws VENDOR_NOT_ACTIVATED). Convention — .spec.ts extension; no @jest/globals imports; stub Mongo connection via fakeConnection pattern from vendor.service.spec.ts.
    status: pending
  - id: dockerfile
    content: apps/api-gateway/Dockerfile — add services/product-service/package.json to deps stage COPY block (alphabetical after auth-service before vendor-service) + services/product-service full directory COPY in build stage. Same pattern PR-13/14/15/16 used.
    status: pending
  - id: local-smoke-p7
    content: Full local pipeline — pnpm install --no-frozen-lockfile + pnpm install --frozen-lockfile (lockfile sync verify) + pnpm check-types (expect ~35/35 after the new package lands) + pnpm lint (~38/38) + pnpm test (~18-20/18-20 turbo tasks — the +1-2 are the product-service suites) + pnpm build (~10/10) + pnpm dep-cruiser (0 errors) + pnpm dlx markdownlint-cli2 docs/research/phase-7-product-service.md services/product-service/README.md .cursor/plans/p7_*.md (0 errors).
    status: pending
  - id: commit-push-pr-17
    content: Single feat(product) commit + branch push + gh pr create PR-17 with HEREDOC body summarizing scope/changes/tests/CI/decisions baked.
    status: pending
  - id: ci-poll
    content: gh pr checks 17 — poll the 16 required checks (build-push is the longest ~5-10min for the multi-arch image). Use AwaitShell with 300-540s blocks.
    status: pending
  - id: copilot-review
    content: gh pr edit 17 --add-reviewer copilot-pull-request-reviewer; address every Copilot comment + re-poll CI.
    status: pending
  - id: admin-squash-merge
    content: gh pr merge 17 --squash --admin --subject 'feat(product): wire product-service module — corporate-gifting taxonomy + R2 presigned uploads + Atlas Search sync + variant support' --body via Set-Content tmpfile.
    status: pending
  - id: status-sync-pr17
    content: Close epic + acceptance issues, close Phase 7 milestone (#8), flip parent plan p7 -> completed, backfill phase-7 research note §6, sync project board (Status=Done / Phase=P7 / Workstream=product / Layer=L4 / Type=feat), delete branch local + remote.
    status: pending
isProject: false
---

# Sub-plan: P7 — services/product-service (PR-17)

The sub-plan that **drafts P7**, ready for execution. Scope-decisions captured in the Decisions baked section; open questions Q1–Q5 baked to the defaults per user instruction. Mirrors the PR-13/PR-14/PR-15/PR-16 cadence — single `feat(product)` commit, Copilot iteration, admin squash merge.

## Decisions baked in

- **D1 — Scope split:** single PR-17 covering `@repo/types` product extension + `@repo/validators/product` (10 files populating the P2 empty shell) + `@repo/events/product` (5 v1 event files populating the empty shell) + `@repo/utils.StockReadPort` interface (single batchGet method + token + stub) + `services/product-service` end-to-end (5 schemas + 8 services + 7 controllers + 2 guards + module + barrel + tests + Dockerfile updates + analytics + env entries) + `apps/api-gateway` wiring + `docs/architecture/cross-service-contracts.md` new doc + research note. Mirrors the PR-13/PR-14/PR-15/PR-16 cadence — single `feat(product)` commit, Copilot iteration, admin squash merge.
- **D2 — Image upload pattern:** **Cloudflare R2 presigned PUT URLs** issued by `image.service.ts` via `@aws-sdk/s3-request-presigner` (R2 is S3-compatible per the Cloudflare R2 S3 API doc — citation #3). Two-step flow: `POST /api/products/:id/images/upload-url` returns `{ url, r2Key, expiresAt }`; client PUTs the file directly to R2; `POST /api/products/:id/images/confirm` reads back via HEAD to verify upload succeeded then writes the `product.product_images` row + emits `product.image-confirmed.v1`. Per **Q1** answer.
- **D3 — Variant storage:** **single-level variant subdoc-array on the product document** with an `attributes: Map<string, string>` (e.g. `{ color: 'Black', size: 'M' }`). Rejects the alternative of a separate `product.variants` collection because reading a product almost always needs its variants (saves a $lookup at the cost of slightly larger product docs). 16 MB BSON document limit is comfortable for ≤200 variants per product per Mongo limits. Per **Q2** answer.
- **D4 — Category taxonomy:** **2-level flat enum** in `packages/types/src/product.ts` — `PRODUCT_CATEGORY_L1_KEYS` (12 corporate gifting parent categories) + `PRODUCT_CATEGORY_L2_KEYS` (50-ish leaf categories). Per-product `categoryL1` + `categoryL2` are paired (parent must match the L2's declared parent — validated in Zod superRefine). Per **Q3** answer.
- **D5 — Pagination:** **page-based** for product listings + search (`?page=1&limit=20`). Cursor-based pagination parked to P21 if perf demands it; page-based is simpler for the web-customer faceted-search UI (P16) and the API stays the same when we swap the underlying query for an Atlas $search. Per **Q4** answer.
- **D6 — Atlas Search mapping sync:** **JSON-on-disk** mapping file at `infrastructure/atlas/search/products.json` registered with the M0 cluster via the existing `.github/workflows/atlas-search-mapping-drift.yml` workflow (enforces the 3-index M0 budget per ADR-0006). The runtime sync — `atlas-search-sync.service.ts` — does NOT use `$search` (M0 tier doesn't expose Atlas Search query syntax); instead it maintains a `product.search_index` collection with a denormalized snapshot per product (fields the faceted-search query needs) and the `search.service.ts` runs a regex + filter aggregation. Post-revenue tier upgrade swaps the read path to `$search` per the parent plan §p21 + `docs/runbooks/scaling-up.md`. Per **Q5** answer.
- **D7 — Mongoose adoption:** **`@nestjs/mongoose` 11** at L4 (continued from P6 D20 — established convention). `MongooseModule.forFeature([...schemas])` inside `forRoot(env)`. `@repo/database` stays raw Mongoose 8 at L2 for worker/Lambda contexts (per phase-3 D6).
- **D8 — Outbox pattern:** every write goes through `withTransaction(connection, async session => { /* domain write + OutboxPort.publish({ session }) */ })`. The `@Global() OutboxModule` already ships from P6 PR-16 (`apps/api-gateway/src/common/outbox.module.ts`). Inject `@Inject(OUTBOX_PORT) outbox: OutboxPort`. Per `.cursor/rules/event-driven-discipline.mdc` + P6 lesson #3.
- **D9 — Analytics:** the **5 product events** in `docs/analytics/events.md` emit via `@repo/analytics-sdk/server.capture()` inside each service write path AFTER the outbox transaction commits (so failed transactions never ghost-emit). PII auto-redacted via the SDK built-in `@repo/utils.redact`.
- **D10 — Authorization layered:** global P5b `AuthGuard` (default-deny) + per-endpoint `@RequireRole('admin')` + `RoleGuard` for admin endpoints (admin product-review queue) + `ProductOwnershipGuard` (resolves `:productId` → `product.orgId` → `session.activeOrganizationId` match OR admin bypass) for vendor-scoped writes + `VendorActiveGuard` (resolves `session.activeOrganizationId` → `vendor.status === ACTIVATED` OR admin bypass) for product create + variant create. Public reads: `GET /api/products/search` + `GET /api/products/:id` + `GET /api/products/by-slug/:slug` + `GET /api/products/:id/reviews` + `GET /api/product-taxonomy` are anonymous-allowed.
- **D11 — Atlas M0 vs $search:** Atlas Search `$search` is **NOT available on M0** per the Atlas tier comparison doc (citation #5). The product-service ships a `search_index` collection-based read path that uses regex + filter aggregation; per-PR ADR-0006 the M0 search-index budget is 3 indexes (products + vendors + orders allocated). Post-revenue scaling-up.md path triggers when GMV cross the M10 upgrade threshold (~$57/mo per Atlas pricing — documented in scaling-up.md).
- **D12 — StockReadPort cross-service contract:** `StockReadPort` interface at `@repo/utils` (L2) with single `batchGet(variantIds: string[]): Promise<Map<string, { available, reserved, updatedAt }>>` method. `STOCK_READ_PORT` symbol token. `StubStockReadPort` returns `{ available: 0, reserved: 0, updatedAt: ISO-now }` for every variantId at MVP. Real Redis-backed impl lands in P8 inventory-service; the binding flips in `apps/api-gateway/src/app.module.ts` from `useClass: StubStockReadPort` → `useClass: RedisStockReadPort`. Product-service consumes the port via `@Inject(STOCK_READ_PORT) stock: StockReadPort` in `product.service.ts` to populate the `availableStock` field on the product response.
- **D13 — Vendor-active gate:** `VendorActiveGuard` imports `VendorService` from `@lotusgift/vendor-service` (cross-service type import is legal per parent plan §4 modular-monolith — only direct cross-service Service-class injection between separate Nest modules is banned; we add `@lotusgift/vendor-service` as a workspace dep of `services/product-service` and inject `VendorService` as a Nest provider, exactly like the parent plan's "modular monolith hosts every business module as a Nest library under services/" pattern in `.cursor/rules/deployment-mode.mdc`). If `dep-cruiser`'s `no-cross-service-import` rule flags this, we resolve via the in-gateway pattern (StockReadPort-style port at @repo/utils with the gateway binding the real impl).
- **D14 — Slug generation:** `kebab-case(title) + '-' + 5-char-base32-from-ulid-suffix` for product slug. URL-safe + collision-resistant + human-readable. Uniqueness enforced on `(orgId, slug)` compound index — the same vendor can't have two products with the same slug; different vendors can share a slug (the customer-facing URL includes the vendor slug too in P16).
- **D15 — HSN code minimal validation:** 4–8 digit numeric string per GST law (citation #6 — Indian GST HSN doc). No live lookup at MVP — vendor declares the HSN; P13 tax-service validates against the CBIC HSN registry at order-line tax-compute time. Wrong HSN at product-create time is caught by P13 (raises an order-line validation error). This avoids a hard dependency on a CBIC HSN lookup service that doesn't ship until P13.

## Q1–Q5 — Open questions answered (user-baked defaults)

- **Q1 — Image upload: presigned URL vs server-proxy?** **Presigned URL** (D2). Direct PUT to R2 saves the gateway from buffering 5 MB images per upload. Trade-off: client needs to handle PUT errors + chunking for slow connections. Acceptable for MVP — vendor-facing flow, not consumer.
- **Q2 — Variants: subdoc-array vs separate collection?** **Subdoc-array on product** (D3). Saves a $lookup per product read; 16 MB BSON limit comfortably fits ≤200 variants. If a vendor exceeds 200 variants we throw `VARIANT_LIMIT_EXCEEDED` and require them to split the product.
- **Q3 — Taxonomy depth: 2-level flat vs N-level tree?** **2-level flat** (D4). Web-customer faceted search renders better with a flat 2-level. N-level tree adds Recursive joinTable complexity for marginal customer value at MVP. Re-platform path: add `categoryL3` later as an additive PR.
- **Q4 — Pagination: page-based vs cursor?** **Page-based** (D5). Simpler for web-customer pagination UI; same API shape works when we swap to `$search`.
- **Q5 — Atlas Search mapping update: auto-rebuild vs manual?** **Auto-rebuild via existing CI workflow** (D6). `atlas-search-mapping-drift.yml` already exists from P0-ci PR-4 (skips when no mappings present). PR-17 lands the first mapping JSON; the workflow enforces the 3-index M0 budget thereafter.

## Files (~50–70 across 1 service + 3 L1 package extensions + 1 L2 package extension + tests + research note + GitHub + Dockerfile + cross-service-contracts doc + env)

### `@repo/types` extensions

- `packages/types/src/product.ts` — 12-key `PRODUCT_OCCASIONS` + 5-key `RECIPIENT_TYPES` + 4-key `PRODUCT_STATUS_KEYS` + 12-key `PRODUCT_CATEGORY_L1_KEYS` + 50-ish-key `PRODUCT_CATEGORY_L2_KEYS` + 6-key `BRANDING_AREA_KEYS` + 3-key `IMAGE_KIND_KEYS` + 3-key `REVIEW_STATUS_KEYS` + branded `HsnCode` + branded `R2ImageKey` + per-product-category L1→L2 lookup helper.
- `packages/types/src/index.ts` — barrel re-exports the new public types.

### `@repo/validators/src/product/`

- `taxonomy.ts` — Zod parsers for the 7 enum exports above.
- `hsn.ts` — `HsnCodeSchema` 4-8 digit numeric string.
- `product-row.ts` — `ProductCreateRequest` + `ProductUpdateRequest` (partial) + `ProductResponse` + `ProductListQuery` (page + limit + status + vendorId filter) + `ProductListResponse` (paginated).
- `variant-row.ts` — `VariantCreateRequest` + `VariantUpdateRequest` (partial) + `VariantResponse`.
- `image-upload.ts` — `ImageUploadUrlRequest` (`{ contentType, fileSize, kind, altText? }`) + `ImageUploadUrlResponse` (`{ url, r2Key, expiresAt }`) + `ImageConfirmRequest` (`{ r2Key, kind, altText, sortOrder? }`) + `ImageResponse`.
- `review-row.ts` — `ReviewCreateRequest` (`rating` 1-5 + `comment`) + `ReviewResponse` + `ReviewModerationDecisionRequest` (`{ action: 'approve' | 'reject', reason? }`).
- `search-query.ts` — `SearchProductsQuery` (`{ q?, occasion[]?, recipientType[]?, categoryL1[]?, categoryL2[]?, vendorId[]?, customizable?, minMoq?, maxMoq?, page, limit }`) + `SearchProductsResponse` (paginated `ProductResponse` + facet counts).
- `admin-review-query.ts` — `AdminReviewListQuery` (`{ status?, productId?, page, limit }`) + `AdminReviewListResponse`.
- `index.ts` barrel re-exports all public.
- Top-level `packages/validators/src/index.ts` adds `export * from './product/index.js';`.

### `@repo/events/src/product/`

- `published.v1.ts` — `VendorProductPublishedV1` defineEvent.
- `unpublished.v1.ts` — `VendorProductUnpublishedV1` defineEvent.
- `variant-added.v1.ts` — `VendorProductVariantAddedV1` defineEvent.
- `image-confirmed.v1.ts` — `VendorProductImageConfirmedV1` defineEvent.
- `review-approved.v1.ts` — `VendorProductReviewApprovedV1` defineEvent.
- `index.ts` barrel re-exports the 5 events.
- Top-level `packages/events/src/index.ts` adds `export * from './product/index.js';`.

### `@repo/utils` extension

- `packages/utils/src/stock-read-port.ts` — `StockReadPort` interface + `STOCK_READ_PORT` symbol token + `StubStockReadPort` class (returns 0 for all variantIds).
- `packages/utils/src/index.ts` — re-export the 3 public names.

### `services/product-service/src/`

- `schemas/product.schema.ts` — product.products aggregate (vendorId + orgId + title + slug + descriptionMd + status + categoryL1 + categoryL2 + occasions[] + recipientTypes[] + customizable + brandingAreas[] + moq + leadTimeDays + sampleAvailable + hsnCode + basePricePaise + currency + variants[] subdoc + searchVersion).
- `schemas/variant.schema.ts` — embedded Variant subdoc class (declared inline on product.schema.ts; this file just re-exports the type alias).
- `schemas/image.schema.ts` — product.product_images (productId FK + r2Key + kind + altText + sortOrder + width + height + confirmedAt).
- `schemas/review.schema.ts` — product.reviews (buyerId + productId + rating + comment + status + moderation fields).
- `schemas/search-index.schema.ts` — product.search_index (M0 fallback denormalized snapshot).
- `services/product.service.ts` — CRUD + status transitions + slug gen + emits published.v1 / unpublished.v1.
- `services/variant.service.ts` — variant CRUD on the subdoc-array + emits variant-added.v1.
- `services/image.service.ts` — R2 presign + confirm + emits image-confirmed.v1.
- `services/review.service.ts` — create PENDING + admin approve/reject + emits review-approved.v1.
- `services/search.service.ts` — read product.search_index + filter + facet aggregation + paginate.
- `services/atlas-search-sync.service.ts` — OnApplicationBootstrap subscribes to product.* outbox events + rebuilds search_index rows + bulk-sync method.
- `services/taxonomy.service.ts` — static read API for categories + occasions + branding areas + recipient types.
- `services/analytics.helper.ts` — `NO_OP_ANALYTICS` + capture helpers.
- `services/r2-client.helper.ts` — S3Client factory + presign + headObject thin wrappers.
- `controllers/product.controller.ts` — `/api/products` CRUD + publish + unpublish.
- `controllers/variant.controller.ts` — `/api/products/:productId/variants` CRUD.
- `controllers/image.controller.ts` — `/api/products/:productId/images/{upload-url,confirm}`.
- `controllers/search.controller.ts` — `/api/products/search` (public).
- `controllers/taxonomy.controller.ts` — `/api/product-taxonomy` (public).
- `controllers/review.controller.ts` — `/api/products/:productId/reviews` GET + POST.
- `controllers/admin-review.controller.ts` — `/api/admin/product-reviews` admin moderation.
- `controllers/mappers/product-response.mapper.ts` — `mapProductToResponse(doc)` helper.
- `controllers/mappers/variant-response.mapper.ts` — `mapVariantToResponse(subdoc)` helper.
- `controllers/mappers/image-response.mapper.ts` — `mapImageToResponse(doc)` helper.
- `controllers/mappers/review-response.mapper.ts` — `mapReviewToResponse(doc)` helper.
- `decorators/product-ownership.guard.ts` — `ProductOwnershipGuard` (orgId match OR admin).
- `decorators/vendor-active.guard.ts` — `VendorActiveGuard` (vendor.status === 'ACTIVATED' OR admin).
- `decorators/index.ts` — barrel + re-exports `RoleGuard` + `RequireRole` from vendor-service for ergonomic local import (if dep-cruiser flags, drop the re-export + require consumers to import from vendor-service directly).
- `session.types.ts` — local `SessionPayload` + `@Session()` + `@CurrentUser()` decorators (mirrors vendor-service/session.types.ts to avoid cross-service direct import per microservice-boundaries rule).
- `product-service.tokens.ts` — `ENV_TOKEN` + `ANALYTICS_TOKEN` + `R2_CLIENT_TOKEN` (so tests can stub) + `STOCK_READ_PORT` (re-exported from `@repo/utils` for convenience).
- `product-service.module.ts` — `MongooseModule.forFeature` for all 5 schemas + 8 services + 7 controllers + 2 guards + RoleGuard + atlas-search-sync subscription wiring + `OnApplicationShutdown` (drain analytics).
- `index.ts` — barrel re-exports `ProductServiceModule` + the 5 v1 event types + guards + service tokens + Document types.
- `package.json` — Nest framework + mongoose as `peerDependencies`; @nestjs/mongoose + @aws-sdk/client-s3 + @aws-sdk/s3-request-presigner + lru-cache + nestjs-zod + zod as direct deps; workspace deps for @repo/* + @lotusgift/vendor-service.
- `tsconfig.json` — extends `@repo/typescript-config/library.json` with `useDefineForClassFields: false` + `experimentalDecorators: true` + `emitDecoratorMetadata: true`.
- `jest.config.ts` — `export default nestConfig;` from `@repo/jest-config`.
- `README.md` — module purpose + product schema reference + R2 upload flow + search index sync diagram + cross-service consumer table.

### `apps/api-gateway/src/`

- `app.module.ts` — import + register `ProductServiceModule.forRoot(env)` after `VendorServiceModule.forRoot(env)`. Bind `STOCK_READ_PORT` via `{ provide: STOCK_READ_PORT, useClass: StubStockReadPort }`.
- `package.json` — add `@lotusgift/product-service: workspace:*`.
- `Dockerfile` — add `services/product-service/package.json` to deps stage COPY + `services/product-service` directory copy to build stage.

### `packages/config/src/env.schema.ts`

- Add 4 R2-product-image optional env vars + production superRefine asserting R2_ENDPOINT + R2_ACCESS_KEY_ID + R2_SECRET_ACCESS_KEY + R2_BUCKET_PRODUCT_IMAGES are all set.

### `.env.example`

- Append the 4 new entries under a `# ---- Cloudflare R2 product images (P7 product-service) ----` comment header.

### `infrastructure/atlas/search/`

- `products.json` — Atlas Search mapping JSON (fields: title autocomplete + descriptionPlain text + categoryL1/L2 facet + occasions facet + recipientTypes facet + vendorId facet + customizable facet). Picked up by `.github/workflows/atlas-search-mapping-drift.yml` which already enforces the 3-index M0 budget.

### `docs/architecture/cross-service-contracts.md` NEW

- Overview + StockReadPort signature + DI token + stub/real impl gating + future ports table (ShippingRateReadPort P11, TaxComputePort P13, PaymentCapturePort P10, NotificationDispatchPort P12). Linked from README.md + docs/architecture/README.md.

### Tests (~20-24 across 8 spec files)

- `product.service.spec.ts` — CRUD + slug + publish + transitions (4-6 tests).
- `variant.service.spec.ts` — CRUD + SKU + emit (3-4 tests).
- `image.service.spec.ts` — presign + content-type allow + max-size + confirm + emit (4 tests).
- `review.service.spec.ts` — create + approve + reject + rating compute (3-4 tests).
- `search.service.spec.ts` — faceted query + pagination + empty (3 tests).
- `atlas-search-sync.service.spec.ts` — rebuild on published.v1 + remove on unpublished.v1 + bulk sync (3 tests).
- `product-ownership.guard.spec.ts` — orgId match + admin bypass + 403 (3 tests).
- `vendor-active.guard.spec.ts` — ACTIVATED + non-ACTIVATED throws + admin bypass (3 tests).

### Research note

- `docs/research/phase-7-product-service.md` — ≥12 retrieval-dated 2026-05-15 citations + ≥12 decisions + ≥3 open questions + implementation checklist + Section 6 placeholder (backfill at merge time).

### GitHub

- Phase 7 milestone (#8, already exists per `gh api repos/goldr0g3r/lotusgift/milestones` lookup 2026-05-15).
- Phase 7 Epic issue (`phase/P7,area/infra,epic` labels) under that milestone.
- Phase 7 Phase-Acceptance issue (`phase/P7,phase-acceptance` labels) under that milestone.

## Implementation cadence

- **~60–80 files** in a single PR (PR-17) per the established pattern:
  - 2 file changes in `packages/types/src/` (new `product.ts` + barrel update)
  - 9 files in `packages/validators/src/product/` + barrel update
  - 6 files in `packages/events/src/product/` (5 events + index) + barrel update
  - 2 file changes in `packages/utils/src/` (new `stock-read-port.ts` + barrel update)
  - ~40 files in `services/product-service/src/` (5 schemas + 8 services + 7 controllers + 4 mappers + 2 guards + 1 helper + session.types + tokens + module + barrel + tests + package.json + jest.config.ts + tsconfig + README)
  - 3 file edits in `apps/api-gateway/` (`app.module.ts`, `package.json`, `Dockerfile`)
  - 2 file edits in `packages/config/` + `.env.example`
  - 1 new file: `infrastructure/atlas/search/products.json`
  - 1 new file: `docs/architecture/cross-service-contracts.md`
  - 1 new file: `docs/research/phase-7-product-service.md`
- **~20–24 individual tests** across 8 spec files
- **~2–3 commits squashed** (initial bulk + Copilot review iteration + likely lockfile re-sync)
- **Expected runtime:** 1.5–2 hours from PR-open to merge given the CI cycle (16 required checks; `build-push` is the long pole at 5–10 min for the multi-arch image)

## Acceptance criteria

- `pnpm check-types` — 35/35 green (was 33; +1 for `@lotusgift/product-service` and +1 for the new Stock port test).
- `pnpm lint` — ~38/38 green.
- `pnpm test` — ~18–20/18–20 turbo tasks green.
- `pnpm build` — ~10/10 green.
- `pnpm dep-cruiser` — 0 errors.
- `pnpm dlx markdownlint-cli2 docs/research/phase-7-product-service.md services/product-service/README.md .cursor/plans/p7_*.md` — 0 errors.
- All 16 required CI checks green on PR-17's final commit.
- `POST /api/products` from an authenticated ACTIVATED-vendor session creates a DRAFT product + the response includes the product slug.
- `POST /api/products/:id/publish` flips status to PUBLISHED + emits `product.published.v1` + analytics fires `product published`.
- `POST /api/products/:id/images/upload-url` returns a 15-min presigned R2 PUT URL.
- `POST /api/products/:id/images/confirm` writes a `product.product_images` row + emits `product.image-confirmed.v1`.
- `GET /api/products/search?q=mug&occasion=birthday` returns paginated results sourced from `product.search_index` collection.
- `POST /api/admin/product-reviews/:id/approve` from an admin session emits `product.review-approved.v1`.
- `StockReadPort` interface ships at `@repo/utils`; `StubStockReadPort` is bound at gateway DI (real impl lands in P8).
- `docs/architecture/cross-service-contracts.md` documents the StockReadPort contract.
- Copilot review addressed.
- Admin squash-merged, branch deleted local + remote.
- Parent plan `p7` todo flipped to `status: completed`.
- Phase 7 milestone closed.

## Status-sync closing step (post-merge)

1. `git checkout main && git pull && git branch -d pr-17-product-service && git push origin --delete pr-17-product-service`.
2. `gh issue close <epic-num> --reason completed` + `gh issue close <acceptance-num> --reason completed`.
3. `gh api -X PATCH repos/goldr0g3r/lotusgift/milestones/8 -f state=closed`.
4. Update parent plan `p7` todo content (PR-17 squash SHA + 1-paragraph delivery summary) + `status: completed`.
5. Backfill `docs/research/phase-7-product-service.md` §6 with PR-17 link + squash SHA + lessons learned for P8.
6. Project board: add PR + issues via `gh project item-add`, then `gh project item-edit` for Status=Done / Phase=P7 / Workstream=product (or infra fallback) / Layer=L4 / Type=feat.
7. `git push origin main` for the closeout commit.
