import {
  IsoDateTimeSchema,
  UlidSchema,
  VendorTierSchema,
  z,
} from '@repo/validators';

import { defineEvent } from '../builders.js';

/**
 * Published by `services/vendor-service` when a vendor upgrades or
 * downgrades their subscription tier. Consumers: P14 promotions-service
 * adjusts billing; P7 product-service recomputes per-tier listing caps;
 * analytics emits `vendor tier-upgraded` downstream.
 *
 * `fromTier` is nullable for the initial tier assignment at onboarding
 * (no prior tier).
 */
export const VendorTierUpgradedV1 = defineEvent(
  'vendor.tier-upgraded.v1',
  z.object({
    orgId: UlidSchema,
    vendorId: UlidSchema,
    fromTier: VendorTierSchema.nullable(),
    toTier: VendorTierSchema,
    effectiveAt: IsoDateTimeSchema,
  }),
);

export type VendorTierUpgradedV1Payload = z.infer<
  typeof VendorTierUpgradedV1.schema
>['payload'];
