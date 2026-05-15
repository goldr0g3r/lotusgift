import { z } from '../zod.js';
import { InrPaiseSchema, IsoDateTimeSchema, UlidSchema } from '../scalars.js';
import { PaginatedSchema } from '../pagination.js';

/**
 * Vendor payout ledger row — READ-ONLY at MVP. The writer (P10
 * payment-service) populates these rows after settling Razorpay
 * captures. P6 surfaces the schema + the GET endpoints so the
 * web-vendor app can render the payouts table on day one of vendor
 * onboarding (showing an empty list until P10 ships).
 */
export const PayoutStatusSchema = z.enum([
  'pending',
  'processing',
  'paid',
  'failed',
  'reversed',
]);

export const PayoutRowSchema = z.object({
  id: UlidSchema,
  vendorId: UlidSchema,
  periodStart: IsoDateTimeSchema,
  periodEnd: IsoDateTimeSchema,
  grossPaise: InrPaiseSchema,
  commissionPaise: InrPaiseSchema,
  netPaise: InrPaiseSchema,
  status: PayoutStatusSchema,
  razorpayPayoutId: z.string().optional(),
  createdAt: IsoDateTimeSchema,
});

export const PayoutListResponseSchema = PaginatedSchema(PayoutRowSchema);

export const PayoutCurrentPeriodResponseSchema = z.object({
  vendorId: UlidSchema,
  periodStart: IsoDateTimeSchema,
  periodEnd: IsoDateTimeSchema,
  estimatedGrossPaise: InrPaiseSchema,
  estimatedCommissionPaise: InrPaiseSchema,
  estimatedNetPaise: InrPaiseSchema,
});

export type PayoutRow = z.infer<typeof PayoutRowSchema>;
export type PayoutListResponse = z.infer<typeof PayoutListResponseSchema>;
export type PayoutCurrentPeriodResponse = z.infer<typeof PayoutCurrentPeriodResponseSchema>;
export type PayoutStatus = z.infer<typeof PayoutStatusSchema>;
