import { z } from './zod.js';

/**
 * LotusGift v2 machine-readable error codes. Grouped by HTTP status
 * family; service phases (P5+) add codes via the same enum. The
 * canonical list also lives in `@repo/openapi-spec/error-codes` for
 * codegen tooling — keep the two in sync.
 *
 * Naming convention: `<DOMAIN>_<REASON>` in SCREAMING_SNAKE_CASE.
 */
export const LotusGiftErrorCodeEnum = z.enum([
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
  // 500 — internal
  'INTERNAL_ERROR',
  'OUTBOX_PUBLISH_FAILED',
  // 502/503/504 — upstream
  'UPSTREAM_UNAVAILABLE',
  'UPSTREAM_TIMEOUT',
]);

export type LotusGiftErrorCode = z.infer<typeof LotusGiftErrorCodeEnum>;

/**
 * Field-level validation issue surfaced inside `ProblemDetails.errors[]`.
 */
export const ProblemDetailsFieldErrorSchema = z.object({
  /** JSON-pointer-ish path to the offending field (e.g. `"/items/0/qty"`). */
  pointer: z.string(),
  /** Machine-readable issue code from `ZodIssueCode` or our own. */
  code: z.string(),
  /** Human-readable explanation. */
  message: z.string(),
});

/**
 * RFC 9457 Problem Details for HTTP APIs.
 *
 * @see https://datatracker.ietf.org/doc/rfc9457/
 *
 * Wire format: `application/problem+json`. Core members per RFC 9457
 * §3.1; LotusGift extension members are `code`, `traceId`, `errors`.
 */
export const ProblemDetailsSchema = z.object({
  /**
   * URI reference identifying the problem type. Either an absolute URL
   * or the relative `about:blank` sentinel.
   */
  type: z.string().default('about:blank'),
  /** Short, human-readable summary. */
  title: z.string(),
  /** HTTP status code echoed for client convenience. */
  status: z.number().int().min(100).max(599),
  /** Human-readable explanation specific to this occurrence. */
  detail: z.string().optional(),
  /** URI reference identifying this specific occurrence. */
  instance: z.string().optional(),
  // ---- LotusGift extension members ----
  /** Machine-readable LotusGift error code. */
  code: LotusGiftErrorCodeEnum.optional(),
  /** Trace ID for correlation with logs/spans (forwarded from the gateway). */
  traceId: z.string().optional(),
  /** Field-level validation issues, populated when `code === 'VALIDATION_FAILED'`. */
  errors: z.array(ProblemDetailsFieldErrorSchema).optional(),
});

export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>;
export type ProblemDetailsFieldError = z.infer<typeof ProblemDetailsFieldErrorSchema>;
