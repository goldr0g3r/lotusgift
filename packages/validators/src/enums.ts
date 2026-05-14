import { z } from './zod.js';

/**
 * Runtime parsers for the enums declared in `@repo/types/enums`. The
 * `z.enum()` values are the single source of truth for valid string
 * literals; the `@repo/types` enums are derived via `z.infer`.
 */

export const OrgKindSchema = z.enum(['vendor-org', 'corporate-buyer-org', 'internal-staff-org']);

export const UserRoleSchema = z.enum([
  'owner',
  'admin',
  'member',
  'warehouse-manager',
  'inventory-manager',
  'finance',
  'customer-service',
]);

export const OrderStatusSchema = z.enum([
  'draft',
  'placed',
  'partially_fulfilled',
  'fulfilled',
  'cancelled',
  'refunded',
]);

export const ShipmentStatusSchema = z.enum([
  'pending',
  'picked',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'rto_in_transit',
  'rto_delivered',
  'cancelled',
]);

export const PaymentStatusSchema = z.enum([
  'pending',
  'authorized',
  'captured',
  'failed',
  'refunded',
  'partially_refunded',
]);

export const RfqStatusSchema = z.enum([
  'draft',
  'sent',
  'negotiating',
  'accepted',
  'rejected',
  'expired',
]);

export const CustomizationStatusSchema = z.enum([
  'draft',
  'art_uploaded',
  'mockup_pending',
  'mockup_delivered',
  'approved',
  'rejected',
  'in_production',
]);

export const RecipientListUploadStatusSchema = z.enum([
  'pending',
  'validating',
  'validated',
  'rejected',
  'order_created',
  'order_failed',
]);
