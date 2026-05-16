import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { baseSchemaPlugin, namespace } from '@repo/database';

export const STOCK_SNAPSHOT_MODEL = 'InventoryStockSnapshot';

@Schema({
  collection: namespace('inventory', 'stock_snapshots'),
  timestamps: true,
})
export class StockSnapshotDoc {
  @Prop({ required: true, type: String })
  variantId!: string;

  @Prop({ required: true, type: String })
  warehouseId!: string;

  @Prop({ required: true, type: String })
  orgId!: string;

  @Prop({ required: true, type: String })
  vendorId!: string;

  @Prop({ required: true, type: Number, min: 0, default: 0 })
  onHand!: number;

  @Prop({ required: true, type: Number, min: 0, default: 0 })
  reservedCount!: number;

  @Prop({ required: true, type: Number, min: 0, default: 10 })
  lowStockThreshold!: number;

  @Prop({ required: true, type: Number, min: 0, default: 5 })
  reorderPoint!: number;

  @Prop({ required: true, type: Number, min: 1, default: 50 })
  reorderQty!: number;

  @Prop({ required: true, type: Date, default: () => new Date() })
  lastMovementAt!: Date;

  @Prop({ required: true, type: Number, min: 0, default: 0 })
  pendingLedgerCount!: number;

  @Prop({ required: true, type: Number, min: 0, default: 0 })
  lastSnapshotLedgerSeq!: number;
}

export type StockSnapshotDocument = HydratedDocument<StockSnapshotDoc>;

export const StockSnapshotSchema = SchemaFactory.createForClass(StockSnapshotDoc);
StockSnapshotSchema.plugin(baseSchemaPlugin);
StockSnapshotSchema.index({ variantId: 1, warehouseId: 1 }, { unique: true });
StockSnapshotSchema.index({ variantId: 1 });
