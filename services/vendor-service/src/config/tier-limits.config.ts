import type { VendorTierKey } from '@repo/types';

/**
 * Per-tier hard caps consumed by the vendor-service warehouse-create +
 * product-listing endpoints. `Infinity` is encoded as `null` in the
 * persisted matrix (`Enterprise` tier).
 *
 * Per D7 (Q3 user answer = Starter=1, Growth=5, Enterprise=unlimited).
 * See `docs/research/phase-6-vendor-service.md` Appendix D24.
 */
export interface TierLimits {
  /** Maximum number of active warehouses the vendor may register. */
  maxWarehouses: number | null;
  /** Maximum number of active product listings the vendor may publish (consumed by P7). */
  maxProductListings: number | null;
  /** Maximum number of org-members the vendor may invite (consumed by P5b). */
  maxMembers: number | null;
}

export const TIER_LIMITS: Readonly<Record<VendorTierKey, TierLimits>> = {
  STARTER: {
    maxWarehouses: 1,
    maxProductListings: 50,
    maxMembers: 3,
  },
  GROWTH: {
    maxWarehouses: 5,
    maxProductListings: 500,
    maxMembers: 15,
  },
  ENTERPRISE: {
    maxWarehouses: null,
    maxProductListings: null,
    maxMembers: null,
  },
};

/**
 * Test the per-tier warehouse-count cap. Returns `true` iff the vendor
 * may add one more warehouse without exceeding the cap.
 */
export function canAddWarehouse(tier: VendorTierKey, currentCount: number): boolean {
  const cap = TIER_LIMITS[tier].maxWarehouses;
  if (cap === null) return true;
  return currentCount < cap;
}
