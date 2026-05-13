import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import {
  Product, ProductSchema,
  Client, ClientSchema,
  Quote, QuoteSchema, QuoteItem, QuoteItemSchema,
  Order, OrderSchema, OrderItem, OrderItemSchema,
  ContactInquiry, ContactInquirySchema,
  User, UserSchema,
} from '../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Client.name, schema: ClientSchema },
      { name: Quote.name, schema: QuoteSchema },
      { name: QuoteItem.name, schema: QuoteItemSchema },
      { name: Order.name, schema: OrderSchema },
      { name: OrderItem.name, schema: OrderItemSchema },
      { name: ContactInquiry.name, schema: ContactInquirySchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
