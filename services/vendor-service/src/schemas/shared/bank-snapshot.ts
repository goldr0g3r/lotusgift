import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/**
 * Denormalized bank-account snapshot embedded in `KycSubmission` rows.
 * Captures the bank details exactly as the vendor submitted them so
 * downstream admin review + Razorpay fund-account-validation (P10) can
 * trust the historical context.
 */
@Schema({ _id: false })
export class BankSnapshot {
  @Prop({ required: true, type: String })
  accountNumber!: string;

  @Prop({ required: true, type: String, uppercase: true })
  ifsc!: string;

  @Prop({ required: true, type: String })
  holderName!: string;

  @Prop({ required: true, type: String, enum: ['savings', 'current'] })
  accountType!: 'savings' | 'current';

  @Prop({ type: String, default: null })
  upiVpa!: string | null;
}

export const BankSnapshotSchema = SchemaFactory.createForClass(BankSnapshot);
