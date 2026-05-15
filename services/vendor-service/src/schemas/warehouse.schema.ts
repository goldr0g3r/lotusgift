import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

import { baseSchemaPlugin, namespace } from '@repo/database';
import {
  CARRIER_KEYS,
  IN_STATE_CODES,
  WAREHOUSE_OWNER_TYPES,
  WEEKDAY_KEYS,
  type CarrierKey,
  type InStateCode,
  type WarehouseOwnerType,
  type WeekdayKey,
} from '@repo/types';

/**
 * Per-warehouse Mongoose schema. Key design choices:
 *
 * - `location` is a GeoJSON Point indexed via `2dsphere` for radius
 *   queries from shipping-service (P11).
 * - `serviceZone` is a discriminated subdoc with two modes:
 *   - `pincodes`: cheap pincode-array; standard btree compound index on
 *     `[state, pincode]`.
 *   - `polygon`: GeoJSON MultiPolygon also indexed via `2dsphere` so
 *     `$geoWithin` can find candidate warehouses for a recipient point.
 * - `operatingHours` is a Mixed sub-doc (per-weekday open/close or
 *   `closed: true`) — Mixed because the discriminated-union shape isn't
 *   reasonable to model with strict Mongoose path-discriminators across
 *   7 sub-paths.
 * - `carrierCutoffs` is also Mixed for the same per-carrier-per-weekday
 *   reason.
 */

@Schema({ _id: false })
export class WarehouseAddress {
  @Prop({ required: true, type: String })
  line1!: string;

  @Prop({ type: String, default: null })
  line2!: string | null;

  @Prop({ type: String, default: null })
  landmark!: string | null;

  @Prop({ required: true, type: String })
  city!: string;

  @Prop({ required: true, type: String, enum: IN_STATE_CODES })
  state!: InStateCode;

  @Prop({ required: true, type: String })
  pincode!: string;
}

export const WarehouseAddressSchema = SchemaFactory.createForClass(WarehouseAddress);

@Schema({ _id: false })
export class WarehouseContact {
  @Prop({ required: true, type: String })
  name!: string;

  @Prop({ required: true, type: String })
  phone!: string;
}

export const WarehouseContactSchema = SchemaFactory.createForClass(WarehouseContact);

@Schema({ _id: false })
export class GeoPoint {
  @Prop({ required: true, type: String, enum: ['Point'] })
  type!: 'Point';

  @Prop({ required: true, type: [Number] })
  coordinates!: [number, number];
}

export const GeoPointSchema = SchemaFactory.createForClass(GeoPoint);

@Schema({
  collection: namespace('vendor', 'warehouses'),
  timestamps: true,
})
export class Warehouse {
  @Prop({ required: true, type: String, index: true })
  vendorId!: string;

  @Prop({ required: true, type: String, index: true })
  orgId!: string;

  @Prop({ required: true, type: String, trim: true })
  displayName!: string;

  @Prop({
    required: true,
    type: String,
    enum: WAREHOUSE_OWNER_TYPES,
    default: 'vendor' as WarehouseOwnerType,
  })
  ownerType!: WarehouseOwnerType;

  @Prop({ required: true, type: WarehouseAddressSchema })
  address!: WarehouseAddress;

  @Prop({ type: WarehouseContactSchema, default: null })
  contact!: WarehouseContact | null;

  @Prop({ type: GeoPointSchema, default: null })
  location!: GeoPoint | null;

  @Prop({
    required: true,
    type: MongooseSchema.Types.Mixed,
    default: () =>
      Object.fromEntries(WEEKDAY_KEYS.map((d) => [d, { closed: true }])) as Record<
        WeekdayKey,
        unknown
      >,
    validate: {
      validator: (v: unknown): boolean =>
        v !== null &&
        typeof v === 'object' &&
        WEEKDAY_KEYS.every((d) => Object.prototype.hasOwnProperty.call(v, d)),
      message: 'operatingHours must include entries for all 7 weekdays',
    },
  })
  operatingHours!: Record<WeekdayKey, unknown>;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: () => ({}) as Record<CarrierKey, unknown>,
    validate: {
      validator: (v: unknown): boolean =>
        v === null ||
        v === undefined ||
        (typeof v === 'object' &&
          Object.keys(v as object).every((k) => (CARRIER_KEYS as readonly string[]).includes(k))),
      message: 'carrierCutoffs may only contain known carrier keys (shiprocket|delhivery|bluedart)',
    },
  })
  carrierCutoffs!: Record<string, unknown>;

  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  serviceZone!: { mode: 'pincodes'; pincodes: string[] } | { mode: 'polygon'; polygon: unknown };

  @Prop({ required: true, type: Number, default: 24, min: 1, max: 168 })
  pickupSlaHours!: number;

  @Prop({ required: true, type: Boolean, default: true })
  enabled!: boolean;

  // Audit fields injected by `baseSchemaPlugin` (declared explicitly
  // so the @Schema-derived TS type carries them; plugin add is
  // idempotent for already-defined paths).
  @Prop({ type: String, required: false })
  createdBy?: string;

  @Prop({ type: String, required: false })
  updatedBy?: string;
}

export type WarehouseDocument = HydratedDocument<Warehouse> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const WAREHOUSE_MODEL = 'Warehouse';

export const WarehouseSchema = SchemaFactory.createForClass(Warehouse);
WarehouseSchema.plugin(baseSchemaPlugin);
WarehouseSchema.index({ location: '2dsphere' });
WarehouseSchema.index({ 'serviceZone.polygon': '2dsphere' }, { sparse: true });
WarehouseSchema.index({ 'address.state': 1, 'address.pincode': 1 });
WarehouseSchema.index({ vendorId: 1, enabled: 1 });
