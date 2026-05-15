import type { VendorTierKey } from '@repo/types';

/**
 * Sliding tier × category-bucket commission-rate matrix (D13). The
 * resolved rate is consumed by P9 order-service at order-line price
 * computation + P10 payment-service at payout calculation.
 *
 * Per-vendor overrides live on `vendor.vendors.commissionOverride[]`
 * and win over this default per category bucket.
 *
 * Category buckets are intentionally coarse at MVP — fine-grained
 * per-category-id rates land in P7 product-service when the actual
 * taxonomy ships.
 */
export type CategoryBucket =
  | 'corporate-gifts'
  | 'apparel'
  | 'electronics'
  | 'edibles'
  | 'home-decor'
  | 'stationery'
  | 'other';

export const CATEGORY_BUCKETS: readonly CategoryBucket[] = [
  'corporate-gifts',
  'apparel',
  'electronics',
  'edibles',
  'home-decor',
  'stationery',
  'other',
] as const;

export const COMMISSION_MATRIX: Readonly<
  Record<VendorTierKey, Readonly<Record<CategoryBucket, number>>>
> = {
  STARTER: {
    'corporate-gifts': 18,
    apparel: 22,
    electronics: 12,
    edibles: 20,
    'home-decor': 20,
    stationery: 18,
    other: 18,
  },
  GROWTH: {
    'corporate-gifts': 14,
    apparel: 18,
    electronics: 9,
    edibles: 16,
    'home-decor': 16,
    stationery: 14,
    other: 14,
  },
  ENTERPRISE: {
    'corporate-gifts': 10,
    apparel: 13,
    electronics: 6,
    edibles: 12,
    'home-decor': 12,
    stationery: 10,
    other: 10,
  },
};

/**
 * Resolve the commission percentage for a given tier + category bucket
 * + optional per-vendor override array.
 */
export function resolveCommissionPct(
  tier: VendorTierKey,
  categoryBucket: string,
  overrides?: readonly { categoryBucket: string; ratePct: number }[],
): number {
  const override = overrides?.find((o) => o.categoryBucket === categoryBucket);
  if (override) return override.ratePct;
  const matrix = COMMISSION_MATRIX[tier];
  const bucket = (CATEGORY_BUCKETS as readonly string[]).includes(categoryBucket)
    ? (categoryBucket as CategoryBucket)
    : 'other';
  return matrix[bucket];
}
