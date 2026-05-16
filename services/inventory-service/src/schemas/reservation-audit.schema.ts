import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { baseSchemaPlugin, namespace } from '@repo/database';
import { RESERVATION_STATUS_KEYS, type ReservationStatusKey } from '@repo/types';

export const RESERVATION_AUDIT_MODEL = 'InventoryReservationAudit';

@Schema({
  collection: namespace('inventory', 'reservation_audit'),
  timestamps: true,
})
export class ReservationAuditEntry {
  @Prop({ required: true, type: String })
  orgId!: string;

  @Prop({ required: true, type: String })
  vendorId!: string;

  @Prop({ required: true, type: String })
  warehouseId!: string;

  @Prop({ required: true, type: String })
  variantId!: string;

  @Prop({ required: true, type: String })
  reservationId!: string;

  @Prop({ required: true, type: Number })
  qty!: number;

  @Prop({ required: true, type: String, enum: RESERVATION_STATUS_KEYS })
  status!: ReservationStatusKey;

  @Prop({ required: true, type: Date })
  ttlExpiresAt!: Date;

  @Prop({ type: String, default: null })
  cartId!: string | null;

  @Prop({ required: true, type: String })
  idempotencyKey!: string;
}

export type ReservationAuditDocument = HydratedDocument<ReservationAuditEntry>;

export const ReservationAuditSchema = SchemaFactory.createForClass(ReservationAuditEntry);
ReservationAuditSchema.plugin(baseSchemaPlugin);
ReservationAuditSchema.index({ reservationId: 1 });
ReservationAuditSchema.index({ idempotencyKey: 1, variantId: 1, warehouseId: 1 });
