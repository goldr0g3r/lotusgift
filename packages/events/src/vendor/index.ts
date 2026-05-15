// Per-service event schemas for `services/vendor-service` (P6 —
// populates the empty P2 shell). 5 v1 events covering the vendor
// lifecycle.

export {
  VendorOnboardingStartedV1,
  type VendorOnboardingStartedV1Payload,
} from './onboarding-started.v1.js';

export {
  VendorKycSubmittedV1,
  type VendorKycSubmittedV1Payload,
} from './kyc-submitted.v1.js';

export { VendorActivatedV1, type VendorActivatedV1Payload } from './activated.v1.js';

export {
  VendorWarehouseAddedV1,
  type VendorWarehouseAddedV1Payload,
} from './warehouse-added.v1.js';

export {
  VendorTierUpgradedV1,
  type VendorTierUpgradedV1Payload,
} from './tier-upgraded.v1.js';
