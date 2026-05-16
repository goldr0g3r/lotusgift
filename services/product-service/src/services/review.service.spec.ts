import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';

import { OUTBOX_PORT, type OutboxPort } from '@repo/utils';

import { NO_OP_ANALYTICS } from './analytics.helper.js';
import { ReviewService } from './review.service.js';
import { ANALYTICS_TOKEN } from '../product-service.tokens.js';
import { PRODUCT_MODEL } from '../schemas/product.schema.js';
import { PRODUCT_REVIEW_MODEL } from '../schemas/review.schema.js';

const fakeConnection = {
  startSession: () =>
    Promise.resolve({
      withTransaction: async (fn: () => Promise<unknown>) => fn(),
      endSession: () => Promise.resolve(),
    }),
};

describe('ReviewService', () => {
  const reviewFindOne = jest.fn();
  const reviewCreate = jest.fn();
  const productFindOne = jest.fn();
  const outboxPublish = jest.fn().mockResolvedValue(undefined);

  let service: ReviewService;

  beforeEach(async () => {
    reviewFindOne.mockReset();
    reviewCreate.mockReset();
    productFindOne.mockReset();
    outboxPublish.mockClear();

    const reviewModel = {
      findOne: () => ({ exec: () => reviewFindOne() }),
      create: reviewCreate,
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      }),
      countDocuments: jest.fn().mockResolvedValue(0),
    };
    const productModel = {
      findOne: () => ({ exec: () => productFindOne() }),
    };
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        { provide: getModelToken(PRODUCT_REVIEW_MODEL), useValue: reviewModel },
        { provide: getModelToken(PRODUCT_MODEL), useValue: productModel },
        { provide: getConnectionToken(), useValue: fakeConnection },
        { provide: OUTBOX_PORT, useValue: { publish: outboxPublish } as unknown as OutboxPort },
        { provide: ANALYTICS_TOKEN, useValue: NO_OP_ANALYTICS },
      ],
    }).compile();
    service = moduleRef.get(ReviewService);
  });

  describe('create', () => {
    it('rejects review creation when product is not PUBLISHED', async () => {
      productFindOne.mockResolvedValue({ id: 'p1', status: 'DRAFT' });
      await expect(
        service.create({
          productId: 'p1',
          buyerId: 'b1',
          payload: { rating: 5, comment: 'A '.repeat(20) },
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects a duplicate review from the same buyer', async () => {
      productFindOne.mockResolvedValue({ id: 'p1', vendorId: 'v1', status: 'PUBLISHED' });
      reviewFindOne.mockResolvedValue({ id: 'r1' });
      await expect(
        service.create({
          productId: 'p1',
          buyerId: 'b1',
          payload: { rating: 5, comment: 'A '.repeat(20) },
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates a PENDING review when product is PUBLISHED + no duplicate', async () => {
      productFindOne.mockResolvedValue({ id: 'p1', vendorId: 'v1', status: 'PUBLISHED' });
      reviewFindOne.mockResolvedValue(null);
      reviewCreate.mockResolvedValue({ id: 'r1', status: 'PENDING' });
      const result = await service.create({
        productId: 'p1',
        buyerId: 'b1',
        payload: { rating: 5, comment: 'A '.repeat(20) },
      });
      expect(result.status).toBe('PENDING');
      expect(reviewCreate).toHaveBeenCalledTimes(1);
    });
  });

  describe('approve', () => {
    it('throws NotFoundException for missing review', async () => {
      reviewFindOne.mockResolvedValue(null);
      await expect(
        service.approve({ reviewId: 'missing', adminId: 'admin-1' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('flips status PENDING → APPROVED + emits product.review-approved.v1', async () => {
      const review = {
        id: 'r1',
        productId: 'p1',
        rating: 4,
        status: 'PENDING' as const,
        moderatedBy: null as string | null,
        moderatedAt: null as Date | null,
        moderationReason: null as string | null,
        save: jest.fn().mockResolvedValue(undefined),
      };
      reviewFindOne.mockResolvedValue(review);
      productFindOne.mockResolvedValue({
        id: 'p1',
        orgId: 'o1',
        vendorId: 'v1',
        ratingAggregate: { sum: 8, count: 2 },
        searchVersion: 1,
        save: jest.fn().mockResolvedValue(undefined),
        markModified: jest.fn(),
      });
      await service.approve({ reviewId: 'r1', adminId: 'admin-1' });
      expect(review.status).toBe('APPROVED');
      expect(review.moderatedBy).toBe('admin-1');
      expect(outboxPublish).toHaveBeenCalledTimes(1);
      const [event] = outboxPublish.mock.calls[0] as [{
        type: string;
        payload: { rating: number; approvedBy: string };
      }];
      expect(event.type).toBe('product.review-approved.v1');
      expect(event.payload.rating).toBe(4);
      expect(event.payload.approvedBy).toBe('admin-1');
    });
  });

  describe('reject', () => {
    it('flips status to REJECTED with reason + does NOT emit outbox event', async () => {
      const review = {
        id: 'r1',
        status: 'PENDING' as const,
        moderatedBy: null as string | null,
        moderatedAt: null as Date | null,
        moderationReason: null as string | null,
        save: jest.fn().mockResolvedValue(undefined),
      };
      reviewFindOne.mockResolvedValue(review);
      await service.reject({ reviewId: 'r1', adminId: 'admin-1', reason: 'spam' });
      expect(review.status).toBe('REJECTED');
      expect(review.moderationReason).toBe('spam');
      expect(outboxPublish).not.toHaveBeenCalled();
    });
  });
});
