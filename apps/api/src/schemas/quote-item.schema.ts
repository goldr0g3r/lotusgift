import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type QuoteItemDocument = HydratedDocument<QuoteItem>;

@Schema({ collection: 'quote_items' })
export class QuoteItem {
  @Prop({ type: String, default: () => new Types.ObjectId().toHexString() })
  _id: string;

  @Prop({ required: true })
  quoteId: string;

  @Prop({ required: true })
  productId: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  unitPrice: number;

  @Prop({ required: true })
  total: number;

  @Prop()
  customization?: string;
}

export const QuoteItemSchema = SchemaFactory.createForClass(QuoteItem);
QuoteItemSchema.set('toJSON', { virtuals: true });
QuoteItemSchema.set('toObject', { virtuals: true });
