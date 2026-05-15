import {
  IN_STATE_CODES,
  KYC_STATUS_KEYS,
  PAN_ENTITY_KINDS,
  VENDOR_STATUS_KEYS,
  VENDOR_TIER_KEYS,
  WAREHOUSE_OWNER_TYPES,
  WEEKDAY_KEYS,
  CARRIER_KEYS,
  type CarrierKey,
  type InStateCode,
  type KycStatusKey,
  type PanEntityKind,
  type VendorStatus,
  type VendorTierKey,
  type WarehouseOwnerType,
  type WeekdayKey,
} from '@repo/types';

import { z } from '../zod.js';

/**
 * Runtime Zod parsers for the India-specific enums declared in
 * `@repo/types/india`. Co-located in `@repo/validators/vendor/` so every
 * downstream service that touches vendor / warehouse / KYC data imports
 * a single source of truth.
 */

export const InStateCodeSchema = z.enum(IN_STATE_CODES) satisfies z.ZodType<InStateCode>;

export const PanEntityKindSchema = z.enum(PAN_ENTITY_KINDS) satisfies z.ZodType<PanEntityKind>;

export const VendorTierSchema = z.enum(VENDOR_TIER_KEYS) satisfies z.ZodType<VendorTierKey>;

export const VendorStatusSchema = z.enum(VENDOR_STATUS_KEYS) satisfies z.ZodType<VendorStatus>;

export const KycStatusSchema = z.enum(KYC_STATUS_KEYS) satisfies z.ZodType<KycStatusKey>;

export const WarehouseOwnerTypeSchema = z.enum(
  WAREHOUSE_OWNER_TYPES,
) satisfies z.ZodType<WarehouseOwnerType>;

export const WeekdaySchema = z.enum(WEEKDAY_KEYS) satisfies z.ZodType<WeekdayKey>;

export const CarrierKeySchema = z.enum(CARRIER_KEYS) satisfies z.ZodType<CarrierKey>;
