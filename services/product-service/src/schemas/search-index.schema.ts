import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

import { baseSchemaPlugin, namespace } from '@repo/database';
import {
  PRODUCT_CATEGORY_L1_KEYS,
  PRODUCT_CATEGORY_L2_KEYS,
  PRODUCT_OCCASIONS,
  PRODUCT_STATUS_KEYS,
  RECIPIENT_TYPES,
  type ProductCategoryL1,
  type ProductCategoryL2,
  type ProductOccasion,
  type ProductStatus,
  type RecipientType,
} from '@repo/types';

/**
 * Denormalized snapshot of a published product, written by
 * `atlas-search-sync.service.ts` for the M0 read-path fallback per
 * D11. The runtime `search.service.ts` runs a regex + facet aggregation
 * against this collection — NOT Atlas `$search` — until the M10 tier
 * upgrade per `docs/runbooks/scaling-up.md`.
 *
 * `searchTerms` is the lowercased + space-normalized concatenation of
 * `title + descriptionPlain + categoryL2 + occasions` used by the
 * substring `q` filter in search-query.
 */

@Schema({
  collection: namespace('product', 'search_index'),
  timestamps: true,
})
export class ProductSearchIndex {
  @Prop({ required: true, type: String, unique: true, index: true })
  productId!: string;

  @Prop({ required: true, type: String, index: true })
  vendorId!: string;

  @Prop({ required: true, type: String, index: true })
  orgId!: string;

  @Prop({ required: true, type: String })
  title!: string;

  @Prop({ required: true, type: String })
  slug!: string;

  @Prop({ required: true, type: String })
  descriptionPlain!: string;

  @Prop({
    required: true,
    type: String,
    enum: PRODUCT_STATUS_KEYS,
    default: 'PUBLISHED' as ProductStatus,
    index: true,
  })
  status!: ProductStatus;

  @Prop({ required: true, type: String, enum: PRODUCT_CATEGORY_L1_KEYS, index: true })
  categoryL1!: ProductCategoryL1;

  @Prop({ required: true, type: String, enum: PRODUCT_CATEGORY_L2_KEYS, index: true })
  categoryL2!: ProductCategoryL2;

  @Prop({ required: true, type: [String], enum: PRODUCT_OCCASIONS, default: [] })
  occasions!: ProductOccasion[];

  @Prop({ required: true, type: [String], enum: RECIPIENT_TYPES, default: [] })
  recipientTypes!: RecipientType[];

  @Prop({ required: true, type: Boolean, default: false, index: true })
  customizable!: boolean;

  @Prop({ required: true, type: Number, min: 1, default: 1 })
  moq!: number;

  @Prop({ required: true, type: Number, min: 0, default: 0 })
  leadTimeDays!: number;

  @Prop({ required: true, type: Number, min: 0 })
  basePricePaise!: number;

  @Prop({ required: true, type: Number, min: 0 })
  minVariantPricePaise!: number;

  @Prop({ required: true, type: String, index: 'text' })
  searchTerms!: string;

  @Prop({
    required: true,
    type: MongooseSchema.Types.Mixed,
    default: { sum: 0, count: 0, average: 0 },
  })
  ratingAggregate!: { sum: number; count: number; average: number };

  @Prop({ required: true, type: Date, default: Date.now })
  indexedAt!: Date;

  @Prop({ required: true, type: Number, min: 0, default: 0 })
  searchVersion!: number;

  @Prop({ type: String, required: false })
  createdBy?: string;

  @Prop({ type: String, required: false })
  updatedBy?: string;
}

export type ProductSearchIndexDocument = HydratedDocument<ProductSearchIndex> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const PRODUCT_SEARCH_INDEX_MODEL = 'ProductSearchIndex';

export const ProductSearchIndexSchema = SchemaFactory.createForClass(ProductSearchIndex);
ProductSearchIndexSchema.plugin(baseSchemaPlugin);
// Compound indexes covering the most common faceted-query combinations
// from `SearchProductsQuery`. The text index on `searchTerms` enables
// substring queries via `$regex` (M0 doesn't expose `$search`).
ProductSearchIndexSchema.index({ status: 1, categoryL1: 1 });
ProductSearchIndexSchema.index({ status: 1, occasions: 1 });
ProductSearchIndexSchema.index({ status: 1, recipientTypes: 1 });
ProductSearchIndexSchema.index({ status: 1, vendorId: 1 });
