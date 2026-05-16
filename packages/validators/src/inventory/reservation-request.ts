import { z } from '../zod.js';
import { IsoDateTimeSchema, UlidSchema } from '../scalars.js';

export const ReservationCreateRequestSchema = z.object({
  variantId: UlidSchema,
  warehouseId: UlidSchema,
  qty: z.number().int().positive(),
  idempotencyKey: z.string().min(1).max(256),
  cartId: UlidSchema.optional(),
  actorId: z.string().min(1),
});

export const ReservationExtendRequestSchema = z.object({
  idempotencyKey: z.string().min(1).max(256).optional(),
});

export const ReservationReleaseRequestSchema = z.object({
  idempotencyKey: z.string().min(1).max(256).optional(),
});

export const ReservationResponseSchema = z.object({
  reservationId: UlidSchema,
  variantId: UlidSchema,
  warehouseId: UlidSchema,
  qty: z.number().int().positive(),
  ttlSec: z.number().int().positive(),
  extensionCount: z.number().int().min(0),
  status: z.enum(['PENDING', 'EXTENDED', 'EXPIRED', 'RELEASED', 'CONSUMED']),
  expiresAt: IsoDateTimeSchema,
  idempotencyKey: z.string(),
  cartId: UlidSchema.nullable().optional(),
});

export type ReservationCreateRequest = z.infer<typeof ReservationCreateRequestSchema>;
export type ReservationExtendRequest = z.infer<typeof ReservationExtendRequestSchema>;
export type ReservationReleaseRequest = z.infer<typeof ReservationReleaseRequestSchema>;
export type ReservationResponse = z.infer<typeof ReservationResponseSchema>;
