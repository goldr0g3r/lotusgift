import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

export const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

@Schema({ timestamps: true, collection: 'orders' })
export class Order {
  @Prop({ type: String, default: () => new Types.ObjectId().toHexString() })
  _id: string;

  @Prop({ required: true, unique: true })
  orderNumber: string;

  @Prop()
  userId?: string;

  @Prop()
  quoteId?: string;

  @Prop({ enum: ORDER_STATUSES, default: 'PENDING' })
  status: OrderStatus;

  @Prop({ required: true })
  subtotal: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ default: 0 })
  tax: number;

  @Prop({ required: true })
  total: number;

  @Prop()
  shippingAddress?: string;

  @Prop()
  notes?: string;

  @Prop()
  razorpayOrderId?: string;

  @Prop()
  razorpayPaymentId?: string;

  @Prop()
  paidAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.set('toJSON', { virtuals: true });
OrderSchema.set('toObject', { virtuals: true });
