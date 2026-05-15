import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

import { baseSchemaPlugin, namespace } from '@repo/database';
import {
  VENDOR_STATUS_KEYS,
  VENDOR_TIER_KEYS,
  type VendorStatus,
  type VendorTierKey,
} from '@repo/types';

/**
 * Vendor profile aggregate. One vendor = one Better-Auth `vendor-org`
 * Organization (per D6 in `docs/research/phase-6-vendor-service.md`).
 *
 * `orgId` is a string FK onto the Better-Auth `organization.id` (which
 * lives in the isolated `lotusgift_auth` database — see P5b D15). We
 * don't model a Mongoose ref here because the Auth db is opaque to the
 * Mongoose connection.
 *
 * `commissionOverride` is an admin-only field that wins over the
 * tier-default commission for the specified category buckets.
 */
export interface CommissionOverrideEntry {
  categoryBucket: string;
  ratePct: number;
}

@Schema({ _id: false })
export class CommissionOverride {
  @Prop({ required: true, type: String })
  categoryBucket!: string;

  @Prop({ required: true, type: Number, min: 0, max: 100 })
  ratePct!: number;
}

export const CommissionOverrideSchema = SchemaFactory.createForClass(CommissionOverride);

@Schema({
  collection: namespace('vendor', 'vendors'),
  timestamps: true,
})
export class Vendor {
  @Prop({ required: true, type: String, index: true })
  orgId!: string;

  @Prop({ required: true, type: String, trim: true })
  displayName!: string;

  @Prop({ required: true, type: String, lowercase: true, trim: true })
  contactEmail!: string;

  @Prop({ required: true, type: String })
  contactPhone!: string;

  @Prop({
    required: true,
    type: String,
    enum: VENDOR_STATUS_KEYS,
    default: 'DRAFT' as VendorStatus,
    index: true,
  })
  status!: VendorStatus;

  @Prop({
    required: true,
    type: String,
    enum: VENDOR_TIER_KEYS,
    default: 'STARTER' as VendorTierKey,
    index: true,
  })
  tier!: VendorTierKey;

  @Prop({ type: Date, default: null })
  activatedAt!: Date | null;

  @Prop({ type: [CommissionOverrideSchema], default: [] })
  commissionOverride!: CommissionOverrideEntry[];

  @Prop({ type: String, default: null })
  rejectedReason!: string | null;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  onboardingState!: Record<string, unknown>;

  // ---- Audit fields injected by `baseSchemaPlugin` ----
  // Declared explicitly so the @Schema-derived TS type carries them;
  // the plugin's `.add()` is idempotent for already-defined paths.
  @Prop({ type: String, required: false })
  createdBy?: string;

  @Prop({ type: String, required: false })
  updatedBy?: string;
}

export type VendorDocument = HydratedDocument<Vendor> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const VENDOR_MODEL = 'Vendor';

export const VendorSchema = SchemaFactory.createForClass(Vendor);
VendorSchema.plugin(baseSchemaPlugin);
VendorSchema.index({ orgId: 1 }, { unique: true });
