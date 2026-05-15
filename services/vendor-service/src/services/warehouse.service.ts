import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';

import { ulid, type OutboxPort, OUTBOX_PORT } from '@repo/utils';
import { withTransaction } from '@repo/database';
import { VendorWarehouseAddedV1 } from '@repo/events';
import type { ServerAnalytics } from '@repo/analytics-sdk';
import { WarehouseCreateRequestSchema, type WarehouseCreateRequest } from '@repo/validators';
import type { InStateCode, VendorTierKey } from '@repo/types';

import {
  WAREHOUSE_MODEL,
  type WarehouseDocument,
} from '../schemas/warehouse.schema.js';
import { VENDOR_MODEL, type VendorDocument } from '../schemas/vendor.schema.js';
import { canAddWarehouse, TIER_LIMITS } from '../config/tier-limits.config.js';
import { GeocoderService } from './geocoder.service.js';
import { ANALYTICS_TOKEN } from '../vendor-service.tokens.js';

export interface CreateWarehouseInput extends WarehouseCreateRequest {
  vendorId: string;
  actorId: string;
  /**
   * Override tier used for the warehouse-count cap. Used by the
   * onboarding wizard's WAREHOUSES step so vendors selecting a higher
   * tier on the upcoming TIER step aren't blocked by their current
   * default STARTER cap (D27 — Q3 fix).
   */
  tierOverride?: VendorTierKey;
}

/**
 * Warehouse CRUD + Nominatim geocoding + per-tier cap enforcement +
 * `vendor.warehouse-added.v1` outbox emission.
 */
@Injectable()
export class WarehouseService {
  constructor(
    @InjectModel(WAREHOUSE_MODEL)
    private readonly warehouseModel: Model<WarehouseDocument>,
    @InjectModel(VENDOR_MODEL)
    private readonly vendorModel: Model<VendorDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly geocoder: GeocoderService,
    @Inject(OUTBOX_PORT) private readonly outbox: OutboxPort,
    @Inject(ANALYTICS_TOKEN) private readonly analytics: ServerAnalytics,
  ) {}

  async create(input: CreateWarehouseInput): Promise<WarehouseDocument> {
    // Re-validate at the service-layer boundary so internal callers
    // (onboarding wizard) get the same schema guarantees as REST.
    const parsed = WarehouseCreateRequestSchema.parse(input);

    const vendor = await this.vendorModel.findOne({ id: input.vendorId }).exec();
    if (!vendor) {
      throw new NotFoundException({
        message: `Vendor ${input.vendorId} not found`,
        code: 'RESOURCE_NOT_FOUND',
      });
    }

    if (parsed.ownerType !== 'vendor') {
      // Platform-owned warehouses are forward-compat (schema accepts
      // them) but parked to scaling-up.md; reject at the controller
      // edge for now.
      throw new UnprocessableEntityException({
        message: 'Platform-owned warehouses are not yet supported at MVP',
        code: 'VALIDATION_FAILED',
      });
    }

    // Geocode OUTSIDE the transaction (network I/O + Nominatim's 1
    // req/sec semaphore — keeping the Mongo transaction short avoids
    // holding write locks while the HTTP round-trip runs).
    const addressLine = this.buildAddressLine(parsed.address);
    const location = await this.geocoder.geocode(addressLine);
    const docId = ulid();

    // Atomic dual-write: cap-check (inside tx for serialization
    // safety) + warehouse insert + outbox publish. The tier override
    // is consumed by the onboarding wizard's WAREHOUSES step so a
    // vendor onboarding into GROWTH can register 2-5 warehouses up
    // front instead of being blocked by their current default STARTER
    // cap of 1 (Q3 / D24 / D27 in the research note).
    const effectiveTier = input.tierOverride ?? vendor.tier;
    let created!: WarehouseDocument;
    await withTransaction(this.connection, async (session) => {
      const currentCount = await this.warehouseModel.countDocuments(
        { vendorId: input.vendorId, enabled: true },
        { session },
      );
      if (!canAddWarehouse(effectiveTier, currentCount)) {
        const cap = TIER_LIMITS[effectiveTier].maxWarehouses;
        throw new UnprocessableEntityException({
          message: `Tier ${effectiveTier} allows at most ${cap} warehouse(s); vendor has ${currentCount}`,
          code: 'WAREHOUSE_TIER_LIMIT_EXCEEDED',
          currentCount,
          tierMax: cap,
        });
      }
      const docs = await this.warehouseModel.create(
        [
          {
            id: docId,
            vendorId: input.vendorId,
            orgId: vendor.orgId,
            displayName: parsed.displayName,
            ownerType: parsed.ownerType,
            address: parsed.address,
            contact: parsed.contact ?? null,
            location: location
              ? { type: 'Point' as const, coordinates: location.coordinates }
              : null,
            operatingHours: parsed.operatingHours,
            carrierCutoffs: parsed.carrierCutoffs ?? {},
            serviceZone: parsed.serviceZone,
            pickupSlaHours: parsed.pickupSlaHours,
            enabled: parsed.enabled,
            createdBy: input.actorId,
          },
        ],
        { session },
      );
      created = docs[0] as WarehouseDocument;
      await this.outbox.publish(
        {
          type: VendorWarehouseAddedV1.name,
          idempotencyKey: `vendor:${input.vendorId}:warehouse-added:${docId}`,
          payload: {
            orgId: vendor.orgId,
            vendorId: input.vendorId,
            warehouseId: docId,
            state: parsed.address.state,
            pincode: parsed.address.pincode,
          },
        },
        { session },
      );
    });

    // Analytics POST-commit (D18).
    this.analytics.capture({
      distinctId: input.actorId,
      event: 'warehouse added',
      properties: {
        vendor_id: input.vendorId,
        org_id: vendor.orgId,
        warehouse_id: docId,
        state: parsed.address.state,
      },
    });

    return created;
  }

  async findByVendor(vendorId: string): Promise<WarehouseDocument[]> {
    return this.warehouseModel.find({ vendorId }).sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<WarehouseDocument | null> {
    return this.warehouseModel.findOne({ id }).exec();
  }

  async toggleEnabled(id: string, enabled: boolean, actorId: string): Promise<WarehouseDocument> {
    const updated = await this.warehouseModel
      .findOneAndUpdate({ id }, { $set: { enabled, updatedBy: actorId } }, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException({
        message: `Warehouse ${id} not found`,
        code: 'RESOURCE_NOT_FOUND',
      });
    }
    return updated as WarehouseDocument;
  }

  async search(filter: {
    state?: InStateCode;
    pincode?: string;
    vendorId?: string;
  }): Promise<WarehouseDocument[]> {
    const query: Record<string, unknown> = { enabled: true };
    if (filter.state) query['address.state'] = filter.state;
    if (filter.pincode) {
      query.$or = [
        { 'address.pincode': filter.pincode },
        {
          serviceZone: { mode: 'pincodes' },
          'serviceZone.pincodes': filter.pincode,
        },
      ];
    }
    if (filter.vendorId) query.vendorId = filter.vendorId;
    return this.warehouseModel.find(query).limit(100).exec();
  }

  private buildAddressLine(address: WarehouseCreateRequest['address']): string {
    return [
      address.line1,
      address.line2,
      address.landmark,
      address.city,
      address.state,
      address.pincode,
      'India',
    ]
      .filter((p) => typeof p === 'string' && p.length > 0)
      .join(', ');
  }
}
