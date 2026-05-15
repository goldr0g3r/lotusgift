import {
  CATEGORY_BUCKETS,
  COMMISSION_MATRIX,
  resolveCommissionPct,
} from '../config/commission-rates.config.js';
import { TIER_LIMITS, canAddWarehouse } from '../config/tier-limits.config.js';

describe('Commission matrix lookup', () => {
  it('returns the tier-default rate for every (tier, bucket) cell', () => {
    for (const tier of ['STARTER', 'GROWTH', 'ENTERPRISE'] as const) {
      for (const bucket of CATEGORY_BUCKETS) {
        const expected = COMMISSION_MATRIX[tier][bucket];
        const actual = resolveCommissionPct(tier, bucket);
        expect(actual).toBe(expected);
      }
    }
  });

  it('falls back to the "other" bucket for unknown categories', () => {
    expect(resolveCommissionPct('STARTER', 'no-such-bucket')).toBe(
      COMMISSION_MATRIX.STARTER.other,
    );
  });

  it('per-vendor override beats the tier default', () => {
    const override = [{ categoryBucket: 'corporate-gifts', ratePct: 5 }];
    const rate = resolveCommissionPct('STARTER', 'corporate-gifts', override);
    expect(rate).toBe(5);
  });
});

describe('Per-tier warehouse caps', () => {
  it('Starter allows 1 warehouse only', () => {
    expect(TIER_LIMITS.STARTER.maxWarehouses).toBe(1);
    expect(canAddWarehouse('STARTER', 0)).toBe(true);
    expect(canAddWarehouse('STARTER', 1)).toBe(false);
  });

  it('Growth allows up to 5 warehouses', () => {
    expect(TIER_LIMITS.GROWTH.maxWarehouses).toBe(5);
    expect(canAddWarehouse('GROWTH', 4)).toBe(true);
    expect(canAddWarehouse('GROWTH', 5)).toBe(false);
  });

  it('Enterprise has unlimited warehouses', () => {
    expect(TIER_LIMITS.ENTERPRISE.maxWarehouses).toBeNull();
    expect(canAddWarehouse('ENTERPRISE', 0)).toBe(true);
    expect(canAddWarehouse('ENTERPRISE', 1_000)).toBe(true);
  });
});
