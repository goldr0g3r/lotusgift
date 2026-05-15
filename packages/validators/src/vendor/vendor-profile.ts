import { z } from '../zod.js';
import { EmailLowercaseSchema, IsoDateTimeSchema, PhoneIndiaE164Schema, UlidSchema } from '../scalars.js';

import { VendorStatusSchema, VendorTierSchema } from './india.js';

/**
 * Vendor profile response envelope. Used by `GET /api/vendors/:id` +
 * `GET /api/vendors` (admin list).
 */
export const VendorProfileResponseSchema = z.object({
  id: UlidSchema,
  orgId: UlidSchema,
  displayName: z.string(),
  contactEmail: EmailLowercaseSchema,
  contactPhone: PhoneIndiaE164Schema,
  status: VendorStatusSchema,
  tier: VendorTierSchema,
  activatedAt: IsoDateTimeSchema.nullable(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const VendorListQuerySchema = z.object({
  status: VendorStatusSchema.optional(),
  tier: VendorTierSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const AdminApprovalDecisionSchema = z.discriminatedUnion('decision', [
  z.object({
    decision: z.literal('approve'),
    notes: z.string().trim().max(2000).optional(),
  }),
  z.object({
    decision: z.literal('reject'),
    reason: z.string().trim().min(5).max(2000),
  }),
]);

export type VendorProfileResponse = z.infer<typeof VendorProfileResponseSchema>;
export type VendorListQuery = z.infer<typeof VendorListQuerySchema>;
export type AdminApprovalDecision = z.infer<typeof AdminApprovalDecisionSchema>;
