import { STOCK_LEDGER_REASONS } from '@repo/types';

import { z } from '../zod.js';
import { IsoDateTimeSchema, UlidSchema } from '../scalars.js';
import { PageQuerySchema } from '../pagination.js';

export const StockLedgerReasonSchema = z.enum(STOCK_LEDGER_REASONS);

export const LedgerEntryRequestSchema = z.object({
  variantId: UlidSchema,
  warehouseId: UlidSchema,
  delta: z.number().int(),
  reason: StockLedgerReasonSchema,
  reasonNote: z.string().max(2000).nullable().optional(),
  relatedReservationId: UlidSchema.optional(),
  relatedTransferId: UlidSchema.optional(),
  relatedOrderId: UlidSchema.optional(),
});

export const LedgerEntryResponseSchema = z.object({
  id: UlidSchema,
  variantId: UlidSchema,
  warehouseId: UlidSchema,
  orgId: UlidSchema,
  vendorId: UlidSchema,
  delta: z.number().int(),
  reason: StockLedgerReasonSchema,
  reasonNote: z.string().nullable(),
  actorId: z.string(),
  ledgerSeq: z.number().int(),
  newOnHand: z.number().int(),
  createdAt: IsoDateTimeSchema,
});

export const LedgerListQuerySchema = PageQuerySchema.extend({
  variantId: UlidSchema.optional(),
  warehouseId: UlidSchema.optional(),
  vendorId: UlidSchema.optional(),
  reason: StockLedgerReasonSchema.optional(),
  since: IsoDateTimeSchema.optional(),
  until: IsoDateTimeSchema.optional(),
});

export type LedgerEntryRequest = z.infer<typeof LedgerEntryRequestSchema>;
export type LedgerEntryResponse = z.infer<typeof LedgerEntryResponseSchema>;
export type LedgerListQuery = z.infer<typeof LedgerListQuerySchema>;
