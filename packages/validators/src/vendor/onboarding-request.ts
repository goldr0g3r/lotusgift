import { z } from '../zod.js';
import { EmailLowercaseSchema, PhoneIndiaE164Schema, R2ObjectKeySchema } from '../scalars.js';

import { BankAccountSchema } from './bank-account.js';
import { GstinWithChecksumSchema } from './gstin-checksum.js';
import { PanEntityKindSchema, VendorTierSchema } from './india.js';
import { PanSchema } from './pan.js';
import { UpiVpaSchema } from './upi-vpa.js';
import { WarehouseCreateRequestSchema } from './warehouse-row.js';

/**
 * Onboarding wizard step keys. Linear forward-only progression per D12
 * in `docs/research/phase-6-vendor-service.md`.
 */
export const OnboardingStepSchema = z.enum([
  'BASIC',
  'KYC',
  'BANK',
  'WAREHOUSES',
  'TIER',
  'SUBMITTED_FOR_REVIEW',
]);
export type OnboardingStep = z.infer<typeof OnboardingStepSchema>;

/** Step 1: vendor display + contact. */
export const VendorBasicStepSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  contactEmail: EmailLowercaseSchema,
  contactPhone: PhoneIndiaE164Schema,
});

/** Step 2: KYC artifacts (GSTIN + PAN + supporting docs in R2). */
export const KycStepSchema = z.object({
  gstin: GstinWithChecksumSchema,
  pan: PanSchema,
  entityKind: PanEntityKindSchema,
  supportingDocsR2Keys: z.array(R2ObjectKeySchema).max(10).default([]),
});

/** Step 3: bank-account + optional UPI VPA. */
export const BankStepSchema = z.object({
  bankAccount: BankAccountSchema,
  upiVpa: UpiVpaSchema.optional(),
});

/** Step 4: at least one warehouse. */
export const WarehousesStepSchema = z.object({
  warehouses: z.array(WarehouseCreateRequestSchema).min(1, 'At least one warehouse required'),
});

/** Step 5: tier selection. */
export const TierStepSchema = z.object({
  selectedTier: VendorTierSchema,
});

/**
 * Full onboarding-wizard request envelope. Controllers POST one step at
 * a time; the onboarding service validates the step body against the
 * matching schema below.
 */
export const OnboardingRequestSchema = z.discriminatedUnion('step', [
  z.object({ step: z.literal('BASIC'), payload: VendorBasicStepSchema }),
  z.object({ step: z.literal('KYC'), payload: KycStepSchema }),
  z.object({ step: z.literal('BANK'), payload: BankStepSchema }),
  z.object({ step: z.literal('WAREHOUSES'), payload: WarehousesStepSchema }),
  z.object({ step: z.literal('TIER'), payload: TierStepSchema }),
  z.object({ step: z.literal('SUBMITTED_FOR_REVIEW'), payload: z.object({}) }),
]);

/** Per-step status returned by `GET /api/vendors/onboarding/status`. */
export const OnboardingStatusResponseSchema = z.object({
  currentStep: OnboardingStepSchema,
  completedSteps: z.array(OnboardingStepSchema),
  percentComplete: z.number().int().min(0).max(100),
  vendorId: z.string().optional(),
});

export type VendorBasicStep = z.infer<typeof VendorBasicStepSchema>;
export type KycStep = z.infer<typeof KycStepSchema>;
export type BankStep = z.infer<typeof BankStepSchema>;
export type WarehousesStep = z.infer<typeof WarehousesStepSchema>;
export type TierStep = z.infer<typeof TierStepSchema>;
export type OnboardingRequest = z.infer<typeof OnboardingRequestSchema>;
export type OnboardingStatusResponse = z.infer<typeof OnboardingStatusResponseSchema>;
