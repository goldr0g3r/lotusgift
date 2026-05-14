# `@repo/openapi-spec`

LotusGift v2's L1 OpenAPI-extension catalog. Centralises the `x-*` keys consumed by Kubb + the gateway runtime, ships the RFC 9457 ProblemDetails JSON Schema generated from `@repo/validators`, and holds the canonical error-code catalog grouped by HTTP status family.

## Module map

| Module | Exports | Use when |
| --- | --- | --- |
| [`extensions.ts`](src/extensions.ts) | `X_RATE_LIMIT_TIER`, `X_AUTH_REQUIRED`, `X_FEATURE_FLAG`, `X_DEPRECATION_DATE`, `X_KUBB_REACT_QUERY`, `X_EXTENSIONS`, `RateLimitTier`, `KubbReactQueryHints` | Setting OpenAPI extension keys on a controller's `@ApiOperation()`. |
| [`problem-details.ts`](src/problem-details.ts) | `ProblemDetailsJsonSchema`, `PROBLEM_JSON_MEDIA_TYPE`, `problemResponse(status, desc)` | Wiring RFC 9457 error responses into a controller. |
| [`error-codes.ts`](src/error-codes.ts) | `ERROR_CODES_4XX`, `ERROR_CODES_5XX`, `ALL_ERROR_CODES`, `ERROR_CODE_DEFAULT_STATUS` | Throwing a `ProblemException` with the right HTTP status. |
| [`types.ts`](src/types.ts) | `RateLimitTier`, `KubbReactQueryHints`, `AuthRequirement` | TS type annotations for handler metadata. |

## OpenAPI x-* extension catalog

Per [OpenAPI 3.1 §4.9](https://spec.openapis.org/oas/v3.1.0#specification-extensions), `x-*` keys are allowed at any object position. LotusGift v2 reserves 5:

| Key constant | Wire key | Consumed by | Purpose |
| --- | --- | --- | --- |
| `X_RATE_LIMIT_TIER` | `x-rate-limit-tier` | Gateway middleware (P4) | Routes the request to the matching Upstash Redis bucket. |
| `X_AUTH_REQUIRED` | `x-auth-required` | Kubb + gateway middleware | Mirrors the `@AllowAnonymous` decorator; surfaced in Swagger UI. |
| `X_FEATURE_FLAG` | `x-feature-flag` | Gateway middleware (P3b) | PostHog flag gating the endpoint. |
| `X_DEPRECATION_DATE` | `x-deprecation-date` | Swagger UI + Kubb hooks | ISO date for deprecation badges + client warnings. |
| `X_KUBB_REACT_QUERY` | `x-kubb-react-query` | [`@kubb/plugin-react-query`](https://kubb.dev/plugins/plugin-react-query/) | `{ infinite?, suspense? }` hints for TanStack Query hook emit. |

```ts
// services/order-service/src/place-order.controller.ts (lands at P9)
import { X_RATE_LIMIT_TIER, X_AUTH_REQUIRED } from '@repo/openapi-spec';

@ApiOperation({
  [X_RATE_LIMIT_TIER]: 'authenticated' satisfies RateLimitTier,
  [X_AUTH_REQUIRED]: true,
})
@Post()
place(@Body() dto: PlaceOrderDto) { ... }
```

## RFC 9457 ProblemDetails wire format

Wire media type: `application/problem+json`. The full schema lives in [`@repo/validators/error`](../validators/src/error.ts); this package exposes the JSON Schema representation derived from it via Zod 4's native `z.toJSONSchema({ target: 'openapi-3.0' })`:

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

```ts
// services/order-service/src/place-order.controller.ts
import { problemResponse } from '@repo/openapi-spec';

@ApiResponse(problemResponse(400, 'Validation failed'))
@ApiResponse(problemResponse(422, 'Payment declined'))
@Post()
place(@Body() dto: PlaceOrderDto) { ... }
```

The actual `ProblemException` filter + library choice (`@camcima/nestjs-rfc9457` vs. `nest-problem-details` vs. hand-rolled) lands at P4 (api-gateway shell). P2 ships only the wire-format schema + helpers.

## Error-code lifecycle

The canonical error-code list lives in [`error-codes.ts`](src/error-codes.ts), grouped by HTTP status family. Adding a code requires touching BOTH:

1. `@repo/validators/error.ts` — add to `LotusGiftErrorCodeEnum`.
2. `@repo/openapi-spec/error-codes.ts` — add to the appropriate `ERROR_CODES_4XX` or `ERROR_CODES_5XX` array + the `ERROR_CODE_DEFAULT_STATUS` map.

The service PR adding the code does both atomically. CI's `dep-cruiser` job + a planned smoke test (P4) cross-check the two stay in sync.

Naming convention: `<DOMAIN>_<REASON>` in `SCREAMING_SNAKE_CASE`. Example: `RECIPIENT_LIST_INVALID_ROW`, `PAYMENT_DECLINED`, `OUTBOX_PUBLISH_FAILED`.

## L1 placement

Per [`.cursor/rules/architecture-layers.mdc`](../../.cursor/rules/architecture-layers.mdc), L1 packages import from L0 only. This package imports `zod` (L0 npm) + `@repo/validators` (L1 sibling, peer-only for type inference). It does NOT import NestJS, Swagger module, or any web-server library — the JSON Schema constants must be loadable from a CLI codegen script.
