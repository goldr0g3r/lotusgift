import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { baseSchemaPlugin, namespace } from '@repo/database';

export const LOW_STOCK_CONFIG_MODEL = 'InventoryLowStockConfig';

@Schema({
  collection: namespace('inventory', 'low_stock_config'),
  timestamps: true,
})
export class LowStockConfig {
  @Prop({ required: true, type: String })
  variantId!: string;

  @Prop({ required: true, type: String })
  warehouseId!: string;

  @Prop({ required: true, type: String })
  vendorId!: string;

  @Prop({ required: true, type: String })
  orgId!: string;

  @Prop({ required: true, type: Number, min: 0 })
  lowStockThreshold!: number;

  @Prop({ type: Number, min: 0 })
  reorderPoint?: number;

  @Prop({ type: Number, min: 1 })
  reorderQty?: number;
}

export type LowStockConfigDocument = HydratedDocument<LowStockConfig>;

export const LowStockConfigSchema = SchemaFactory.createForClass(LowStockConfig);
LowStockConfigSchema.plugin(baseSchemaPlugin);
LowStockConfigSchema.index({ variantId: 1, warehouseId: 1 }, { unique: true });
