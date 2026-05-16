import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { baseSchemaPlugin, namespace } from '@repo/database';

export const TRANSFER_MODEL = 'InventoryTransfer';

const TRANSFER_STATUSES = ['PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'] as const;
export type TransferStatus = (typeof TRANSFER_STATUSES)[number];

@Schema({
  collection: namespace('inventory', 'transfers'),
  timestamps: true,
})
export class InventoryTransfer {
  @Prop({ required: true, type: String })
  fromWarehouseId!: string;

  @Prop({ required: true, type: String })
  toWarehouseId!: string;

  @Prop({ required: true, type: String })
  variantId!: string;

  @Prop({ required: true, type: String })
  orgId!: string;

  @Prop({ required: true, type: String })
  vendorId!: string;

  @Prop({ required: true, type: Number })
  qty!: number;

  @Prop({ required: true, type: String })
  reasonNote!: string;

  @Prop({ required: true, type: String, enum: TRANSFER_STATUSES, default: 'COMPLETED' })
  status!: TransferStatus;

  @Prop({ required: true, type: String })
  initiatedBy!: string;

  @Prop({ required: true, type: Date })
  initiatedAt!: Date;

  @Prop({ type: Date, default: null })
  completedAt!: Date | null;
}

export type TransferDocument = HydratedDocument<InventoryTransfer>;

export const TransferSchema = SchemaFactory.createForClass(InventoryTransfer);
TransferSchema.plugin(baseSchemaPlugin);
TransferSchema.index({ vendorId: 1, status: 1 });
