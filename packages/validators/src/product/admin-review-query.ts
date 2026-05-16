import { z } from '../zod.js';
import { PaginatedSchema } from '../pagination.js';
import { UlidSchema } from '../scalars.js';
import { ReviewResponseSchema } from './review-row.js';
import { ReviewStatusSchema } from './taxonomy.js';

/**
 * Admin product-review moderation queue
 * (`GET /api/admin/product-reviews`). Defaults to `status=PENDING`
 * so the moderation queue surfaces unmoderated reviews first.
 */

export const AdminReviewListQuerySchema = z.object({
  status: ReviewStatusSchema.default('PENDING'),
  productId: UlidSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const AdminReviewListResponseSchema = PaginatedSchema(ReviewResponseSchema);

export type AdminReviewListQuery = z.infer<typeof AdminReviewListQuerySchema>;
export type AdminReviewListResponse = z.infer<typeof AdminReviewListResponseSchema>;
