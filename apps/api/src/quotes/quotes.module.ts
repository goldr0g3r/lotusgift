import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import {
  Quote,
  QuoteSchema,
  QuoteItem,
  QuoteItemSchema,
  Product,
  ProductSchema,
  SiteSetting,
  SiteSettingSchema,
} from '../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Quote.name, schema: QuoteSchema },
      { name: QuoteItem.name, schema: QuoteItemSchema },
      { name: Product.name, schema: ProductSchema },
      { name: SiteSetting.name, schema: SiteSettingSchema },
    ]),
  ],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
