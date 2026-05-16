import { z } from '../zod.js';
import { UlidSchema } from '../scalars.js';

export const LowStockThresholdSchema = z.object({
  variantId: UlidSchema,
  warehouseId: UlidSchema,
  lowStockThreshold: z.number().int().min(0),
  reorderPoint: z.number().int().min(0).optional(),
  reorderQty: z.number().int().min(1).optional(),
});

export const DeadStockWindowSchema = z.object({
  days: z.number().int().min(30).max(90),
});

export const ReorderPointSchema = z.object({
  variantId: UlidSchema,
  warehouseId: UlidSchema,
  reorderPoint: z.number().int().min(0),
  reorderQty: z.number().int().min(1),
});

export type LowStockThreshold = z.infer<typeof LowStockThresholdSchema>;
export type DeadStockWindow = z.infer<typeof DeadStockWindowSchema>;
export type ReorderPoint = z.infer<typeof ReorderPointSchema>;
