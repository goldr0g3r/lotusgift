export { z } from './zod.js';
export type { ZodError, ZodType, ZodTypeAny } from './zod.js';

export {
  EmailLowercaseSchema,
  GstinIndiaSchema,
  InrPaiseSchema,
  IsoDateSchema,
  IsoDateTimeSchema,
  PhoneIndiaE164Schema,
  PincodeIndiaSchema,
  R2ObjectKeySchema,
  UlidSchema,
  UrlSchema,
} from './scalars.js';

export {
  CustomizationStatusSchema,
  OrderStatusSchema,
  OrgKindSchema,
  PaymentStatusSchema,
  RecipientListUploadStatusSchema,
  RfqStatusSchema,
  ShipmentStatusSchema,
  UserRoleSchema,
} from './enums.js';

export {
  CursorPaginatedSchema,
  CursorSchema,
  PageMetaSchema,
  PageQuerySchema,
  PaginatedSchema,
} from './pagination.js';

export { AuditMetaSchema } from './audit.js';

export {
  LotusGiftErrorCodeEnum,
  ProblemDetailsFieldErrorSchema,
  ProblemDetailsSchema,
} from './error.js';
export type { LotusGiftErrorCode, ProblemDetails, ProblemDetailsFieldError } from './error.js';

// Vendor + warehouse + KYC schemas (P6 — populates the empty P2 shell).
export * from './vendor/index.js';

// Product catalog + variant + R2 image + search + review schemas (P7 —
// populates the empty P2 shell).
export * from './product/index.js';

// Inventory ledger + reservations + availability schemas (P8).
export * from './inventory/index.js';
