import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { baseSchemaPlugin, namespace } from '@repo/database';

/**
 * Vendor payout ledger row. READ-ONLY at MVP — the writer (P10
 * payment-service) populates these rows from `payment.captured.v1`
 * events. P6 only ships the schema + the GET endpoints; vendor-service
 * never writes here at MVP.
 */
@Schema({
  collection: namespace('vendor', 'payouts'),
  timestamps: true,
})
export class Payout {
  @Prop({ required: true, type: String, index: true })
  vendorId!: string;

  @Prop({ required: true, type: Date })
  periodStart!: Date;

  @Prop({ required: true, type: Date })
  periodEnd!: Date;

  @Prop({ required: true, type: Number, min: 0 })
  grossPaise!: number;

  @Prop({ required: true, type: Number, min: 0 })
  commissionPaise!: number;

  @Prop({ required: true, type: Number, min: 0 })
  netPaise!: number;

  @Prop({
    required: true,
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed', 'reversed'],
    default: 'pending',
    index: true,
  })
  status!: 'pending' | 'processing' | 'paid' | 'failed' | 'reversed';

  @Prop({ type: String, default: null })
  razorpayPayoutId!: string | null;
}

export type PayoutDocument = HydratedDocument<Payout> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const PAYOUT_MODEL = 'Payout';

export const PayoutSchema = SchemaFactory.createForClass(Payout);
PayoutSchema.plugin(baseSchemaPlugin);
PayoutSchema.index({ vendorId: 1, periodStart: -1 });
