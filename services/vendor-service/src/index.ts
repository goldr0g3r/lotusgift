export { VendorServiceModule } from './vendor-service.module.js';

export {
  ANALYTICS_TOKEN,
  ENV_TOKEN,
  GEOCODER_FETCH_TOKEN,
} from './vendor-service.tokens.js';

export {
  GeocoderService,
  KycService,
  NO_OP_ANALYTICS,
  OnboardingService,
  PayoutService,
  SlaScoringService,
  TierService,
  VendorService,
  WarehouseService,
  type CreateWarehouseInput,
  type FetchLike,
  type GeocodeResult,
  type KycSubmissionInput,
  type KycValidationResult,
} from './services/index.js';

export {
  REQUIRE_ROLE_KEY,
  RequireRole,
  RoleGuard,
} from './decorators/index.js';

export {
  AdminApprovalController,
  OnboardingController,
  PayoutController,
  SlaScoreController,
  TierController,
  VendorController,
  WarehouseController,
  mapVendorToResponse,
  mapWarehouseToResponse,
} from './controllers/index.js';

export {
  KYC_SUBMISSION_MODEL,
  PAYOUT_MODEL,
  TIER_HISTORY_MODEL,
  VENDOR_MODEL,
  WAREHOUSE_MODEL,
  WAREHOUSE_SLA_SCORE_MODEL,
  type KycSubmissionDocument,
  type PayoutDocument,
  type TierHistoryDocument,
  type VendorDocument,
  type WarehouseDocument,
  type WarehouseSlaScoreDocument,
} from './schemas/index.js';

export {
  TIER_LIMITS,
  canAddWarehouse,
  type TierLimits,
} from './config/tier-limits.config.js';
export {
  CATEGORY_BUCKETS,
  COMMISSION_MATRIX,
  resolveCommissionPct,
  type CategoryBucket,
} from './config/commission-rates.config.js';
