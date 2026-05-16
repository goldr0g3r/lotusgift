import type { ReviewResponse } from '@repo/validators';

import type { ProductReviewDocument } from '../../schemas/review.schema.js';

export function mapReviewToResponse(doc: ProductReviewDocument): ReviewResponse {
  return {
    id: doc.id as ReviewResponse['id'],
    productId: doc.productId as ReviewResponse['productId'],
    buyerId: doc.buyerId as ReviewResponse['buyerId'],
    rating: doc.rating,
    title: doc.title,
    comment: doc.comment,
    status: doc.status,
    moderatedBy: (doc.moderatedBy ?? null) as ReviewResponse['moderatedBy'],
    moderatedAt: (doc.moderatedAt
      ? (doc.moderatedAt.toISOString() as ReviewResponse['moderatedAt'])
      : null) as ReviewResponse['moderatedAt'],
    moderationReason: doc.moderationReason,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
