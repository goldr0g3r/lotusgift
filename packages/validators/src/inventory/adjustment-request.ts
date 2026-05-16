import { STOCK_LEDGER_REASONS } from '@repo/types';

import { z } from '../zod.js';
import { UlidSchema } from '../scalars.js';

const ADJUSTMENT_REASONS = [
  'ADJUSTMENT_INCREASE',
  'ADJUSTMENT_DECREASE',
  'COUNT_CORRECTION',
  'DAMAGED_OUT',
  'EXPIRED_OUT',
] as const satisfies readonly (typeof STOCK_LEDGER_REASONS)[number][];

export const AdjustmentRequestSchema = z
  .object({
    variantId: UlidSchema,
    warehouseId: UlidSchema,
    delta: z.number().int().refine((d) => d !== 0, 'delta must be non-zero'),
    reason: z.enum(ADJUSTMENT_REASONS),
    reasonNote: z.string().max(2000).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.delta < 0 && (!data.reasonNote || data.reasonNote.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reasonNote'],
        message: 'reasonNote is required for negative adjustments',
      });
    }
    if (data.delta > 0 && data.reason !== 'ADJUSTMENT_INCREASE' && data.reason !== 'COUNT_CORRECTION') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reason'],
        message: 'Positive delta requires ADJUSTMENT_INCREASE or COUNT_CORRECTION',
      });
    }
    if (data.delta < 0 && data.reason === 'ADJUSTMENT_INCREASE') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reason'],
        message: 'Negative delta cannot use ADJUSTMENT_INCREASE',
      });
    }
  });

export type AdjustmentRequest = z.infer<typeof AdjustmentRequestSchema>;
