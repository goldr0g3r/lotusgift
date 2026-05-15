import { z } from '../zod.js';
import { IsoDateSchema, UlidSchema } from '../scalars.js';

/**
 * Per-warehouse-per-day SLA rollup row — READ-ONLY at MVP. The writer
 * (P21 observability cron) populates these rows from shipping events.
 * P6 surfaces the schema + GET endpoints; web-vendor (P17) renders a
 * "Coming P21" UX hint until the real data flows.
 */
export const WarehouseSlaScoreRowSchema = z.object({
  id: UlidSchema,
  warehouseId: UlidSchema,
  vendorId: UlidSchema,
  date: IsoDateSchema,
  ordersPickedOnTime: z.number().int().nonnegative(),
  ordersPickedLate: z.number().int().nonnegative(),
  sla7DayAvgPct: z.number().min(0).max(100).nullable(),
});

export const WarehouseSlaScoreResponseSchema = z.object({
  warehouseId: UlidSchema,
  windowDays: z.number().int().min(1).max(90),
  rows: z.array(WarehouseSlaScoreRowSchema),
});

export type WarehouseSlaScoreRow = z.infer<typeof WarehouseSlaScoreRowSchema>;
export type WarehouseSlaScoreResponse = z.infer<typeof WarehouseSlaScoreResponseSchema>;
