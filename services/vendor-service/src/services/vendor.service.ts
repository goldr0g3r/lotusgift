import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';

import { ulid, type OutboxPort, OUTBOX_PORT } from '@repo/utils';
import { withTransaction } from '@repo/database';
import { VendorActivatedV1 } from '@repo/events';
import type { ServerAnalytics } from '@repo/analytics-sdk';
import type { VendorStatus, VendorTierKey } from '@repo/types';

import { VENDOR_MODEL, type VendorDocument } from '../schemas/vendor.schema.js';
import { ANALYTICS_TOKEN } from '../vendor-service.tokens.js';

interface ListVendorsArgs {
  status?: VendorStatus;
  tier?: VendorTierKey;
  page?: number;
  limit?: number;
}

interface ListVendorsResult {
  items: VendorDocument[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

/**
 * Vendor profile aggregate service. CRUD on `vendor.vendors` + the
 * status-transition guards that the admin-approval queue consumes.
 */
@Injectable()
export class VendorService {
  constructor(
    @InjectModel(VENDOR_MODEL) private readonly vendorModel: Model<VendorDocument>,
    @InjectConnection() private readonly connection: Connection,
    @Inject(OUTBOX_PORT) private readonly outbox: OutboxPort,
    @Inject(ANALYTICS_TOKEN) private readonly analytics: ServerAnalytics,
  ) {}

  async getById(id: string): Promise<VendorDocument> {
    const vendor = await this.vendorModel.findOne({ id }).exec();
    if (!vendor) {
      throw new NotFoundException({
        message: `Vendor ${id} not found`,
        code: 'RESOURCE_NOT_FOUND',
      });
    }
    return vendor as VendorDocument;
  }

  async getByOrgId(orgId: string): Promise<VendorDocument | null> {
    return this.vendorModel.findOne({ orgId }).exec();
  }

  async list(args: ListVendorsArgs): Promise<ListVendorsResult> {
    const page = args.page ?? 1;
    const limit = args.limit ?? 20;
    const filter: Record<string, unknown> = {};
    if (args.status) filter.status = args.status;
    if (args.tier) filter.tier = args.tier;

    const [items, total] = await Promise.all([
      this.vendorModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.vendorModel.countDocuments(filter),
    ]);

    return {
      items: items as VendorDocument[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Admin approves a vendor — flips `status` to `ACTIVATED` and emits
   * `vendor.activated.v1`. Idempotent: re-approving an already-active
   * vendor returns the existing record without re-emitting.
   */
  async approve(args: {
    vendorId: string;
    approvedBy: string;
    notes?: string;
  }): Promise<VendorDocument> {
    const vendor = await this.getById(args.vendorId);
    if (vendor.status === 'ACTIVATED') return vendor;

    if (vendor.status === 'REJECTED' || vendor.status === 'SUSPENDED') {
      // Bypass DRAFT-only restriction so admins can rehabilitate
      // rejected vendors after the vendor re-submits.
    }

    // Atomic dual-write — status flip + outbox row commit together so
    // a failed outbox insert aborts the status flip (and vice versa).
    // Per `.cursor/rules/event-driven-discipline.mdc`.
    const activatedAt = new Date();
    await withTransaction(this.connection, async (session) => {
      vendor.status = 'ACTIVATED';
      vendor.activatedAt = activatedAt;
      vendor.updatedBy = args.approvedBy;
      await vendor.save({ session });
      await this.outbox.publish(
        {
          type: VendorActivatedV1.name,
          idempotencyKey: `vendor:${args.vendorId}:activated:${activatedAt.toISOString()}`,
          payload: {
            orgId: vendor.orgId,
            vendorId: args.vendorId,
            approvedBy: args.approvedBy,
            activatedAt: activatedAt.toISOString(),
          },
        },
        { session },
      );
    });

    // Analytics fires AFTER commit so a failed transaction never
    // ghost-emits (D18 in docs/research/phase-6-vendor-service.md).
    this.analytics.capture({
      distinctId: args.approvedBy,
      event: 'vendor activated',
      properties: {
        vendor_id: args.vendorId,
        org_id: vendor.orgId,
        tier: vendor.tier,
        notes: args.notes ? '[present]' : undefined,
      },
    });

    return vendor;
  }

  /**
   * Admin rejects a vendor — flips `status` to `REJECTED` with reason.
   * Re-onboarding requires the admin or the vendor to move the row
   * back to DRAFT (a P18 workflow).
   */
  async reject(args: { vendorId: string; rejectedBy: string; reason: string }): Promise<VendorDocument> {
    const vendor = await this.getById(args.vendorId);
    vendor.status = 'REJECTED';
    vendor.rejectedReason = args.reason;
    vendor.updatedBy = args.rejectedBy;
    await vendor.save();
    return vendor;
  }

  /**
   * Generate a fresh ULID — exposed so other services (onboarding) can
   * share a consistent ID-issuance source.
   */
  generateId(): string {
    return ulid();
  }
}
