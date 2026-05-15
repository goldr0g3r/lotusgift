import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { baseSchemaPlugin, namespace } from '@repo/database';
import {
  KYC_STATUS_KEYS,
  PAN_ENTITY_KINDS,
  type KycStatusKey,
  type PanEntityKind,
} from '@repo/types';

import { BankSnapshot, BankSnapshotSchema } from './shared/bank-snapshot.js';

/**
 * Append-only KYC-submission ledger. One row per completed KYC wizard
 * step; admin approval/rejection updates `status` + `reviewerId` +
 * `reviewedAt` + `decisionNotes` in place but does NOT delete the row.
 *
 * `bankSnapshot` is denormalized at submission time so a later vendor
 * bank-account update doesn't lose the historical context that the
 * admin reviewed.
 *
 * Field-level Mongo encryption for `gstin` + `pan` + `bankSnapshot` is
 * parked to P21 per D3 in the research note; MVP relies on
 * `@repo/utils.redact` at log boundaries to keep the values out of
 * structured logs.
 */
@Schema({
  collection: namespace('vendor', 'kyc_submissions'),
  timestamps: true,
})
export class KycSubmission {
  @Prop({ required: true, type: String, index: true })
  vendorId!: string;

  @Prop({ required: true, type: String, index: true })
  orgId!: string;

  @Prop({ required: true, type: String, uppercase: true })
  gstin!: string;

  @Prop({ required: true, type: String, uppercase: true })
  pan!: string;

  @Prop({ required: true, type: String, enum: PAN_ENTITY_KINDS })
  entityKind!: PanEntityKind;

  @Prop({ required: true, type: BankSnapshotSchema })
  bankSnapshot!: BankSnapshot;

  @Prop({ type: [String], default: [] })
  supportingDocsR2Keys!: string[];

  @Prop({
    required: true,
    type: String,
    enum: KYC_STATUS_KEYS,
    default: 'PENDING' as KycStatusKey,
    index: true,
  })
  status!: KycStatusKey;

  @Prop({ type: String, default: null })
  reviewerId!: string | null;

  @Prop({ type: Date, default: null })
  reviewedAt!: Date | null;

  @Prop({ type: String, default: null })
  decisionNotes!: string | null;
}

export type KycSubmissionDocument = HydratedDocument<KycSubmission> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const KYC_SUBMISSION_MODEL = 'KycSubmission';

export const KycSubmissionSchema = SchemaFactory.createForClass(KycSubmission);
KycSubmissionSchema.plugin(baseSchemaPlugin);
KycSubmissionSchema.index({ vendorId: 1, createdAt: -1 });
