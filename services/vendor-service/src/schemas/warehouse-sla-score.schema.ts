import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { baseSchemaPlugin, namespace } from '@repo/database';

/**
 * Per-warehouse-per-day SLA rollup row. READ-ONLY at MVP — the writer
 * (P21 observability cron) populates these from shipping events. P6
 * ships the schema + the GET endpoints; web-vendor (P17) surfaces a
 * "Coming P21" UX hint until real data lands.
 */
@Schema({
  collection: namespace('vendor', 'warehouse_sla_scores'),
  timestamps: { createdAt: 'createdAt', updatedAt: false },
})
export class WarehouseSlaScore {
  @Prop({ required: true, type: String, index: true })
  warehouseId!: string;

  @Prop({ required: true, type: String, index: true })
  vendorId!: string;

  @Prop({ required: true, type: String })
  date!: string;

  @Prop({ required: true, type: Number, min: 0, default: 0 })
  ordersPickedOnTime!: number;

  @Prop({ required: true, type: Number, min: 0, default: 0 })
  ordersPickedLate!: number;

  @Prop({ type: Number, min: 0, max: 100, default: null })
  sla7DayAvgPct!: number | null;
}

export type WarehouseSlaScoreDocument = HydratedDocument<WarehouseSlaScore> & {
  _id: Types.ObjectId;
  createdAt: Date;
};

export const WAREHOUSE_SLA_SCORE_MODEL = 'WarehouseSlaScore';

export const WarehouseSlaScoreSchema = SchemaFactory.createForClass(WarehouseSlaScore);
WarehouseSlaScoreSchema.plugin(baseSchemaPlugin);
WarehouseSlaScoreSchema.index({ warehouseId: 1, date: -1 }, { unique: true });
