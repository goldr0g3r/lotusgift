// Per-service Zod schemas for `services/vendor-service` (P6 — populated
// from the empty P2 shell). Public surface re-exported here for the
// top-level `@repo/validators` barrel.

export {
  CarrierKeySchema,
  InStateCodeSchema,
  KycStatusSchema,
  PanEntityKindSchema,
  VendorStatusSchema,
  VendorTierSchema,
  WarehouseOwnerTypeSchema,
  WeekdaySchema,
} from './india.js';

export { PanSchema } from './pan.js';
export { IfscSchema } from './ifsc.js';
export { UpiVpaSchema } from './upi-vpa.js';

export { BankAccountSchema } from './bank-account.js';
export type { BankAccount } from './bank-account.js';

export {
  assertGstinChecksumValid,
  computeGstinCheckChar,
  GstinWithChecksumSchema,
} from './gstin-checksum.js';

export {
  BankStepSchema,
  KycStepSchema,
  OnboardingRequestSchema,
  OnboardingStatusResponseSchema,
  OnboardingStepSchema,
  TierStepSchema,
  VendorBasicStepSchema,
  WarehousesStepSchema,
} from './onboarding-request.js';
export type {
  BankStep,
  KycStep,
  OnboardingRequest,
  OnboardingStatusResponse,
  OnboardingStep,
  TierStep,
  VendorBasicStep,
  WarehousesStep,
} from './onboarding-request.js';

export {
  CarrierCutoffEntrySchema,
  CarrierCutoffsSchema,
  GeoJsonMultiPolygonSchema,
  GeoJsonPointSchema,
  OperatingHoursEntrySchema,
  OperatingHoursSchema,
  ServiceZoneSchema,
  WarehouseAddressSchema,
  WarehouseCreateRequestSchema,
  WarehouseListResponseSchema,
  WarehouseResponseSchema,
  WarehouseSearchQuerySchema,
  WarehouseUpdateRequestSchema,
} from './warehouse-row.js';
export type {
  CarrierCutoffs,
  GeoJsonMultiPolygon,
  GeoJsonPoint,
  OperatingHours,
  ServiceZone,
  WarehouseAddress,
  WarehouseCreateRequest,
  WarehouseListResponse,
  WarehouseResponse,
  WarehouseSearchQuery,
  WarehouseUpdateRequest,
} from './warehouse-row.js';

export {
  TierMatrixResponseSchema,
  TierMatrixRowSchema,
  TierUpgradeRequestSchema,
  VendorTierStateSchema,
} from './tier-upgrade.js';
export type {
  TierMatrixResponse,
  TierMatrixRow,
  TierUpgradeRequest,
  VendorTierState,
} from './tier-upgrade.js';

export {
  PayoutCurrentPeriodResponseSchema,
  PayoutListResponseSchema,
  PayoutRowSchema,
  PayoutStatusSchema,
} from './payout-row.js';
export type {
  PayoutCurrentPeriodResponse,
  PayoutListResponse,
  PayoutRow,
  PayoutStatus,
} from './payout-row.js';

export {
  WarehouseSlaScoreResponseSchema,
  WarehouseSlaScoreRowSchema,
} from './sla-score.js';
export type {
  WarehouseSlaScoreResponse,
  WarehouseSlaScoreRow,
} from './sla-score.js';

export {
  AdminApprovalDecisionSchema,
  VendorListQuerySchema,
  VendorProfileResponseSchema,
} from './vendor-profile.js';
export type {
  AdminApprovalDecision,
  VendorListQuery,
  VendorProfileResponse,
} from './vendor-profile.js';
