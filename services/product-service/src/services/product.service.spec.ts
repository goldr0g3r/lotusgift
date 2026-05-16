import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';

import { OUTBOX_PORT, STOCK_READ_PORT, type OutboxPort, type StockReadPort } from '@repo/utils';

import { NO_OP_ANALYTICS } from './analytics.helper.js';
import { ProductService } from './product.service.js';
import { ANALYTICS_TOKEN } from '../product-service.tokens.js';
import { PRODUCT_MODEL } from '../schemas/product.schema.js';

/** Stub Mongo connection — `withTransaction` invokes the callback inline. */
const fakeConnection = {
  startSession: () =>
    Promise.resolve({
      withTransaction: async (fn: () => Promise<unknown>) => fn(),
      endSession: () => Promise.resolve(),
    }),
};

describe('ProductService', () => {
  const findOne = jest.fn();
  const create = jest.fn();
  const outboxPublish = jest.fn().mockResolvedValue(undefined);
  const stockBatchGet = jest.fn().mockResolvedValue(new Map());

  let service: ProductService;

  beforeEach(async () => {
    findOne.mockReset();
    create.mockReset();
    outboxPublish.mockClear();
    stockBatchGet.mockClear();

    const fakeModel = {
      findOne: (filter: unknown) =>
        ({
          exec: () => findOne(filter),
        }) as unknown as { exec: () => Promise<unknown> },
      countDocuments: jest.fn().mockResolvedValue(0),
      create,
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      }),
    };
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: getModelToken(PRODUCT_MODEL), useValue: fakeModel },
        { provide: getConnectionToken(), useValue: fakeConnection },
        { provide: OUTBOX_PORT, useValue: { publish: outboxPublish } as unknown as OutboxPort },
        {
          provide: STOCK_READ_PORT,
          useValue: { batchGet: stockBatchGet } as unknown as StockReadPort,
        },
        { provide: ANALYTICS_TOKEN, useValue: NO_OP_ANALYTICS },
      ],
    }).compile();
    service = moduleRef.get(ProductService);
  });

  describe('getById', () => {
    it('throws NotFoundException when the product does not exist', async () => {
      findOne.mockResolvedValue(null);
      await expect(service.getById('missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns the product when it exists', async () => {
      const fake = { id: 'p1', title: 'Test' };
      findOne.mockResolvedValue(fake);
      const result = await service.getById('p1');
      expect(result.id).toBe('p1');
    });
  });

  describe('publish', () => {
    it('throws ConflictException when product has no variants', async () => {
      findOne.mockResolvedValue({
        id: 'p1',
        orgId: 'o1',
        vendorId: 'v1',
        status: 'DRAFT',
        variants: [],
        save: jest.fn(),
      });
      await expect(
        service.publish({ productId: 'p1', actorId: 'admin-1' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('flips status DRAFT → PUBLISHED + emits product.published.v1 on first publish', async () => {
      const product = {
        id: 'p1',
        orgId: 'o1',
        vendorId: 'v1',
        slug: 'test-q7hx2',
        title: 'Test Product',
        categoryL1: 'drinkware',
        categoryL2: 'mug',
        occasions: ['birthday'],
        status: 'DRAFT' as const,
        variants: [{ id: 'v1' }],
        searchVersion: 0,
        publishedAt: null as Date | null,
        unpublishedAt: null as Date | null,
        unpublishedReason: null as string | null,
        save: jest.fn().mockResolvedValue(undefined),
      };
      findOne.mockResolvedValue(product);
      await service.publish({ productId: 'p1', actorId: 'admin-1' });
      expect(product.status).toBe('PUBLISHED');
      expect(product.publishedAt).toBeInstanceOf(Date);
      expect(outboxPublish).toHaveBeenCalledTimes(1);
      const [eventArg, opts] = outboxPublish.mock.calls[0] as [
        { type: string; payload: { slug: string } },
        { session: unknown },
      ];
      expect(eventArg.type).toBe('product.published.v1');
      expect(eventArg.payload.slug).toBe('test-q7hx2');
      expect(opts.session).toBeDefined();
    });

    it('returns existing product without re-emit when already PUBLISHED (idempotent)', async () => {
      const product = {
        id: 'p1',
        status: 'PUBLISHED' as const,
        variants: [{ id: 'v1' }],
        save: jest.fn(),
      };
      findOne.mockResolvedValue(product);
      await service.publish({ productId: 'p1', actorId: 'admin-1' });
      expect(outboxPublish).not.toHaveBeenCalled();
      expect(product.save).not.toHaveBeenCalled();
    });

    it('rejects publish on an ARCHIVED product', async () => {
      findOne.mockResolvedValue({
        id: 'p1',
        status: 'ARCHIVED',
        variants: [{ id: 'v1' }],
        save: jest.fn(),
      });
      await expect(
        service.publish({ productId: 'p1', actorId: 'admin-1' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('unpublish', () => {
    it('flips PUBLISHED → UNPUBLISHED + emits product.unpublished.v1 with reason', async () => {
      const product = {
        id: 'p1',
        orgId: 'o1',
        vendorId: 'v1',
        status: 'PUBLISHED' as const,
        variants: [{ id: 'v1' }],
        searchVersion: 5,
        unpublishedAt: null as Date | null,
        unpublishedReason: null as string | null,
        save: jest.fn().mockResolvedValue(undefined),
      };
      findOne.mockResolvedValue(product);
      await service.unpublish({ productId: 'p1', reason: 'vendor-paused', actorId: 'admin-1' });
      expect(product.status).toBe('UNPUBLISHED');
      expect(product.unpublishedReason).toBe('vendor-paused');
      expect(outboxPublish).toHaveBeenCalledTimes(1);
      const [eventArg] = outboxPublish.mock.calls[0] as [{ type: string; payload: { reason: string | null } }];
      expect(eventArg.type).toBe('product.unpublished.v1');
      expect(eventArg.payload.reason).toBe('vendor-paused');
    });
  });

  describe('buildSlug', () => {
    it('produces a kebab-case slug with ULID suffix', () => {
      const id = '01HXX1AAAAAAAAAAAAAAAAAAAA';
      const slug = service.buildSlug('Corporate Tea Gift Box!', id);
      expect(slug).toMatch(/^corporate-tea-gift-box-[a-z0-9]{5}$/);
    });

    it('falls back to "product-<suffix>" when title is all-symbols', () => {
      const id = '01HXX1ZZZZZZZZZZZZZZZZZZZZ';
      const slug = service.buildSlug('!!!', id);
      expect(slug.startsWith('product-')).toBe(true);
    });
  });
});
