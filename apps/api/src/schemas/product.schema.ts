import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true, collection: 'products' })
export class Product {
  @Prop({ type: String, default: () => new Types.ObjectId().toHexString() })
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  shortDesc?: string;

  @Prop({ required: true, unique: true })
  sku: string;

  @Prop({ required: true })
  priceFrom: number;

  @Prop()
  priceTo?: number;

  @Prop()
  wholesalePrice?: number;

  @Prop({ default: 10 })
  wholesaleMinQty: number;

  @Prop({ required: true })
  categoryId: string;

  @Prop()
  imageUrl?: string;

  @Prop({ default: 0 })
  stock: number;

  @Prop({ default: 1 })
  minOrderQty: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: false })
  isWholesale: boolean;

  @Prop()
  customizationOptions?: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });
