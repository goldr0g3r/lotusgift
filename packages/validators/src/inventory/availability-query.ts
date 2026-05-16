import { z } from '../zod.js';
import { IsoDateTimeSchema, UlidSchema } from '../scalars.js';

/** Mirrors `StockReadPort.batchGet` aggregate shape for HTTP + port tests. */
export const AvailabilityQuerySchema = z.object({
  variantIds: z.array(UlidSchema).min(1).max(200),
});

export const AvailabilityStockEntrySchema = z.object({
  available: z.number().int().min(0),
  reserved: z.number().int().min(0),
  updatedAt: IsoDateTimeSchema,
});

export const AvailabilityResponseSchema = z.record(
  UlidSchema,
  AvailabilityStockEntrySchema,
);

export type AvailabilityQuery = z.infer<typeof AvailabilityQuerySchema>;
export type AvailabilityResponse = z.infer<typeof AvailabilityResponseSchema>;
