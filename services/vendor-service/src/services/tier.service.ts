import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ulid, type OutboxPort, OUTBOX_PORT } from '@repo/utils';
import { VendorTierUpgradedV1 } from '@repo/events';
import type { ServerAnalytics } from '@repo/analytics-sdk';
import { type VendorTierKey } from '@repo/types';
import { type TierMatrixResponse } from '@repo/validators';

import {
  TIER_HISTORY_MODEL,
  type TierHistoryDocument,
} from '../schemas/tier-history.schema.js';
import { VENDOR_MODEL, type VendorDocument } from '../schemas/vendor.schema.js';
import {
  WAREHOUSE_MODEL,
  type WarehouseDocument,
} from '../schemas/warehouse.schema.js';
import { TIER_LIMITS } from '../config/tier-limits.config.js';
import { resolveCommissionPct } from '../config/commission-rates.config.js';
import { ANALYTICS_TOKEN } from '../vendor-service.tokens.js';

/**
 * Vendor tier upgrade/downgrade + commission lookup + history audit.
 */
@Injectable()
export class TierService {
  constructor(
    @InjectModel(VENDOR_MODEL) private readonly vendorModel: Model<VendorDocument>,
    @InjectModel(WAREHOUSE_MODEL) private readonly warehouseModel: Model<WarehouseDocument>,
    @InjectModel(TIER_HISTORY_MODEL)
    private readonly tierHistoryModel: Model<TierHistoryDocument>,
    @Inject(OUTBOX_PORT) private readonly outbox: OutboxPort,
    @Inject(ANALYTICS_TOKEN) private readonly analytics: ServerAnalytics,
  ) {}

  /**
   * List the available tiers + their feature matrix. Static for MVP;
   * P14 promotions-service can later return per-vendor personalized
   * pricing.
   */
  listAvailableTiers(): TierMatrixResponse {
    return [
      {
        tier: 'STARTER',
        monthlyPricePaise: 0 as unknown as TierMatrixResponse[number]['monthlyPricePaise'],
        commissionPct: 18,
        maxWarehouses: TIER_LIMITS.STARTER.maxWarehouses,
        features: [
          '1 warehouse',
          'Up to 50 product listings',
          'Standard commission schedule',
          'Email support',
        ],
      },
      {
        tier: 'GROWTH',
        monthlyPricePaise: 999_00 as unknown as TierMatrixResponse[number]['monthlyPricePaise'],
        commissionPct: 14,
        maxWarehouses: TIER_LIMITS.GROWTH.maxWarehouses,
        features: [
          'Up to 5 warehouses',
          'Up to 500 product listings',
          'Reduced commission schedule',
          'Priority support',
          'Tier-gated promotions',
        ],
      },
      {
        tier: 'ENTERPRISE',
        monthlyPricePaise: 4_999_00 as unknown as TierMatrixResponse[number]['monthlyPricePaise'],
        commissionPct: 10,
        maxWarehouses: TIER_LIMITS.ENTERPRISE.maxWarehouses,
        features: [
          'Unlimited warehouses',
          'Unlimited product listings',
          'Lowest commission schedule',
          'Dedicated account manager',
          'Custom integrations',
        ],
      },
    ];
  }

  async getCurrent(vendorId: string): Promise<{ tier: VendorTierKey; effectiveSince: Date }> {
    const vendor = await this.vendorModel.findOne({ id: vendorId }).exec();
    if (!vendor) {
      throw new NotFoundException({
        message: `Vendor ${vendorId} not found`,
        code: 'RESOURCE_NOT_FOUND',
      });
    }
    const latestHistory = await this.tierHistoryModel
      .findOne({ vendorId })
      .sort({ effectiveAt: -1 })
      .exec();
    return {
      tier: vendor.tier,
      effectiveSince: latestHistory?.effectiveAt ?? vendor.createdAt,
    };
  }

  async listHistory(vendorId: string): Promise<TierHistoryDocument[]> {
    return this.tierHistoryModel.find({ vendorId }).sort({ effectiveAt: -1 }).limit(50).exec();
  }

  /**
   * Move a vendor to the requested tier. On a downgrade that exceeds
   * the new tier's warehouse cap, throws 422 instead of silently
   * disabling warehouses — admin can resolve case-by-case.
   */
  async changeTier(args: {
    vendorId: string;
    toTier: VendorTierKey;
    actorId: string;
  }): Promise<{ fromTier: VendorTierKey | null; toTier: VendorTierKey; effectiveAt: Date }> {
    const vendor = await this.vendorModel.findOne({ id: args.vendorId }).exec();
    if (!vendor) {
      throw new NotFoundException({
        message: `Vendor ${args.vendorId} not found`,
        code: 'RESOURCE_NOT_FOUND',
      });
    }

    const fromTier = vendor.tier;
    if (fromTier === args.toTier) {
      // No-op — return the current state without writing a history row.
      return {
        fromTier,
        toTier: args.toTier,
        effectiveAt: vendor.updatedAt,
      };
    }

    const newCap = TIER_LIMITS[args.toTier].maxWarehouses;
    if (newCap !== null) {
      const activeCount = await this.warehouseModel.countDocuments({
        vendorId: args.vendorId,
        enabled: true,
      });
      if (activeCount > newCap) {
        throw new UnprocessableEntityException({
          message: `Downgrade rejected: vendor has ${activeCount} active warehouses but tier ${args.toTier} allows ${newCap}. Disable extra warehouses first.`,
          code: 'WAREHOUSE_TIER_LIMIT_EXCEEDED',
          currentCount: activeCount,
          tierMax: newCap,
        });
      }
    }

    const effectiveAt = new Date();
    vendor.tier = args.toTier;
    vendor.updatedBy = args.actorId;
    await vendor.save();

    await this.tierHistoryModel.create({
      id: ulid(),
      vendorId: args.vendorId,
      fromTier,
      toTier: args.toTier,
      changedBy: args.actorId,
      effectiveAt,
      createdBy: args.actorId,
    });

    await this.emitTierUpgraded({
      orgId: vendor.orgId,
      vendorId: args.vendorId,
      fromTier,
      toTier: args.toTier,
      effectiveAt,
      actorId: args.actorId,
    });

    return { fromTier, toTier: args.toTier, effectiveAt };
  }

  /**
   * Resolve a vendor's effective commission percentage for a given
   * category bucket. Reads per-vendor overrides first, falls back to
   * the tier matrix.
   */
  async resolveCommission(vendorId: string, categoryBucket: string): Promise<number> {
    const vendor = await this.vendorModel.findOne({ id: vendorId }).exec();
    if (!vendor) {
      throw new NotFoundException({
        message: `Vendor ${vendorId} not found`,
        code: 'RESOURCE_NOT_FOUND',
      });
    }
    return resolveCommissionPct(vendor.tier, categoryBucket, vendor.commissionOverride);
  }

  private async emitTierUpgraded(args: {
    orgId: string;
    vendorId: string;
    fromTier: VendorTierKey | null;
    toTier: VendorTierKey;
    effectiveAt: Date;
    actorId: string;
  }): Promise<void> {
    await this.outbox
      .publish(
        {
          type: VendorTierUpgradedV1.name,
          idempotencyKey: `vendor:${args.vendorId}:tier-upgraded:${args.effectiveAt.toISOString()}`,
          payload: {
            orgId: args.orgId,
            vendorId: args.vendorId,
            fromTier: args.fromTier,
            toTier: args.toTier,
            effectiveAt: args.effectiveAt.toISOString(),
          },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { session: undefined as any },
      )
      .catch(() => {});
    this.analytics.capture({
      distinctId: args.actorId,
      event: 'vendor tier-upgraded',
      properties: {
        vendor_id: args.vendorId,
        org_id: args.orgId,
        from_tier: args.fromTier,
        to_tier: args.toTier,
      },
    });
  }
}
