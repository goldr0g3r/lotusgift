import { z } from '../zod.js';
import { IsoDateTimeSchema, UlidSchema } from '../scalars.js';
import { ReviewStatusSchema } from './taxonomy.js';

/**
 * Product review schemas. Buyers create reviews in `PENDING`; admins
 * moderate via approve/reject. Approved reviews surface on the public
 * PDP + factor into the product's `averageRating` (computed when the
 * moderation transition fires inside `withTransaction`).
 */

export const ReviewCreateRequestSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(2).max(100).optional(),
  comment: z.string().trim().min(10).max(2000),
});

export const ReviewResponseSchema = z.object({
  id: UlidSchema,
  productId: UlidSchema,
  buyerId: UlidSchema,
  rating: z.number().int(),
  title: z.string().nullable(),
  comment: z.string(),
  status: ReviewStatusSchema,
  moderatedBy: UlidSchema.nullable(),
  moderatedAt: IsoDateTimeSchema.nullable(),
  moderationReason: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Admin moderation decision payload. Manual `Schema.parse(raw)` on the
 * controller (no `createZodDto`) — same trade-off as the P6
 * `AdminApprovalDecisionSchema` (discriminated unions can't extend a
 * `createZodDto` base per P6 lesson #2).
 */
export const ReviewModerationDecisionRequestSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('approve'),
  }),
  z.object({
    action: z.literal('reject'),
    reason: z.string().trim().min(3).max(500),
  }),
]);

export type ReviewCreateRequest = z.infer<typeof ReviewCreateRequestSchema>;
export type ReviewResponse = z.infer<typeof ReviewResponseSchema>;
export type ReviewModerationDecisionRequest = z.infer<typeof ReviewModerationDecisionRequestSchema>;
