import { z } from '../zod.js';
import { UlidSchema } from '../scalars.js';

export const TransferRequestSchema = z.object({
  fromWarehouseId: UlidSchema,
  toWarehouseId: UlidSchema,
  variantId: UlidSchema,
  qty: z.number().int().positive(),
  reasonNote: z.string().min(1).max(2000),
});

export const TransferListQuerySchema = z.object({
  vendorId: UlidSchema.optional(),
  fromWarehouseId: UlidSchema.optional(),
  toWarehouseId: UlidSchema.optional(),
  status: z.enum(['PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED']).optional(),
});

export const TransferResponseSchema = z.object({
  transferId: UlidSchema,
  fromWarehouseId: UlidSchema,
  toWarehouseId: UlidSchema,
  variantId: UlidSchema,
  qty: z.number().int().positive(),
  status: z.enum(['PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED']),
  reasonNote: z.string(),
});

export type TransferRequest = z.infer<typeof TransferRequestSchema>;
export type TransferListQuery = z.infer<typeof TransferListQuerySchema>;
export type TransferResponse = z.infer<typeof TransferResponseSchema>;
