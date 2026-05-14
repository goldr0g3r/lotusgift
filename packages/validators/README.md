# `@repo/validators`

LotusGift v2's L1 Zod-4 schema package. Pairs every branded scalar in [`@repo/types`](../types/) with a runtime parser, holds shared pagination/audit/error schemas, and reserves per-service subpaths for the schemas that land in P5+ service phases.

Consumers import `z` from `@repo/validators` (NOT from `zod` directly) so the workspace pins a single Zod version end-to-end.

## Module map

| Module | Exports | Use when |
| --- | --- | --- |
| [`zod.ts`](src/zod.ts) | `z`, `ZodError`, `ZodType`, `ZodTypeAny` | Anywhere you'd normally `import { z } from 'zod'`. |
| [`scalars.ts`](src/scalars.ts) | `UlidSchema`, `InrPaiseSchema`, `GstinIndiaSchema`, `PhoneIndiaE164Schema`, `PincodeIndiaSchema`, `IsoDateSchema`, `IsoDateTimeSchema`, `EmailLowercaseSchema`, `UrlSchema`, `R2ObjectKeySchema` | Parsing untrusted input that needs to land as a branded scalar. |
| [`enums.ts`](src/enums.ts) | `OrgKindSchema`, `UserRoleSchema`, `OrderStatusSchema`, `ShipmentStatusSchema`, `PaymentStatusSchema`, `RfqStatusSchema`, `CustomizationStatusSchema`, `RecipientListUploadStatusSchema` | Validating a string-literal status field. |
| [`pagination.ts`](src/pagination.ts) | `PageQuerySchema`, `PageMetaSchema`, `CursorSchema`, `PaginatedSchema(item)`, `CursorPaginatedSchema(item)` | List endpoints — query parsing + response envelope. |
| [`audit.ts`](src/audit.ts) | `AuditMetaSchema` | Embedded audit metadata on persisted entities. |
| [`error.ts`](src/error.ts) | `ProblemDetailsSchema`, `ProblemDetailsFieldErrorSchema`, `LotusGiftErrorCodeEnum`, types | RFC 9457 error envelope. Wire format `application/problem+json`. |
| `<service>/index.ts` (16 folders) | Empty — populated in P5+ per-service phases. | Subpath import: `import { OrderPlaceRequest } from '@repo/validators/order'`. |

## Subpath import pattern

Per [`.cursor/rules/api-type-safety.mdc`](../../.cursor/rules/api-type-safety.mdc), service-specific schemas live at `src/<service>/*.ts` and consumers subpath-import them. This keeps service-private schemas private (auth-service callers can't accidentally `import { InternalRecoveryToken } from '@repo/validators'`).

```ts
// services/order-service/src/place-order.controller.ts
import { createZodDto } from 'nestjs-zod';
import { PlaceOrderRequest } from '@repo/validators/order';

class PlaceOrderDto extends createZodDto(PlaceOrderRequest) {}
```

The 16 service subpaths declared at P2: `auth`, `vendor`, `product`, `inventory`, `customization`, `rfq`, `recipient-list`, `order`, `payment`, `shipping`, `notification`, `tax`, `promotions`, `insights`, `review`, `support`. Each ships an empty `index.ts` shell that the owning service phase populates.

## Scalar regex sources

| Schema | Regex | Source |
| --- | --- | --- |
| `UlidSchema` | `/^[0-9A-HJKMNP-TV-Z]{26}$/` | [ULID spec](https://github.com/ulid/spec) — Crockford base32 (no I, L, O, U). |
| `GstinIndiaSchema` | `/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/` | [GSTN portal spec](https://lookuptax.com/docs/country/india-gst-guidelines-indirect-tax-sales-tax-india) — format only; mod-36 checksum landed in P6. |
| `PhoneIndiaE164Schema` | `/^\+91[6-9]\d{9}$/` | [ITU-T E.164](https://www.itu.int/rec/T-REC-E.164) — India mobile MSISDN. |
| `PincodeIndiaSchema` | `/^[1-9]\d{5}$/` | [Wikipedia: Postal Index Number](https://en.wikipedia.org/wiki/Postal_Index_Number). |
| `IsoDateSchema` | `/^\d{4}-\d{2}-\d{2}$/` + JS `Date` parse | RFC 3339 §5.6 full-date. |
| `IsoDateTimeSchema` | Zod 4 `.datetime()` | RFC 3339 §5.6 date-time. UTC only (`Z` suffix). |

## RFC 9457 error envelope

Every error response across the gateway returns `application/problem+json` matching `ProblemDetailsSchema`. Per RFC 9457 §3.1 the wire format has 5 core members (`type`, `title`, `status`, `detail`, `instance`) — LotusGift adds 3 extension members (`code`, `traceId`, `errors`) for machine-readable handling on the client side:

```jsonc
{
  "type": "about:blank",
  "title": "Validation failed",
  "status": 400,
  "detail": "1 issue prevented the request from being processed.",
  "instance": "/api/v1/orders",
  "code": "VALIDATION_FAILED",
  "traceId": "01HZX...",
  "errors": [
    { "pointer": "/items/0/qty", "code": "too_small", "message": "Quantity must be ≥ 1" }
  ]
}
```

The choice of RFC 9457 library (e.g. `@camcima/nestjs-rfc9457`) is deferred to P4 — the gateway shell wires the envelope into NestJS's exception filter chain there.

## Adding a per-service schema (P5+)

1. Drop the file at `src/<service>/<name>.ts` — e.g. `src/order/place-order.ts` for `services/order-service`.
2. `import { z } from '../zod.js'` + `import { UlidSchema, InrPaiseSchema, ... } from '../scalars.js'`.
3. Re-export from `src/<service>/index.ts`.
4. Consumer imports via subpath: `import { PlaceOrderRequest } from '@repo/validators/order'`.
5. Add a unit test next to the schema (`<name>.test.ts`) covering happy + 2-3 failure paths.

## L1 placement

Per [`.cursor/rules/architecture-layers.mdc`](../../.cursor/rules/architecture-layers.mdc), L1 packages import from L0 only. This package imports `zod` (L0 npm) + `@repo/types` (L1 sibling). It does NOT import NestJS (that's L4+); the `createZodDto` shim from `nestjs-zod` is applied at the controller site, never here.
