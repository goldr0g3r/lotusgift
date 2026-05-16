import { IsoDateTimeSchema, UlidSchema, z } from '@repo/validators';

import { defineEvent } from '../builders.js';

/**
 * Published by `services/product-service` when an admin approves a
 * pending product review. Consumers:
 *
 * - P12 notification-service notifies the buyer their review is live
 *   and notifies the vendor of the new public review.
 * - P15 insights-service factors approved reviews into vendor
 *   sentiment / dead-stock detection signals.
 * - Analytics emits `product review approved` downstream.
 *
 * `vendorId` is included so consumer services that fan out per-vendor
 * (insights, notifications) don't have to re-query the product doc.
 */
export const VendorProductReviewApprovedV1 = defineEvent(
  'product.review-approved.v1',
  z.object({
    orgId: UlidSchema,
    vendorId: UlidSchema,
    productId: UlidSchema,
    reviewId: UlidSchema,
    rating: z.number().int().min(1).max(5),
    approvedBy: UlidSchema,
    approvedAt: IsoDateTimeSchema,
  }),
);

export type VendorProductReviewApprovedV1Payload = z.infer<
  typeof VendorProductReviewApprovedV1.schema
>['payload'];
