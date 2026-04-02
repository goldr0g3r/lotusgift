import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type QuoteDocument = HydratedDocument<Quote>;

export const QUOTE_STATUSES = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

@Schema({ timestamps: true, collection: 'quotes' })
export class Quote {
  @Prop({ type: String, default: () => new Types.ObjectId().toHexString() })
  _id: string;

  @Prop({ required: true, unique: true })
  quoteNumber: string;

  @Prop()
  clientId?: string;

  @Prop()
  userId?: string;

  @Prop({ enum: QUOTE_STATUSES, default: 'DRAFT' })
  status: QuoteStatus;

  @Prop({ required: true })
  subtotal: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ default: 0 })
  tax: number;

  @Prop({ required: true })
  total: number;

  @Prop()
  notes?: string;

  @Prop()
  adminNotes?: string;

  @Prop()
  validUntil?: Date;
}

export const QuoteSchema = SchemaFactory.createForClass(Quote);
QuoteSchema.set('toJSON', { virtuals: true });
QuoteSchema.set('toObject', { virtuals: true });
