import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { baseSchemaPlugin, namespace } from '@repo/database';
import { IMAGE_KIND_KEYS, type ImageKind } from '@repo/types';

/**
 * Persisted product image row. Written by `image.service.confirm`
 * after the client PUTs the bytes to R2 + the service HEADs the
 * object to verify upload integrity (content-type + content-length
 * match the presign constraints per D17).
 */

@Schema({
  collection: namespace('product', 'product_images'),
  timestamps: true,
})
export class ProductImage {
  @Prop({ required: true, type: String, index: true })
  productId!: string;

  @Prop({ required: true, type: String, index: true })
  vendorId!: string;

  @Prop({ required: true, type: String, unique: true })
  r2Key!: string;

  @Prop({ required: true, type: String, enum: IMAGE_KIND_KEYS })
  kind!: ImageKind;

  @Prop({ type: String, default: null })
  altText!: string | null;

  @Prop({ required: true, type: Number, min: 0, max: 100, default: 0 })
  sortOrder!: number;

  @Prop({ type: Number, default: null })
  width!: number | null;

  @Prop({ type: Number, default: null })
  height!: number | null;

  @Prop({ type: Number, default: null })
  byteSize!: number | null;

  @Prop({ type: String, default: null })
  contentType!: string | null;

  @Prop({ required: true, type: Date, default: Date.now })
  confirmedAt!: Date;

  @Prop({ type: String, required: false })
  createdBy?: string;

  @Prop({ type: String, required: false })
  updatedBy?: string;
}

export type ProductImageDocument = HydratedDocument<ProductImage> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const PRODUCT_IMAGE_MODEL = 'ProductImage';

export const ProductImageSchema = SchemaFactory.createForClass(ProductImage);
ProductImageSchema.plugin(baseSchemaPlugin);
ProductImageSchema.index({ productId: 1, sortOrder: 1 });
ProductImageSchema.index({ productId: 1, kind: 1 });
