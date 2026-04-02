import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Order, OrderSchema, OrderItem, OrderItemSchema, Quote, QuoteSchema, QuoteItem, QuoteItemSchema } from '../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: OrderItem.name, schema: OrderItemSchema },
      { name: Quote.name, schema: QuoteSchema },
      { name: QuoteItem.name, schema: QuoteItemSchema },
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
