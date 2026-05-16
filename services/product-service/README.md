# `@lotusgift/product-service`

Phase 7 (PR-17). Corporate-gifting product catalog: taxonomy + variant management + Cloudflare R2 image uploads + admin-moderated reviews + Atlas Search-style faceted search.

Mounted by `apps/api-gateway` via `ProductServiceModule.forRoot(env)`. See [`docs/research/phase-7-product-service.md`](../../docs/research/phase-7-product-service.md) for the citation table + decision log + Q1–Q5 user-baked defaults.

## Endpoints

| Method | Path | Gate | Notes |
|---|---|---|---|
| `GET`    | `/api/products`                                | AuthGuard (vendor-scoped list) | `?vendorId=&status=&page=&limit=` |
| `GET`    | `/api/products/:id`                            | AuthGuard | Single product + variants + images + average rating |
| `POST`   | `/api/products`                                | VendorActiveGuard | Create DRAFT product; vendor must be ACTIVATED |
| `PATCH`  | `/api/products/:id`                            | VendorActiveGuard + ProductOwnershipGuard | Partial update; bumps `searchVersion` |
| `POST`   | `/api/products/:id/publish`                    | VendorActiveGuard + ProductOwnershipGuard | DRAFT→PUBLISHED + emits `product.published.v1` |
| `POST`   | `/api/products/:id/unpublish`                  | VendorActiveGuard + ProductOwnershipGuard | PUBLISHED→UNPUBLISHED + emits `product.unpublished.v1` |
| `DELETE` | `/api/products/:id`                            | VendorActiveGuard + ProductOwnershipGuard | Soft-delete: flips status to ARCHIVED |
| `POST`   | `/api/products/:productId/variants`            | VendorActiveGuard + ProductOwnershipGuard | Add variant subdoc; emits `product.variant-added.v1` |
| `PATCH`  | `/api/products/:productId/variants/:variantId` | VendorActiveGuard + ProductOwnershipGuard | Update variant subdoc |
| `DELETE` | `/api/products/:productId/variants/:variantId` | VendorActiveGuard + ProductOwnershipGuard | Remove variant subdoc (last-variant guard if PUBLISHED) |
| `POST`   | `/api/products/:productId/images/upload-url`   | VendorActiveGuard + ProductOwnershipGuard | Issue 15-min presigned R2 PUT URL |
| `POST`   | `/api/products/:productId/images/confirm`      | VendorActiveGuard + ProductOwnershipGuard | HEAD R2 + write image row + emit `product.image-confirmed.v1` |
| `GET`    | `/api/products/search`                         | public (anon) | Faceted search from `product.search_index` snapshot |
| `GET`    | `/api/product-taxonomy`                        | public (anon) | Category tree + occasion / branding-area / recipient-type enums |
| `GET`    | `/api/products/:productId/reviews`             | public (anon) | APPROVED reviews only |
| `POST`   | `/api/products/:productId/reviews`             | AuthGuard | Create review (status `PENDING`) |
| `GET`    | `/api/admin/product-reviews`                   | RoleGuard(@admin) | Moderation queue |
| `POST`   | `/api/admin/product-reviews/:id/approve`       | RoleGuard(@admin) | APPROVED + emits `product.review-approved.v1` |
| `POST`   | `/api/admin/product-reviews/:id/reject`        | RoleGuard(@admin) | REJECTED with reason |
| `POST`   | `/api/admin/product-reviews/:id/decision`      | RoleGuard(@admin) | Discriminated-union decision body |

## Collections

| Collection | Purpose |
|---|---|
| `product.products` | Product aggregate with embedded `variants` subdoc-array (≤200) |
| `product.product_images` | Per-image rows with R2 keys + content metadata |
| `product.reviews` | Buyer reviews + admin moderation status |
| `product.search_index` | Denormalized snapshot for the M0 search read-path (rebuilt on outbox events) |

## Outbox events

5 v1 events declared at `@repo/events/product` and emitted from `services/product-service`:

1. `product.published.v1` — `DRAFT → PUBLISHED` transition
2. `product.unpublished.v1` — `PUBLISHED → UNPUBLISHED` transition (with optional reason)
3. `product.variant-added.v1` — new variant added to a product
4. `product.image-confirmed.v1` — R2 image upload confirmed
5. `product.review-approved.v1` — admin approved a pending review

Every emission goes through `withTransaction(connection, async session => { domainSave + outbox.publish({session}) })` per `.cursor/rules/event-driven-discipline.mdc`. Analytics fires AFTER the outbox commits per phase-7 D9.

## R2 image upload flow

1. Client `POST /api/products/:productId/images/upload-url` with `{ contentType, fileSize, kind, altText? }`.
2. Server returns `{ url, r2Key, expiresAt }` — 15-min presigned PUT URL with `content-type` + `content-length` bound as signed headers (R2 will reject mismatched headers).
3. Client `PUT` the file bytes directly to `url`.
4. Client `POST /api/products/:productId/images/confirm` with `{ r2Key, kind, altText, sortOrder }`.
5. Server `HEAD r2Key` to verify upload integrity → writes `product.product_images` row → emits `product.image-confirmed.v1` inside `withTransaction`.

Content-type allow-list: `image/jpeg | image/png | image/webp`. Max 5 MB. Per phase-7 D17 — no SVG (XSS surface), no AVIF (Cloudflare Images transcoding is the eventual path).

## Atlas Search read-path

Per phase-7 D11: M0 cluster supports `$search` but with binding quotas (3 indexes max, 10K queries / 7-day rolling). The runtime read path at MVP runs a regex + facet aggregation against `product.search_index` (denormalized snapshot maintained by `atlas-search-sync.service.ts` from outbox events).

The `infrastructure/atlas/search/products.json` mapping IS registered (the existing `.github/workflows/atlas-search-mapping-drift.yml` workflow enforces the 3-index M0 budget). Swap the read path to `$search` post-M10 tier upgrade per [`docs/runbooks/scaling-up.md`](../../docs/runbooks/scaling-up.md). See `TODO(P21)` in `atlas-search-sync.service.ts`.

## Cross-module dependencies

- **`StockReadPort` (read)** — injected via `@Inject(STOCK_READ_PORT)` from `@repo/utils`. Bound to `StubStockReadPort` at MVP; P8 inventory-service ships `RedisStockReadPort` and flips the gateway binding. Documented in [`docs/architecture/cross-service-contracts.md`](../../docs/architecture/cross-service-contracts.md).
- **`VendorService` (guard cross-import)** — `VendorActiveGuard` injects `VendorService` from `@lotusgift/vendor-service` to assert `vendor.status === ACTIVATED` before product writes. Legal per phase-7 D13 + `.cursor/rules/deployment-mode.mdc` (the modular-monolith hosts every business module as a Nest library; the public export surface IS the contract).
