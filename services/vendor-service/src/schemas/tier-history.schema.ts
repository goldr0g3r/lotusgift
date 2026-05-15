import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { baseSchemaPlugin, namespace } from '@repo/database';
import { VENDOR_TIER_KEYS, type VendorTierKey } from '@repo/types';

/**
 * Append-only vendor-tier change audit log. One row per upgrade /
 * downgrade; downstream P10 payout reconciliation reads this to attribute
 * commissions to the correct tier window.
 */
@Schema({
  collection: namespace('vendor', 'tier_history'),
  timestamps: { createdAt: 'createdAt', updatedAt: false },
})
export class TierHistory {
  @Prop({ required: true, type: String, index: true })
  vendorId!: string;

  @Prop({ type: String, enum: VENDOR_TIER_KEYS, default: null })
  fromTier!: VendorTierKey | null;

  @Prop({ required: true, type: String, enum: VENDOR_TIER_KEYS })
  toTier!: VendorTierKey;

  @Prop({ required: true, type: String })
  changedBy!: string;

  @Prop({ required: true, type: Date, default: () => new Date() })
  effectiveAt!: Date;
}

export type TierHistoryDocument = HydratedDocument<TierHistory> & {
  _id: Types.ObjectId;
  createdAt: Date;
};

export const TIER_HISTORY_MODEL = 'TierHistory';

export const TierHistorySchema = SchemaFactory.createForClass(TierHistory);
TierHistorySchema.plugin(baseSchemaPlugin);
TierHistorySchema.index({ vendorId: 1, effectiveAt: -1 });
