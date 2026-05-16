import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';

import { OUTBOX_PORT, type OutboxPort } from '@repo/utils';

import { NO_OP_ANALYTICS } from './analytics.helper.js';
import { VariantService } from './variant.service.js';
import { ANALYTICS_TOKEN } from '../product-service.tokens.js';
import { PRODUCT_MODEL } from '../schemas/product.schema.js';

const fakeConnection = {
  startSession: () =>
    Promise.resolve({
      withTransaction: async (fn: () => Promise<unknown>) => fn(),
      endSession: () => Promise.resolve(),
    }),
};

interface FakeProduct {
  id: string;
  orgId: string;
  vendorId: string;
  status: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED';
  variants: Array<{
    id: string;
    sku: string;
    attributes: Record<string, string>;
    pricePaise: number;
    weightGrams: number;
    dimensionsMm: { lengthMm: number; widthMm: number; heightMm: number };
    barcode: string | null;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
  searchVersion: number;
  save: jest.Mock;
  markModified: jest.Mock;
}

describe('VariantService', () => {
  const findOne = jest.fn();
  const outboxPublish = jest.fn().mockResolvedValue(undefined);

  let service: VariantService;

  const validPayload = {
    sku: 'TEABOX-BLACK-M',
    attributes: { color: 'Black', size: 'M' },
    pricePaise: 50_000,
    weightGrams: 500,
    dimensionsMm: { lengthMm: 200, widthMm: 100, heightMm: 80 },
    barcode: undefined as string | undefined,
    enabled: true,
  };

  const makeProduct = (overrides: Partial<FakeProduct> = {}): FakeProduct => ({
    id: 'p1',
    orgId: 'o1',
    vendorId: 'v1',
    status: 'DRAFT',
    variants: [],
    searchVersion: 0,
    save: jest.fn().mockResolvedValue(undefined),
    markModified: jest.fn(),
    ...overrides,
  });

  beforeEach(async () => {
    findOne.mockReset();
    outboxPublish.mockClear();

    const fakeModel = {
      findOne: (filter: unknown) =>
        ({
          exec: () => findOne(filter),
        }) as unknown as { exec: () => Promise<unknown> },
    };
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        VariantService,
        { provide: getModelToken(PRODUCT_MODEL), useValue: fakeModel },
        { provide: getConnectionToken(), useValue: fakeConnection },
        { provide: OUTBOX_PORT, useValue: { publish: outboxPublish } as unknown as OutboxPort },
        { provide: ANALYTICS_TOKEN, useValue: NO_OP_ANALYTICS },
      ],
    }).compile();
    service = moduleRef.get(VariantService);
  });

  it('adds a variant + emits product.variant-added.v1', async () => {
    const product = makeProduct();
    findOne.mockResolvedValue(product);
    await service.addVariant({ productId: 'p1', payload: validPayload, actorId: 'u1' });
    expect(product.variants).toHaveLength(1);
    expect(product.variants[0].sku).toBe('TEABOX-BLACK-M');
    expect(outboxPublish).toHaveBeenCalledTimes(1);
    const [eventArg] = outboxPublish.mock.calls[0] as [{ type: string; payload: { sku: string } }];
    expect(eventArg.type).toBe('product.variant-added.v1');
    expect(eventArg.payload.sku).toBe('TEABOX-BLACK-M');
  });

  it('rejects a duplicate SKU within the same product', async () => {
    const product = makeProduct({
      variants: [
        {
          id: 'existing',
          sku: 'TEABOX-BLACK-M',
          attributes: { color: 'Black', size: 'M' },
          pricePaise: 50_000,
          weightGrams: 500,
          dimensionsMm: { lengthMm: 200, widthMm: 100, heightMm: 80 },
          barcode: null,
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });
    findOne.mockResolvedValue(product);
    await expect(
      service.addVariant({ productId: 'p1', payload: validPayload, actorId: 'u1' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('enforces the 200-variant hard cap', async () => {
    const product = makeProduct({
      variants: Array.from({ length: 200 }, (_, i) => ({
        id: `existing-${i}`,
        sku: `SKU-${i}`,
        attributes: { idx: String(i) },
        pricePaise: 1,
        weightGrams: 1,
        dimensionsMm: { lengthMm: 1, widthMm: 1, heightMm: 1 },
        barcode: null,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    });
    findOne.mockResolvedValue(product);
    await expect(
      service.addVariant({
        productId: 'p1',
        payload: { ...validPayload, sku: 'UNIQUE-SKU' },
        actorId: 'u1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws NotFoundException when removing a variant that does not exist', async () => {
    findOne.mockResolvedValue(makeProduct());
    await expect(
      service.removeVariant({ productId: 'p1', variantId: 'absent', actorId: 'u1' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates a variant inside a transaction + emits product.variant-updated.v1', async () => {
    const product = makeProduct({
      variants: [
        {
          id: 'va1',
          sku: 'TEABOX-BLACK-M',
          attributes: { color: 'Black', size: 'M' },
          pricePaise: 50_000,
          weightGrams: 500,
          dimensionsMm: { lengthMm: 200, widthMm: 100, heightMm: 80 },
          barcode: null,
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });
    findOne.mockResolvedValue(product);
    await service.updateVariant({
      productId: 'p1',
      variantId: 'va1',
      patch: { pricePaise: 60_000 },
      actorId: 'u1',
    });
    expect(product.variants[0].pricePaise).toBe(60_000);
    expect(product.searchVersion).toBe(1);
    expect(outboxPublish).toHaveBeenCalledTimes(1);
    const [eventArg, opts] = outboxPublish.mock.calls[0] as [
      { type: string; payload: { sku: string; productId: string } },
      { session: unknown },
    ];
    expect(eventArg.type).toBe('product.variant-updated.v1');
    expect(eventArg.payload.sku).toBe('TEABOX-BLACK-M');
    expect(eventArg.payload.productId).toBe('p1');
    expect(opts).toHaveProperty('session');
    expect(product.save).toHaveBeenCalledWith(expect.objectContaining({ session: expect.anything() }));
  });

  it('removes a variant inside a transaction + emits product.variant-removed.v1', async () => {
    const product = makeProduct({
      status: 'DRAFT',
      variants: [
        {
          id: 'va1',
          sku: 'TEABOX-BLACK-M',
          attributes: { color: 'Black', size: 'M' },
          pricePaise: 50_000,
          weightGrams: 500,
          dimensionsMm: { lengthMm: 200, widthMm: 100, heightMm: 80 },
          barcode: null,
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'va2',
          sku: 'TEABOX-BLACK-L',
          attributes: { color: 'Black', size: 'L' },
          pricePaise: 55_000,
          weightGrams: 600,
          dimensionsMm: { lengthMm: 220, widthMm: 100, heightMm: 80 },
          barcode: null,
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });
    findOne.mockResolvedValue(product);
    await service.removeVariant({ productId: 'p1', variantId: 'va1', actorId: 'u1' });
    expect(product.variants).toHaveLength(1);
    expect(product.variants[0].id).toBe('va2');
    expect(outboxPublish).toHaveBeenCalledTimes(1);
    const [eventArg, opts] = outboxPublish.mock.calls[0] as [
      { type: string; payload: { sku: string; variantId: string } },
      { session: unknown },
    ];
    expect(eventArg.type).toBe('product.variant-removed.v1');
    expect(eventArg.payload.variantId).toBe('va1');
    expect(eventArg.payload.sku).toBe('TEABOX-BLACK-M');
    expect(opts).toHaveProperty('session');
  });
});
