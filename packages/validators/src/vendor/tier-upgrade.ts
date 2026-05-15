import { z } from '../zod.js';
import { InrPaiseSchema } from '../scalars.js';

import { VendorTierSchema } from './india.js';

/** Request body for `POST /api/vendors/:id/tier`. */
export const TierUpgradeRequestSchema = z.object({
  toTier: VendorTierSchema,
});

/** One row in the available-tiers matrix. */
export const TierMatrixRowSchema = z.object({
  tier: VendorTierSchema,
  monthlyPricePaise: InrPaiseSchema,
  commissionPct: z.number().min(0).max(100),
  maxWarehouses: z.number().int().min(1).nullable(),
  features: z.array(z.string()),
});

/** Response for `GET /api/vendor-tiers`. */
export const TierMatrixResponseSchema = z.array(TierMatrixRowSchema);

/** Response for `GET /api/vendors/:id/tier`. */
export const VendorTierStateSchema = z.object({
  vendorId: z.string(),
  tier: VendorTierSchema,
  effectiveSince: z.string(),
  history: z.array(
    z.object({
      fromTier: VendorTierSchema.nullable(),
      toTier: VendorTierSchema,
      effectiveAt: z.string(),
      changedBy: z.string(),
    }),
  ),
});

export type TierUpgradeRequest = z.infer<typeof TierUpgradeRequestSchema>;
export type TierMatrixRow = z.infer<typeof TierMatrixRowSchema>;
export type TierMatrixResponse = z.infer<typeof TierMatrixResponseSchema>;
export type VendorTierState = z.infer<typeof VendorTierStateSchema>;
