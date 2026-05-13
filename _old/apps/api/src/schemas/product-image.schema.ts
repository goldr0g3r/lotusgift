import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductImageDocument = HydratedDocument<ProductImage>;

@Schema({ collection: 'product_images' })
export class ProductImage {
  @Prop({ type: String, default: () => new Types.ObjectId().toHexString() })
  _id: string;

  @Prop({ required: true })
  productId: string;

  @Prop({ required: true })
  url: string;

  @Prop()
  alt?: string;

  @Prop({ default: 0 })
  sortOrder: number;
}

export const ProductImageSchema = SchemaFactory.createForClass(ProductImage);
ProductImageSchema.set('toJSON', { virtuals: true });
ProductImageSchema.set('toObject', { virtuals: true });
