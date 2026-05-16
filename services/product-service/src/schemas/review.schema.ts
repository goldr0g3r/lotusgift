import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { baseSchemaPlugin, namespace } from '@repo/database';
import { REVIEW_STATUS_KEYS, type ReviewStatus } from '@repo/types';

/**
 * Product review aggregate. Buyers create reviews in `PENDING`; admins
 * moderate via approve/reject. Approved reviews factor into the
 * product's `ratingAggregate` (computed when the moderation transition
 * fires inside `withTransaction`).
 */

@Schema({
  collection: namespace('product', 'reviews'),
  timestamps: true,
})
export class ProductReview {
  @Prop({ required: true, type: String, index: true })
  productId!: string;

  @Prop({ required: true, type: String, index: true })
  vendorId!: string;

  @Prop({ required: true, type: String, index: true })
  buyerId!: string;

  @Prop({ required: true, type: Number, min: 1, max: 5 })
  rating!: number;

  @Prop({ type: String, default: null })
  title!: string | null;

  @Prop({ required: true, type: String, trim: true })
  comment!: string;

  @Prop({
    required: true,
    type: String,
    enum: REVIEW_STATUS_KEYS,
    default: 'PENDING' as ReviewStatus,
    index: true,
  })
  status!: ReviewStatus;

  @Prop({ type: String, default: null })
  moderatedBy!: string | null;

  @Prop({ type: Date, default: null })
  moderatedAt!: Date | null;

  @Prop({ type: String, default: null })
  moderationReason!: string | null;

  @Prop({ type: String, required: false })
  createdBy?: string;

  @Prop({ type: String, required: false })
  updatedBy?: string;
}

export type ProductReviewDocument = HydratedDocument<ProductReview> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const PRODUCT_REVIEW_MODEL = 'ProductReview';

export const ProductReviewSchema = SchemaFactory.createForClass(ProductReview);
ProductReviewSchema.plugin(baseSchemaPlugin);
ProductReviewSchema.index({ productId: 1, status: 1, createdAt: -1 });
ProductReviewSchema.index({ buyerId: 1, productId: 1 }, { unique: true });
