import type { LotusGiftErrorCode } from '@repo/validators';

/**
 * Canonical catalog of LotusGift error codes, grouped by HTTP status
 * family. The Zod enum + runtime parser live in
 * `@repo/validators/error.ts`; this module exposes the same codes as
 * `const` arrays for codegen + documentation.
 *
 * Keep this list in sync with `LotusGiftErrorCodeEnum` in
 * `@repo/validators/error.ts` — adding a code requires updating BOTH.
 *
 * Service phases (P5+) add codes via PR touching both files atomically.
 */

export const ERROR_CODES_4XX = [
  // 400 — request validation / domain rule failures
  'VALIDATION_FAILED',
  'IDEMPOTENCY_KEY_MISMATCH',
  'RECIPIENT_LIST_INVALID_ROW',
  'CUSTOMIZATION_INVALID_TRANSITION',
  'ORDER_RFQ_ROUTE_REQUIRED',
  'INVENTORY_INSUFFICIENT_STOCK',
  // 401 — authentication
  'AUTH_INVALID_TOKEN',
  'AUTH_2FA_REQUIRED',
  'AUTH_SESSION_EXPIRED',
  // 403 — authorization
  'AUTH_FORBIDDEN',
  'VENDOR_NOT_ACTIVATED',
  'CORPORATE_BUYER_KYC_REQUIRED',
  // 404 — resource lookup
  'RESOURCE_NOT_FOUND',
  // 409 — conflict
  'RESOURCE_CONFLICT',
  'OPTIMISTIC_LOCK_FAILED',
  // 422 — payment + business rule
  'PAYMENT_DECLINED',
  'CREDIT_LIMIT_EXCEEDED',
  // 429 — rate limit
  'RATE_LIMIT_EXCEEDED',
] as const satisfies readonly LotusGiftErrorCode[];

export const ERROR_CODES_5XX = [
  'INTERNAL_ERROR',
  'OUTBOX_PUBLISH_FAILED',
  'UPSTREAM_UNAVAILABLE',
  'UPSTREAM_TIMEOUT',
] as const satisfies readonly LotusGiftErrorCode[];

export const ALL_ERROR_CODES = [...ERROR_CODES_4XX, ...ERROR_CODES_5XX] as const;

/**
 * Map error code → suggested HTTP status. Service controllers should
 * use this when throwing `ProblemException` so client-visible status
 * codes stay consistent across the gateway.
 */
export const ERROR_CODE_DEFAULT_STATUS: Readonly<Record<LotusGiftErrorCode, number>> = {
  VALIDATION_FAILED: 400,
  IDEMPOTENCY_KEY_MISMATCH: 400,
  RECIPIENT_LIST_INVALID_ROW: 400,
  CUSTOMIZATION_INVALID_TRANSITION: 400,
  ORDER_RFQ_ROUTE_REQUIRED: 400,
  INVENTORY_INSUFFICIENT_STOCK: 400,
  AUTH_INVALID_TOKEN: 401,
  AUTH_2FA_REQUIRED: 401,
  AUTH_SESSION_EXPIRED: 401,
  AUTH_FORBIDDEN: 403,
  VENDOR_NOT_ACTIVATED: 403,
  CORPORATE_BUYER_KYC_REQUIRED: 403,
  RESOURCE_NOT_FOUND: 404,
  RESOURCE_CONFLICT: 409,
  OPTIMISTIC_LOCK_FAILED: 409,
  PAYMENT_DECLINED: 422,
  CREDIT_LIMIT_EXCEEDED: 422,
  RATE_LIMIT_EXCEEDED: 429,
  INTERNAL_ERROR: 500,
  OUTBOX_PUBLISH_FAILED: 500,
  UPSTREAM_UNAVAILABLE: 502,
  UPSTREAM_TIMEOUT: 504,
};
