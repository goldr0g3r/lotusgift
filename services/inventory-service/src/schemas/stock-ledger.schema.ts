import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { baseSchemaPlugin, namespace } from '@repo/database';
import { STOCK_LEDGER_REASONS, type StockLedgerReason } from '@repo/types';

export const STOCK_LEDGER_MODEL = 'InventoryStockLedger';

@Schema({
  collection: namespace('inventory', 'stock_ledger'),
  timestamps: true,
})
export class StockLedgerEntry {
  @Prop({ required: true, type: String, index: true })
  variantId!: string;

  @Prop({ required: true, type: String, index: true })
  warehouseId!: string;

  @Prop({ required: true, type: String, index: true })
  orgId!: string;

  @Prop({ required: true, type: String, index: true })
  vendorId!: string;

  @Prop({ required: true, type: Number })
  delta!: number;

  @Prop({ required: true, type: String, enum: STOCK_LEDGER_REASONS })
  reason!: StockLedgerReason;

  @Prop({ type: String, default: null })
  reasonNote!: string | null;

  @Prop({ required: true, type: String })
  actorId!: string;

  @Prop({ type: String, default: null })
  relatedReservationId!: string | null;

  @Prop({ type: String, default: null })
  relatedTransferId!: string | null;

  @Prop({ type: String, default: null })
  relatedOrderId!: string | null;

  @Prop({ required: true, type: Number })
  ledgerSeq!: number;
}

export type StockLedgerDocument = HydratedDocument<StockLedgerEntry>;

export const StockLedgerSchema = SchemaFactory.createForClass(StockLedgerEntry);
StockLedgerSchema.plugin(baseSchemaPlugin);
StockLedgerSchema.index({ variantId: 1, warehouseId: 1, ledgerSeq: 1 });
