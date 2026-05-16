import { Test, type TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';

import {
  OUTBOX_PORT,
  type OutboxEventHandler,
  type OutboxPort,
  type Subscription,
} from '@repo/utils';

import { AtlasSearchSyncService } from './atlas-search-sync.service.js';
import { PRODUCT_MODEL } from '../schemas/product.schema.js';
import { PRODUCT_SEARCH_INDEX_MODEL } from '../schemas/search-index.schema.js';

describe('AtlasSearchSyncService', () => {
  const productFindOne = jest.fn();
  const indexFindOneAndUpdate = jest.fn().mockResolvedValue({ id: 'idx1' });
  const indexDeleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });
  const handlerRegistry = new Map<string, OutboxEventHandler>();
  const unsubscribe = jest.fn();
  const outbox: OutboxPort = {
    publish: jest.fn().mockResolvedValue(undefined),
    subscribe: (eventType: string, handler: OutboxEventHandler): Subscription => {
      handlerRegistry.set(eventType, handler);
      return { unsubscribe };
    },
    start: jest.fn(),
    stop: jest.fn().mockResolvedValue(undefined),
  };

  let service: AtlasSearchSyncService;

  beforeEach(async () => {
    productFindOne.mockReset();
    indexFindOneAndUpdate.mockClear();
    indexDeleteOne.mockClear();
    handlerRegistry.clear();
    unsubscribe.mockReset();

    const productModel = {
      findOne: () => ({ exec: () => productFindOne() }),
      find: jest.fn().mockReturnValue({
        cursor: () => ({
          async *[Symbol.asyncIterator]() {
            yield {
              id: 'p1',
              vendorId: 'v1',
              orgId: 'o1',
              title: 'Black Mug',
              slug: 'black-mug-q7hx2',
              descriptionMd: '# A nice _mug_',
              status: 'PUBLISHED',
              categoryL1: 'drinkware',
              categoryL2: 'mug',
              occasions: ['birthday'],
              recipientTypes: ['employee'],
              customizable: false,
              moq: 1,
              leadTimeDays: 0,
              basePricePaise: 50_000,
              variants: [{ id: 'va1', pricePaise: 50_000 }],
              ratingAggregate: { sum: 0, count: 0 },
              searchVersion: 1,
            };
          },
        }),
      }),
    };
    const indexModel = {
      findOneAndUpdate: indexFindOneAndUpdate,
      deleteOne: () => ({ exec: () => indexDeleteOne() }),
    };
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AtlasSearchSyncService,
        { provide: getModelToken(PRODUCT_MODEL), useValue: productModel },
        { provide: getModelToken(PRODUCT_SEARCH_INDEX_MODEL), useValue: indexModel },
        { provide: OUTBOX_PORT, useValue: outbox },
      ],
    }).compile();
    service = moduleRef.get(AtlasSearchSyncService);
    service.onApplicationBootstrap();
  });

  afterEach(async () => {
    await service.onApplicationShutdown();
  });

  it('subscribes to 4 outbox event types at bootstrap', () => {
    expect(handlerRegistry.has('product.published.v1')).toBe(true);
    expect(handlerRegistry.has('product.unpublished.v1')).toBe(true);
    expect(handlerRegistry.has('product.variant-added.v1')).toBe(true);
    expect(handlerRegistry.has('product.image-confirmed.v1')).toBe(true);
  });

  it('upserts the snapshot row on product.published.v1', async () => {
    productFindOne.mockResolvedValue({
      id: 'p1',
      vendorId: 'v1',
      orgId: 'o1',
      title: 'Black Mug',
      slug: 'black-mug-q7hx2',
      descriptionMd: 'A nice mug',
      status: 'PUBLISHED',
      categoryL1: 'drinkware',
      categoryL2: 'mug',
      occasions: ['birthday'],
      recipientTypes: ['employee'],
      customizable: false,
      moq: 1,
      leadTimeDays: 0,
      basePricePaise: 50_000,
      variants: [{ id: 'va1', pricePaise: 50_000 }],
      ratingAggregate: { sum: 0, count: 0 },
      searchVersion: 1,
    });
    const handler = handlerRegistry.get('product.published.v1');
    expect(handler).toBeDefined();
    await handler!({
      type: 'product.published.v1',
      payload: { productId: 'p1' },
      idempotencyKey: 'key',
      eventId: 'e1',
      occurredAt: new Date().toISOString(),
    });
    expect(indexFindOneAndUpdate).toHaveBeenCalledTimes(1);
    const [filter, update, options] = indexFindOneAndUpdate.mock.calls[0] as [
      { productId: string },
      { $set: { title: string } },
      { upsert: boolean },
    ];
    expect(filter.productId).toBe('p1');
    expect(update.$set.title).toBe('Black Mug');
    expect(options.upsert).toBe(true);
  });

  it('deletes the snapshot row on product.unpublished.v1', async () => {
    const handler = handlerRegistry.get('product.unpublished.v1');
    expect(handler).toBeDefined();
    await handler!({
      type: 'product.unpublished.v1',
      payload: { productId: 'p1' },
      idempotencyKey: 'key',
      eventId: 'e2',
      occurredAt: new Date().toISOString(),
    });
    expect(indexDeleteOne).toHaveBeenCalledTimes(1);
  });

  it('bulkSync iterates every PUBLISHED product + upserts', async () => {
    const result = await service.bulkSync();
    expect(result.rebuiltCount).toBe(1);
    expect(indexFindOneAndUpdate).toHaveBeenCalledTimes(1);
  });
});
