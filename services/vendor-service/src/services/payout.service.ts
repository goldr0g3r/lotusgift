import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { PAYOUT_MODEL, type PayoutDocument } from '../schemas/payout.schema.js';

/**
 * Vendor payout ledger READ-ONLY surface. The writer (P10
 * payment-service) populates the `vendor.payouts` collection from
 * `payment.captured.v1` events; vendor-service only ever reads here at
 * MVP.
 */
@Injectable()
export class PayoutService {
  constructor(
    @InjectModel(PAYOUT_MODEL) private readonly payoutModel: Model<PayoutDocument>,
  ) {}

  async listByVendor(args: {
    vendorId: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: PayoutDocument[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = args.page ?? 1;
    const limit = args.limit ?? 20;
    const [items, total] = await Promise.all([
      this.payoutModel
        .find({ vendorId: args.vendorId })
        .sort({ periodStart: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.payoutModel.countDocuments({ vendorId: args.vendorId }),
    ]);
    return {
      items: items as PayoutDocument[],
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id: string): Promise<PayoutDocument | null> {
    return this.payoutModel.findOne({ id }).exec();
  }

  /**
   * Estimated current-period totals — placeholder until P10 ships the
   * writer. Always returns zeros at MVP so the web-vendor UI can render
   * the "no payouts yet" state without errors.
   */
  async getCurrentPeriodTotals(vendorId: string): Promise<{
    vendorId: string;
    periodStart: string;
    periodEnd: string;
    estimatedGrossPaise: number;
    estimatedCommissionPaise: number;
    estimatedNetPaise: number;
  }> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return {
      vendorId,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      estimatedGrossPaise: 0,
      estimatedCommissionPaise: 0,
      estimatedNetPaise: 0,
    };
  }
}
