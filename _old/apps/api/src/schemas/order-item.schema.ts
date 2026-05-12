import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderItemDocument = HydratedDocument<OrderItem>;

@Schema({ collection: 'order_items' })
export class OrderItem {
  @Prop({ type: String, default: () => new Types.ObjectId().toHexString() })
  _id: string;

  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  productId: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  unitPrice: number;

  @Prop({ required: true })
  total: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);
OrderItemSchema.set('toJSON', { virtuals: true });
OrderItemSchema.set('toObject', { virtuals: true });
