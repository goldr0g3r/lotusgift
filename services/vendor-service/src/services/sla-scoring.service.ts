import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  WAREHOUSE_SLA_SCORE_MODEL,
  type WarehouseSlaScoreDocument,
} from '../schemas/warehouse-sla-score.schema.js';

/**
 * Per-warehouse SLA scoring READ-ONLY surface. The writer (P21
 * observability cron) populates `vendor.warehouse_sla_scores`;
 * vendor-service only ever reads here at MVP. The web-vendor app
 * surfaces a "Coming P21" UX hint until real rollups land.
 */
@Injectable()
export class SlaScoringService {
  constructor(
    @InjectModel(WAREHOUSE_SLA_SCORE_MODEL)
    private readonly slaModel: Model<WarehouseSlaScoreDocument>,
  ) {}

  async findByWarehouse(args: {
    warehouseId: string;
    days: number;
  }): Promise<WarehouseSlaScoreDocument[]> {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - args.days);
    const sinceIso = since.toISOString().slice(0, 10);
    return this.slaModel
      .find({ warehouseId: args.warehouseId, date: { $gte: sinceIso } })
      .sort({ date: -1 })
      .exec();
  }
}
