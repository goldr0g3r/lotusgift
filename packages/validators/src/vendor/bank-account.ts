import { z } from '../zod.js';
import { IfscSchema } from './ifsc.js';

/**
 * India bank-account holder details. Used by the onboarding wizard's
 * BANK step + persisted in the `vendor.kyc_submissions` collection.
 *
 * Account-number length: 9–18 digits — covers the practical range of
 * Indian bank-account number formats (SBI uses 11, HDFC 14, ICICI 12,
 * etc.). Validation is regex-only here; the optional async-enrichment
 * via Razorpay's fund-account-validation API (cite #13 in the phase-6
 * research note) lands in P10 payment-service.
 */
export const BankAccountSchema = z.object({
  accountNumber: z
    .string()
    .regex(/^\d{9,18}$/, 'Account number must be 9–18 digits'),
  ifsc: IfscSchema,
  holderName: z
    .string()
    .trim()
    .min(2, 'Holder name must be at least 2 chars')
    .max(120, 'Holder name must be at most 120 chars'),
  accountType: z.enum(['savings', 'current']),
});

export type BankAccount = z.infer<typeof BankAccountSchema>;
