import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';

import { OUTBOX_PORT, ulid, type OutboxPort } from '@repo/utils';
import { withTransaction } from '@repo/database';
import { VendorProductReviewApprovedV1 } from '@repo/events';
import type { ServerAnalytics } from '@repo/analytics-sdk';
import type { ReviewCreateRequest } from '@repo/validators';

import { PRODUCT_MODEL, type ProductDocument } from '../schemas/product.schema.js';
import {
  PRODUCT_REVIEW_MODEL,
  type ProductReviewDocument,
} from '../schemas/review.schema.js';
import { ANALYTICS_TOKEN } from '../product-service.tokens.js';

interface CreateReviewArgs {
  productId: string;
  buyerId: string;
  payload: ReviewCreateRequest;
}

interface ListReviewsArgs {
  productId: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  page: number;
  limit: number;
}

interface ApproveReviewArgs {
  reviewId: string;
  adminId: string;
}

interface RejectReviewArgs {
  reviewId: string;
  adminId: string;
  reason: string;
}

/**
 * Product review service. Buyers create reviews in PENDING; admins
 * moderate. Approving a review recomputes the product's rating
 * aggregate (`{ sum, count, average }`) inside the same transaction
 * + emits `product.review-approved.v1`.
 */
@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(PRODUCT_REVIEW_MODEL)
    private readonly reviewModel: Model<ProductReviewDocument>,
    @InjectModel(PRODUCT_MODEL) private readonly productModel: Model<ProductDocument>,
    @InjectConnection() private readonly connection: Connection,
    @Inject(OUTBOX_PORT) private readonly outbox: OutboxPort,
    @Inject(ANALYTICS_TOKEN) private readonly analytics: ServerAnalytics,
  ) {}

  async create(args: CreateReviewArgs): Promise<ProductReviewDocument> {
    const product = await this.productModel.findOne({ id: args.productId }).exec();
    if (!product) {
      throw new NotFoundException({
        message: `Product ${args.productId} not found`,
        code: 'RESOURCE_NOT_FOUND',
      });
    }
    if (product.status !== 'PUBLISHED') {
      throw new ForbiddenException({
        message: 'Reviews can only be created on PUBLISHED products',
        code: 'PRODUCT_NOT_PUBLISHED',
      });
    }
    const existing = await this.reviewModel
      .findOne({ buyerId: args.buyerId, productId: args.productId })
      .exec();
    if (existing) {
      throw new ConflictException({
        message: 'You have already reviewed this product',
        code: 'REVIEW_ALREADY_EXISTS',
      });
    }

    const id = ulid();
    const review = await this.reviewModel.create({
      id,
      productId: args.productId,
      vendorId: product.vendorId,
      buyerId: args.buyerId,
      rating: args.payload.rating,
      title: args.payload.title ?? null,
      comment: args.payload.comment,
      status: 'PENDING',
      moderatedBy: null,
      moderatedAt: null,
      moderationReason: null,
      createdBy: args.buyerId,
      updatedBy: args.buyerId,
    });

    return review;
  }

  async listPublicForProduct(args: ListReviewsArgs): Promise<{
    items: ProductReviewDocument[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const filter: Record<string, unknown> = { productId: args.productId, status: 'APPROVED' };
    const [items, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((args.page - 1) * args.limit)
        .limit(args.limit)
        .exec(),
      this.reviewModel.countDocuments(filter),
    ]);
    return {
      items,
      pagination: {
        page: args.page,
        limit: args.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / args.limit)),
      },
    };
  }

  async listForAdmin(args: {
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    productId?: string;
    page: number;
    limit: number;
  }): Promise<{
    items: ProductReviewDocument[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const filter: Record<string, unknown> = { status: args.status };
    if (args.productId) filter.productId = args.productId;
    const [items, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((args.page - 1) * args.limit)
        .limit(args.limit)
        .exec(),
      this.reviewModel.countDocuments(filter),
    ]);
    return {
      items,
      pagination: {
        page: args.page,
        limit: args.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / args.limit)),
      },
    };
  }

  async approve(args: ApproveReviewArgs): Promise<ProductReviewDocument> {
    const review = await this.loadReview(args.reviewId);
    if (review.status === 'APPROVED') return review;

    const product = await this.productModel.findOne({ id: review.productId }).exec();
    if (!product) {
      throw new NotFoundException({
        message: `Product ${review.productId} not found for review ${args.reviewId}`,
        code: 'RESOURCE_NOT_FOUND',
      });
    }

    const approvedAt = new Date();
    await withTransaction(this.connection, async (session) => {
      review.status = 'APPROVED';
      review.moderatedBy = args.adminId;
      review.moderatedAt = approvedAt;
      review.moderationReason = null;
      review.updatedBy = args.adminId;
      await review.save({ session });

      // Recompute aggregate inside the same tx. We only sum APPROVED
      // reviews; the previous status was non-APPROVED so we increment.
      const sum = (product.ratingAggregate?.sum ?? 0) + review.rating;
      const count = (product.ratingAggregate?.count ?? 0) + 1;
      product.ratingAggregate = { sum, count };
      product.searchVersion = (product.searchVersion ?? 0) + 1;
      product.updatedBy = args.adminId;
      product.markModified('ratingAggregate');
      await product.save({ session });

      await this.outbox.publish(
        {
          type: VendorProductReviewApprovedV1.name,
          idempotencyKey: `product:${review.productId}:review-approved:${review.id}`,
          payload: {
            orgId: product.orgId,
            vendorId: product.vendorId,
            productId: review.productId,
            reviewId: review.id,
            rating: review.rating,
            approvedBy: args.adminId,
            approvedAt: approvedAt.toISOString(),
          },
        },
        { session },
      );
    });

    this.analytics.capture({
      distinctId: args.adminId,
      event: 'product review approved',
      properties: {
        product_id: review.productId,
        review_id: review.id,
        vendor_id: product.vendorId,
        org_id: product.orgId,
        rating: review.rating,
      },
    });

    return review;
  }

  async reject(args: RejectReviewArgs): Promise<ProductReviewDocument> {
    const review = await this.loadReview(args.reviewId);
    if (review.status === 'REJECTED') return review;
    review.status = 'REJECTED';
    review.moderatedBy = args.adminId;
    review.moderatedAt = new Date();
    review.moderationReason = args.reason;
    review.updatedBy = args.adminId;
    await review.save();
    return review;
  }

  private async loadReview(reviewId: string): Promise<ProductReviewDocument> {
    const review = await this.reviewModel.findOne({ id: reviewId }).exec();
    if (!review) {
      throw new NotFoundException({
        message: `Review ${reviewId} not found`,
        code: 'RESOURCE_NOT_FOUND',
      });
    }
    return review;
  }
}
