import { z } from '../zod.js';
import { PaginatedSchema } from '../pagination.js';
import { PincodeIndiaSchema, PhoneIndiaE164Schema, UlidSchema } from '../scalars.js';
import {
  CarrierKeySchema,
  InStateCodeSchema,
  WarehouseOwnerTypeSchema,
  WeekdaySchema,
} from './india.js';
import { WEEKDAY_KEYS, CARRIER_KEYS } from '@repo/types';

/**
 * Per-warehouse schemas: address, operating hours, per-carrier pickup
 * cutoffs, service zone (discriminated union of pincode-list OR
 * `2dsphere`-backed GeoJSON polygon), GeoJSON Point location, and the
 * Create/Update/Response/List envelopes.
 *
 * See `docs/research/phase-6-vendor-service.md` D9 + D11 for the dual-
 * mode service-zone rationale and the per-weekday-per-carrier cutoff
 * design.
 */

/** `HH:mm` (24-hour) — used by operating-hours + carrier cutoffs. */
const HH_MM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const HhMmSchema = z.string().regex(HH_MM_REGEX, 'Expected HH:mm in 24-hour format');

/**
 * Per-weekday operating-hours entry. Either an open/close pair or a
 * `closed: true` marker (Sunday closures, holidays).
 */
export const OperatingHoursEntrySchema = z.discriminatedUnion('closed', [
  z.object({
    closed: z.literal(true),
  }),
  z.object({
    closed: z.literal(false).default(false),
    open: HhMmSchema,
    close: HhMmSchema,
  }),
]);

/**
 * Full per-weekday operating-hours block. All 7 weekdays required so
 * the warehouse picker UI doesn't have to guess defaults.
 */
export const OperatingHoursSchema = z
  .record(WeekdaySchema, OperatingHoursEntrySchema)
  .refine(
    (hours) => WEEKDAY_KEYS.every((d) => Object.prototype.hasOwnProperty.call(hours, d)),
    'Operating hours must include entries for all 7 weekdays (mon..sun)',
  );

/**
 * Per-carrier pickup-cutoff entry. `cutoffByWeekday[d] = 'HH:mm'` means
 * orders placed before that time get same-day pickup; `null` means no
 * pickup on that weekday (Sunday closures, etc.).
 */
export const CarrierCutoffEntrySchema = z.object({
  cutoffByWeekday: z
    .record(WeekdaySchema, HhMmSchema.nullable())
    .refine(
      (m) => WEEKDAY_KEYS.every((d) => Object.prototype.hasOwnProperty.call(m, d)),
      'Carrier cutoff must include entries for all 7 weekdays',
    ),
});

/**
 * Per-carrier pickup-cutoff map. Empty `{}` is allowed (warehouse opts
 * out of all carriers — useful for vendor-managed self-pickup); P11
 * shipping-service falls back to the carrier's published default in
 * that case.
 *
 * Modeled as an explicit object with every carrier key optional so we
 * can call `.default({})` without Zod treating the empty default as
 * incomplete. The runtime guard rejects unknown keys.
 */
export const CarrierCutoffsSchema = z
  .object({
    shiprocket: CarrierCutoffEntrySchema.optional(),
    delhivery: CarrierCutoffEntrySchema.optional(),
    bluedart: CarrierCutoffEntrySchema.optional(),
  })
  .refine(
    (m) => Object.keys(m).every((k) => (CARRIER_KEYS as readonly string[]).includes(k)),
    'Unknown carrier key in pickup-cutoffs',
  );

/** GeoJSON Point per `geojson.org/geojson-spec.html` — `[lng, lat]`. */
export const GeoJsonPointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z
    .tuple([
      z.number().min(-180).max(180),
      z.number().min(-90).max(90),
    ])
    .describe('[longitude, latitude] — GeoJSON order'),
});

/**
 * GeoJSON LinearRing — array of `[lng, lat]` positions, closed (first ==
 * last), ≥4 positions per RFC 7946 §3.1.6.
 */
const LinearRingSchema = z
  .array(
    z.tuple([
      z.number().min(-180).max(180),
      z.number().min(-90).max(90),
    ]),
  )
  .min(4, 'LinearRing must have ≥4 positions')
  .refine((ring) => {
    const first = ring[0];
    const last = ring[ring.length - 1];
    return first && last && first[0] === last[0] && first[1] === last[1];
  }, 'LinearRing must be closed (first and last positions identical)');

/** GeoJSON Polygon — array of LinearRings (first = exterior, rest = holes). */
const GeoJsonPolygonSchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(LinearRingSchema).min(1),
});

/** GeoJSON MultiPolygon — array of Polygon coordinate arrays. */
export const GeoJsonMultiPolygonSchema = z.object({
  type: z.literal('MultiPolygon'),
  coordinates: z.array(z.array(LinearRingSchema).min(1)).min(1),
});

/**
 * Service zone — discriminated union of:
 * - `mode: 'pincodes'` with an array of India pincodes the warehouse
 *   serves (cheap, no index needed)
 * - `mode: 'polygon'` with a `MultiPolygon` covering the service area
 *   (paired with a `2dsphere` index on the persisted field, queryable
 *   via `$geoWithin` at shipping-rate-quote time per P11)
 *
 * Per D9 in `docs/research/phase-6-vendor-service.md`.
 */
export const ServiceZoneSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('pincodes'),
    pincodes: z.array(PincodeIndiaSchema).min(1, 'At least one pincode required'),
  }),
  z.object({
    mode: z.literal('polygon'),
    polygon: GeoJsonMultiPolygonSchema,
  }),
]);

/**
 * Warehouse address. `state` uses `InStateCodeSchema` so address strings
 * always normalize to ISO 3166-2:IN codes (`IN-KA`, `IN-MH`, etc.)
 * rather than free-form names.
 */
export const WarehouseAddressSchema = z.object({
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional(),
  landmark: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2).max(80),
  state: InStateCodeSchema,
  pincode: PincodeIndiaSchema,
});

/**
 * Warehouse contact (per-warehouse phone for pickup-OTP delivery in
 * P11). Optional at warehouse-create; required when the warehouse has
 * any enabled carrier with pickup-OTP support.
 */
export const WarehouseContactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: PhoneIndiaE164Schema,
});

/**
 * Full warehouse create-request payload. Used by `POST
 * /api/vendors/:vendorId/warehouses`. The `location` field is OMITTED
 * here — the warehouse-service derives it via the OSM Nominatim geocoder
 * before persisting (see services/vendor-service warehouse.service.ts).
 */
export const WarehouseCreateRequestSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  ownerType: WarehouseOwnerTypeSchema.default('vendor'),
  address: WarehouseAddressSchema,
  contact: WarehouseContactSchema.optional(),
  operatingHours: OperatingHoursSchema,
  carrierCutoffs: CarrierCutoffsSchema.default({}),
  serviceZone: ServiceZoneSchema,
  pickupSlaHours: z.number().int().min(1).max(168).default(24),
  enabled: z.boolean().default(true),
});

/**
 * Update payload — every field optional. `address` updates re-geocode
 * (warehouse-service re-runs the Nominatim wrapper).
 */
export const WarehouseUpdateRequestSchema = WarehouseCreateRequestSchema.partial();

/**
 * Warehouse response envelope returned by the warehouse-service GETs.
 * Includes the derived `location` (GeoJSON Point) + audit fields.
 */
export const WarehouseResponseSchema = z.object({
  id: UlidSchema,
  vendorId: UlidSchema,
  orgId: UlidSchema,
  displayName: z.string(),
  ownerType: WarehouseOwnerTypeSchema,
  address: WarehouseAddressSchema,
  contact: WarehouseContactSchema.optional(),
  location: GeoJsonPointSchema.nullable(),
  operatingHours: OperatingHoursSchema,
  carrierCutoffs: CarrierCutoffsSchema,
  serviceZone: ServiceZoneSchema,
  pickupSlaHours: z.number().int(),
  enabled: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Paginated list envelope for `GET /api/vendors/:vendorId/warehouses`. */
export const WarehouseListResponseSchema = PaginatedSchema(WarehouseResponseSchema);

/**
 * Cross-service search payload used by P11 shipping-service to find
 * warehouses serving a recipient pincode or coordinate.
 */
export const WarehouseSearchQuerySchema = z.object({
  state: InStateCodeSchema.optional(),
  pincode: PincodeIndiaSchema.optional(),
  vendorId: UlidSchema.optional(),
});

export type WarehouseCreateRequest = z.infer<typeof WarehouseCreateRequestSchema>;
export type WarehouseUpdateRequest = z.infer<typeof WarehouseUpdateRequestSchema>;
export type WarehouseResponse = z.infer<typeof WarehouseResponseSchema>;
export type WarehouseListResponse = z.infer<typeof WarehouseListResponseSchema>;
export type WarehouseSearchQuery = z.infer<typeof WarehouseSearchQuerySchema>;
export type ServiceZone = z.infer<typeof ServiceZoneSchema>;
export type WarehouseAddress = z.infer<typeof WarehouseAddressSchema>;
export type OperatingHours = z.infer<typeof OperatingHoursSchema>;
export type CarrierCutoffs = z.infer<typeof CarrierCutoffsSchema>;
export type GeoJsonPoint = z.infer<typeof GeoJsonPointSchema>;
export type GeoJsonMultiPolygon = z.infer<typeof GeoJsonMultiPolygonSchema>;
