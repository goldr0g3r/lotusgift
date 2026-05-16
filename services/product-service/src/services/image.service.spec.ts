import { BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';

import { OUTBOX_PORT, type OutboxPort } from '@repo/utils';

import { ImageService } from './image.service.js';
import { NO_OP_ANALYTICS } from './analytics.helper.js';
import {
  ANALYTICS_TOKEN,
  ENV_TOKEN,
  R2_CLIENT_TOKEN,
} from '../product-service.tokens.js';
import { PRODUCT_IMAGE_MODEL } from '../schemas/image.schema.js';
import { PRODUCT_MODEL } from '../schemas/product.schema.js';
import type { R2ImageClient } from './r2-client.helper.js';

const fakeConnection = {
  startSession: () =>
    Promise.resolve({
      withTransaction: async (fn: () => Promise<unknown>) => fn(),
      endSession: () => Promise.resolve(),
    }),
};

describe('ImageService', () => {
  const productFindOne = jest.fn();
  const imageCreate = jest.fn();
  const r2Presign = jest.fn();
  const r2Head = jest.fn();
  const outboxPublish = jest.fn().mockResolvedValue(undefined);

  let service: ImageService;

  beforeEach(async () => {
    productFindOne.mockReset();
    imageCreate.mockReset();
    r2Presign.mockReset();
    r2Head.mockReset();
    outboxPublish.mockClear();

    const productModel = {
      findOne: () => ({ exec: () => productFindOne() }),
    };
    const imageModel = {
      create: imageCreate,
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      }),
    };
    const r2Client: R2ImageClient = {
      presignPut: r2Presign,
      head: r2Head,
    };
    const env = {
      R2_BUCKET_PRODUCT_IMAGES: 'test-bucket',
      R2_PRESIGN_EXPIRY_SECONDS: 900,
      R2_PUBLIC_BASE_URL: 'https://cdn.example.com',
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ImageService,
        { provide: getModelToken(PRODUCT_MODEL), useValue: productModel },
        { provide: getModelToken(PRODUCT_IMAGE_MODEL), useValue: imageModel },
        { provide: getConnectionToken(), useValue: fakeConnection },
        { provide: OUTBOX_PORT, useValue: { publish: outboxPublish } as unknown as OutboxPort },
        { provide: ANALYTICS_TOKEN, useValue: NO_OP_ANALYTICS },
        { provide: R2_CLIENT_TOKEN, useValue: r2Client },
        { provide: ENV_TOKEN, useValue: env },
      ],
    }).compile();
    service = moduleRef.get(ImageService);
  });

  it('issues a presigned URL for an allowed content-type', async () => {
    productFindOne.mockResolvedValue({ id: 'p1', vendorId: 'v1', orgId: 'o1' });
    r2Presign.mockResolvedValue({
      url: 'https://example.com/presigned-put',
      expiresAt: new Date(Date.now() + 900_000).toISOString(),
    });
    const result = await service.issueUploadUrl({
      productId: 'p1',
      payload: {
        contentType: 'image/jpeg',
        fileSize: 1_024_000,
        kind: 'hero',
      },
      actorId: 'u1',
    });
    expect(result.url).toBe('https://example.com/presigned-put');
    expect(result.r2Key).toMatch(/^products\/v1\/p1\/.+\.jpg$/);
    expect(r2Presign).toHaveBeenCalledTimes(1);
    const [args] = r2Presign.mock.calls[0] as [{
      bucket: string;
      contentType: string;
      contentLength: number;
    }];
    expect(args.bucket).toBe('test-bucket');
    expect(args.contentType).toBe('image/jpeg');
    expect(args.contentLength).toBe(1_024_000);
  });

  it('rejects an unsupported content-type', async () => {
    productFindOne.mockResolvedValue({ id: 'p1', vendorId: 'v1', orgId: 'o1' });
    await expect(
      service.issueUploadUrl({
        productId: 'p1',
        payload: {
          contentType: 'image/svg+xml' as never,
          fileSize: 1000,
          kind: 'hero',
        },
        actorId: 'u1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an oversized image (>5 MB)', async () => {
    productFindOne.mockResolvedValue({ id: 'p1', vendorId: 'v1', orgId: 'o1' });
    await expect(
      service.issueUploadUrl({
        productId: 'p1',
        payload: {
          contentType: 'image/jpeg',
          fileSize: 6 * 1024 * 1024,
          kind: 'hero',
        },
        actorId: 'u1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('confirmUpload writes a row + emits product.image-confirmed.v1', async () => {
    const product = {
      id: 'p1',
      orgId: 'o1',
      vendorId: 'v1',
      searchVersion: 0,
      save: jest.fn().mockResolvedValue(undefined),
    };
    productFindOne.mockResolvedValue(product);
    r2Head.mockResolvedValue({ contentType: 'image/jpeg', contentLength: 500_000 });
    imageCreate.mockResolvedValue([
      {
        id: 'img-1',
        productId: 'p1',
        r2Key: 'products/v1/p1/abc.jpg',
        kind: 'hero',
        confirmedAt: new Date(),
      },
    ]);
    const result = await service.confirmUpload({
      productId: 'p1',
      payload: {
        r2Key: 'products/v1/p1/abc.jpg' as never,
        kind: 'hero',
        sortOrder: 0,
      },
      actorId: 'u1',
    });
    expect(result.r2Key).toBe('products/v1/p1/abc.jpg');
    expect(outboxPublish).toHaveBeenCalledTimes(1);
    const [event] = outboxPublish.mock.calls[0] as [{ type: string; payload: { kind: string } }];
    expect(event.type).toBe('product.image-confirmed.v1');
    expect(event.payload.kind).toBe('hero');
  });
});
