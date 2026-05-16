import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

import { baseSchemaPlugin, namespace } from '@repo/database';
import {
  BRANDING_AREA_KEYS,
  PRODUCT_CATEGORY_L1_KEYS,
  PRODUCT_CATEGORY_L2_KEYS,
  PRODUCT_OCCASIONS,
  PRODUCT_STATUS_KEYS,
  RECIPIENT_TYPES,
  type BrandingArea,
  type ProductCategoryL1,
  type ProductCategoryL2,
  type ProductOccasion,
  type ProductStatus,
  type RecipientType,
} from '@repo/types';

import { VariantSchema, type Variant } from './variant.schema.js';

/**
 * Product aggregate. Per phase-7 D3 + D14 + D15:
 *
 * - `vendorId` is a string FK onto `vendor.vendors.id` (the P6 ULID
 *   field) — NOT the Mongo ObjectId — so the FK survives Mongo
 *   sharding key choices later.
 * - `orgId` is the Better-Auth organization id (`vendor.vendors.orgId`)
 *   denormalized onto the product for fast ownership-guard lookup
 *   without a $lookup per request.
 * - `variants` is an embedded subdoc-array (≤200 entries per D18) with
 *   `attributes: Map<string, string>` per Q2.
 * - `slug` is unique on the `(orgId, slug)` compound index — same
 *   vendor can't have duplicate slugs; different vendors can share.
 * - `searchVersion` increments on every published-content edit so the
 *   `atlas-search-sync` consumer can dedupe stale rebuild events.
 */

@Schema({
  collection: namespace('product', 'products'),
  timestamps: true,
})
export class Product {
  @Prop({ required: true, type: String, index: true })
  vendorId!: string;

  // orgId is part of the compound `(orgId, slug)` unique index below;
  // no inline `index: true` to avoid the Mongoose duplicate-index warning.
  @Prop({ required: true, type: String })
  orgId!: string;

  @Prop({ required: true, type: String, trim: true })
  title!: string;

  @Prop({ required: true, type: String, trim: true, lowercase: true })
  slug!: string;

  @Prop({ required: true, type: String, trim: true })
  descriptionMd!: string;

  @Prop({
    required: true,
    type: String,
    enum: PRODUCT_STATUS_KEYS,
    default: 'DRAFT' as ProductStatus,
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

  @Prop({ required: true, type: Boolean, default: false })
  customizable!: boolean;

  @Prop({ required: true, type: [String], enum: BRANDING_AREA_KEYS, default: [] })
  brandingAreas!: BrandingArea[];

  @Prop({ required: true, type: Number, min: 1, max: 100_000, default: 1 })
  moq!: number;

  @Prop({ required: true, type: Number, min: 0, max: 180, default: 0 })
  leadTimeDays!: number;

  @Prop({ required: true, type: Boolean, default: false })
  sampleAvailable!: boolean;

  @Prop({ required: true, type: String, trim: true })
  hsnCode!: string;

  @Prop({ required: true, type: Number, min: 0 })
  basePricePaise!: number;

  @Prop({ required: true, type: String, default: 'INR' })
  currency!: 'INR';

  @Prop({ required: true, type: [VariantSchema], default: [] })
  variants!: Variant[];

  @Prop({ type: MongooseSchema.Types.Mixed, default: { sum: 0, count: 0 } })
  ratingAggregate!: { sum: number; count: number };

  @Prop({ required: true, type: Number, default: 0, min: 0 })
  searchVersion!: number;

  @Prop({ type: Date, default: null })
  publishedAt!: Date | null;

  @Prop({ type: Date, default: null })
  unpublishedAt!: Date | null;

  @Prop({ type: String, default: null })
  unpublishedReason!: string | null;

  // Audit fields injected by `baseSchemaPlugin` (declared explicitly so
  // the @Schema-derived TS type carries them; plugin add is idempotent).
  @Prop({ type: String, required: false })
  createdBy?: string;

  @Prop({ type: String, required: false })
  updatedBy?: string;
}

export type ProductDocument = HydratedDocument<Product> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const PRODUCT_MODEL = 'Product';

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.plugin(baseSchemaPlugin);
ProductSchema.index({ orgId: 1, slug: 1 }, { unique: true });
ProductSchema.index({ vendorId: 1, status: 1 });
ProductSchema.index({ status: 1, categoryL1: 1, categoryL2: 1 });
