# `@lotusgift/vendor-service`

LotusGift v2's L4 vendor service. Self-serve onboarding, KYC validation, admin approval gate, multi-warehouse registry, subscription tiers + sliding commission schedule, read-only payouts ledger, and read-only per-warehouse SLA scoring.

Shipped in PR-16 (Phase 6).

## Public surface

- `VendorServiceModule.forRoot(env)` — registers the module + 7 services + 7 controllers + the `RoleGuard`.
- Services: `VendorService`, `OnboardingService`, `KycService`, `WarehouseService`, `TierService`, `PayoutService`, `SlaScoringService`, `GeocoderService`.
- Decorator: `@RequireRole('admin')` (+ `RoleGuard`).
- Schemas: 6 Mongoose models (`vendor.vendors`, `vendor.warehouses`, `vendor.kyc_submissions`, `vendor.payouts`, `vendor.tier_history`, `vendor.warehouse_sla_scores`).
- Configs: `TIER_LIMITS`, `COMMISSION_MATRIX`, `resolveCommissionPct`, `canAddWarehouse`.

## REST endpoints (mounted at `/api/`)

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/vendors` | Admin-only list (filter by status + tier). |
| `GET` | `/api/vendors/:id` | Single vendor profile. |
| `GET` | `/api/vendors/me/current` | Vendor bound to the active org session. |
| `POST` | `/api/vendors/onboarding/start` | Begin / resume onboarding wizard. |
| `POST` | `/api/vendors/onboarding` | Apply a single wizard step. |
| `GET` | `/api/vendors/onboarding/status` | Onboarding progress. |
| `GET` | `/api/admin/vendor-approvals` | Admin queue. |
| `GET` | `/api/admin/vendor-approvals/:id` | Detail for review. |
| `POST` | `/api/admin/vendor-approvals/:id/decision` | Approve or reject. |
| `POST` | `/api/admin/vendor-approvals/:id/approve` | Sugar: approve only. |
| `GET` | `/api/vendors/:vendorId/warehouses` | List warehouses. |
| `POST` | `/api/vendors/:vendorId/warehouses` | Create + geocode. |
| `PATCH` | `/api/warehouses/:id/enabled` | Toggle warehouse enabled flag. |
| `GET` | `/api/warehouses/search` | Cross-service lookup (P11 consumer). |
| `GET` | `/api/vendor-tiers` | Available tier matrix. |
| `GET` | `/api/vendors/:id/tier` | Current tier. |
| `POST` | `/api/vendors/:id/tier` | Tier upgrade / downgrade. |
| `GET` | `/api/vendors/:id/commission-rate?categoryBucket=...` | Resolved commission percentage. |
| `GET` | `/api/vendors/:id/payouts` | Read-only payout list (empty until P10). |
| `GET` | `/api/vendors/:id/payouts/current-period` | Estimated current period (zeros until P10). |
| `GET` | `/api/warehouses/:warehouseId/sla-score` | Read-only SLA rollup (empty until P21). |

## Onboarding flow

```text
BASIC -> KYC -> BANK -> WAREHOUSES -> TIER -> SUBMITTED_FOR_REVIEW
```

Each step is gated; backward or skip transitions reject with `ProblemDetails 400 VALIDATION_FAILED`. KYC submission writes the `vendor.kyc_submissions` row at the end of the `BANK` step (when GSTIN + PAN + bank are all present) and emits `vendor.kyc-submitted.v1`.

## KYC validation matrix

| Field | Rule | Source |
| --- | --- | --- |
| GSTIN | Regex (`@repo/validators.GstinIndiaSchema`) + mod-36 checksum (inline) | Cites #1 + #2 |
| PAN | Regex (`@repo/validators.PanSchema`) + 4th-char enum must match `entityKind` | Cite #3 |
| IFSC | Regex (`@repo/validators.IfscSchema`) | Cite #4 |
| UPI VPA | Regex (`@repo/validators.UpiVpaSchema`); optional | Cite #5 |
| Bank account | 9-18 digit account number, 2-120 char holder name, IFSC must validate | — |

Razorpay fund-account-validation API enrichment is deferred to P10 (Q2 / D23 in the research note).

## Warehouse design

- `address` uses ISO 3166-2:IN state codes (`IN-KA`, `IN-MH`, ...).
- `location` is a GeoJSON Point indexed via `2dsphere`.
- `serviceZone` is a discriminated union — `mode: 'pincodes'` (cheap, btree-indexed) or `mode: 'polygon'` (`2dsphere`-indexed GeoJSON MultiPolygon for `$geoWithin` queries from P11 shipping-service).
- `operatingHours` is a per-weekday open/close map (IST) with a `closed: true` marker for Sundays / holidays.
- `carrierCutoffs` is a per-carrier-per-weekday `HH:mm`-or-null map (Shiprocket / Delhivery / Bluedart).
- `ownerType` discriminates `vendor` vs `platform` (FBA-style — schema accepts both, controller rejects `platform` at MVP).

Per-tier warehouse caps: Starter = 1, Growth = 5, Enterprise = unlimited (Q3 / D24 in the research note). Cap exceeded returns `ProblemDetails 422 WAREHOUSE_TIER_LIMIT_EXCEEDED`.

## Cross-service consumer table

| Consumer | Reads | Writes via event |
| --- | --- | --- |
| P7 product-service | `vendor.status` (must be `ACTIVATED` for product create) | — |
| P9 order-service | `vendor.warehouses` (for shipment routing) | — |
| P10 payment-service | — | Subscribes to `vendor.kyc-submitted.v1` (enrichment) + writes `vendor.payouts` |
| P11 shipping-service | `vendor.warehouses[].serviceZone` (`$geoWithin`) + `carrierCutoffs` | — |
| P12 notification-service | — | Subscribes to all 5 vendor events (welcome / KYC under review / activated / warehouse added / tier upgraded) |
| P13 tax-service | `vendor.warehouses[].address.state` (GST origin) | — |
| P14 promotions-service | `vendor.tier` (subscription billing) | — |
| P18 web-admin | All vendor + warehouse data | — |
| P21 observability | — | Cron writes `vendor.warehouse_sla_scores` rollups |

## Outbox events emitted (5)

- `vendor.onboarding-started.v1`
- `vendor.kyc-submitted.v1`
- `vendor.activated.v1`
- `vendor.warehouse-added.v1`
- `vendor.tier-upgraded.v1`

## Geocoding

OSM Nominatim with a 1 req/sec semaphore + 24h LRU cache (per `docs/research/phase-6-vendor-service.md` D2 / D22). The cache is in-process (`lru-cache` 11). Multi-process scaling pushes the limit to a Redis token bucket; documented in `docs/runbooks/scaling-up.md` (MapMyIndia is the recommended paid upgrade path).

## Authentication

- Every endpoint runs through the global `AuthGuard` from P5b — anonymous access requires `@AllowAnonymous()`.
- Role-gated endpoints layer `@UseGuards(RoleGuard) @RequireRole('admin')` on top. Mismatch throws `ForbiddenException` with `code: 'AUTH_FORBIDDEN'`; the global `GlobalProblemDetailsFilter` renders the RFC 9457 envelope.

## Research note

[docs/research/phase-6-vendor-service.md](../../docs/research/phase-6-vendor-service.md) — 17 retrieval-dated 2026-05-15 citations + D1-D26 decisions + Q-open notes + implementation checklist.
