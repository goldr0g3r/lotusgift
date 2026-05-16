import { z } from '../zod.js';
import { IsoDateTimeSchema, UlidSchema } from '../scalars.js';

export const StockSnapshotSchema = z.object({
  variantId: UlidSchema,
  warehouseId: UlidSchema,
  orgId: UlidSchema,
  vendorId: UlidSchema,
  onHand: z.number().int().min(0),
  reservedCount: z.number().int().min(0),
  available: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0),
  reorderPoint: z.number().int().min(0),
  reorderQty: z.number().int().min(0),
  pendingLedgerCount: z.number().int().min(0),
  lastMovementAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const BatchAvailabilityQuerySchema = z.object({
  variantIds: z.array(UlidSchema).min(1).max(200),
});

export const BatchAvailabilityResponseSchema = z.record(
  UlidSchema,
  z.array(StockSnapshotSchema),
);

export type StockSnapshot = z.infer<typeof StockSnapshotSchema>;
export type BatchAvailabilityQuery = z.infer<typeof BatchAvailabilityQuerySchema>;
export type BatchAvailabilityResponse = z.infer<typeof BatchAvailabilityResponseSchema>;
