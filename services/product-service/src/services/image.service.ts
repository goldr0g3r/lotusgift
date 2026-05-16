import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';

import { OUTBOX_PORT, ulid, type OutboxPort } from '@repo/utils';
import { withTransaction } from '@repo/database';
import { VendorProductImageConfirmedV1 } from '@repo/events';
import type { ServerAnalytics } from '@repo/analytics-sdk';
import type { Env } from '@repo/config';
import type {
  ImageConfirmRequest,
  ImageUploadUrlRequest,
  ImageUploadUrlResponse,
} from '@repo/validators';
import type { ImageKind } from '@repo/types';

import { PRODUCT_MODEL, type ProductDocument } from '../schemas/product.schema.js';
import {
  PRODUCT_IMAGE_MODEL,
  type ProductImageDocument,
} from '../schemas/image.schema.js';
import {
  ANALYTICS_TOKEN,
  ENV_TOKEN,
  R2_CLIENT_TOKEN,
} from '../product-service.tokens.js';
import type { R2ImageClient } from './r2-client.helper.js';

const ALLOWED_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_BYTES = 5 * 1024 * 1024;

interface IssueUploadUrlArgs {
  productId: string;
  payload: ImageUploadUrlRequest;
  actorId: string;
}

interface ConfirmUploadArgs {
  productId: string;
  payload: ImageConfirmRequest;
  actorId: string;
}

/**
 * Two-step R2 image upload per D2:
 *
 *   1. `issueUploadUrl` returns a 15-min presigned PUT URL with
 *      content-type + content-length bound as signed headers.
 *   2. Client PUTs the file bytes directly to R2.
 *   3. `confirmUpload` HEADs the object to verify content-type +
 *      content-length match the presign constraints, then writes the
 *      `product.product_images` row + emits
 *      `product.image-confirmed.v1` inside `withTransaction`.
 */
@Injectable()
export class ImageService {
  constructor(
    @InjectModel(PRODUCT_MODEL) private readonly productModel: Model<ProductDocument>,
    @InjectModel(PRODUCT_IMAGE_MODEL)
    private readonly imageModel: Model<ProductImageDocument>,
    @InjectConnection() private readonly connection: Connection,
    @Inject(OUTBOX_PORT) private readonly outbox: OutboxPort,
    @Inject(ANALYTICS_TOKEN) private readonly analytics: ServerAnalytics,
    @Inject(R2_CLIENT_TOKEN) private readonly r2: R2ImageClient,
    @Inject(ENV_TOKEN) private readonly env: Env,
  ) {}

  async issueUploadUrl(args: IssueUploadUrlArgs): Promise<ImageUploadUrlResponse> {
    if (!ALLOWED_CONTENT_TYPES.has(args.payload.contentType)) {
      throw new BadRequestException({
        message: `Content-type '${args.payload.contentType}' not allowed. Use image/jpeg, image/png, or image/webp.`,
        code: 'IMAGE_CONTENT_TYPE_REJECTED',
        contentType: args.payload.contentType,
      });
    }
    if (args.payload.fileSize > MAX_FILE_BYTES) {
      throw new BadRequestException({
        message: `File size ${args.payload.fileSize} exceeds max ${MAX_FILE_BYTES} bytes (5 MB)`,
        code: 'IMAGE_TOO_LARGE',
        fileSize: args.payload.fileSize,
        max: MAX_FILE_BYTES,
      });
    }
    const product = await this.loadProduct(args.productId);
    const bucket = this.requireBucket();
    const expiresInSeconds = this.requirePresignExpiry();

    const extension = this.extensionForContentType(args.payload.contentType);
    const r2Key = `products/${product.vendorId}/${product.id}/${ulid()}.${extension}`;

    const { url, expiresAt } = await this.r2.presignPut({
      bucket,
      key: r2Key,
      contentType: args.payload.contentType,
      contentLength: args.payload.fileSize,
      expiresInSeconds,
    });

    return {
      url: url as ImageUploadUrlResponse['url'],
      r2Key: r2Key as ImageUploadUrlResponse['r2Key'],
      expiresAt: expiresAt as ImageUploadUrlResponse['expiresAt'],
      contentType: args.payload.contentType,
      maxFileSize: MAX_FILE_BYTES,
    };
  }

  async confirmUpload(args: ConfirmUploadArgs): Promise<ProductImageDocument> {
    const product = await this.loadProduct(args.productId);
    const bucket = this.requireBucket();

    // HEAD the object to validate upload integrity per D2.
    const head = await this.r2.head(bucket, args.payload.r2Key);
    if (!head.contentType || !ALLOWED_CONTENT_TYPES.has(head.contentType)) {
      throw new BadRequestException({
        message: `Uploaded object content-type '${head.contentType ?? '<unknown>'}' is not in the allow-list`,
        code: 'IMAGE_CONTENT_TYPE_REJECTED',
        contentType: head.contentType,
      });
    }
    if (head.contentLength && head.contentLength > MAX_FILE_BYTES) {
      throw new BadRequestException({
        message: `Uploaded object size ${head.contentLength} exceeds max ${MAX_FILE_BYTES} bytes`,
        code: 'IMAGE_TOO_LARGE',
        fileSize: head.contentLength,
        max: MAX_FILE_BYTES,
      });
    }

    const id = ulid();
    let imageDoc: ProductImageDocument | undefined;
    await withTransaction(this.connection, async (session) => {
      const created = await this.imageModel.create(
        [
          {
            id,
            productId: product.id,
            vendorId: product.vendorId,
            r2Key: args.payload.r2Key,
            kind: args.payload.kind,
            altText: args.payload.altText ?? null,
            sortOrder: args.payload.sortOrder ?? 0,
            width: args.payload.width ?? null,
            height: args.payload.height ?? null,
            byteSize: head.contentLength ?? null,
            contentType: head.contentType,
            confirmedAt: new Date(),
            createdBy: args.actorId,
            updatedBy: args.actorId,
          },
        ],
        { session },
      );
      imageDoc = created[0];

      // Bump the product's searchVersion so atlas-search-sync rebuilds
      // the snapshot when the next published.v1 fires.
      product.searchVersion = (product.searchVersion ?? 0) + 1;
      product.updatedBy = args.actorId;
      await product.save({ session });

      await this.outbox.publish(
        {
          type: VendorProductImageConfirmedV1.name,
          idempotencyKey: `product:${product.id}:image-confirmed:${id}`,
          payload: {
            orgId: product.orgId,
            vendorId: product.vendorId,
            productId: product.id,
            imageId: id,
            r2Key: args.payload.r2Key,
            kind: args.payload.kind as ImageKind,
          },
        },
        { session },
      );
    });

    if (!imageDoc) {
      throw new Error('image confirm: transaction completed but image document is undefined');
    }

    this.analytics.capture({
      distinctId: args.actorId,
      event: 'product image uploaded',
      properties: {
        product_id: product.id,
        vendor_id: product.vendorId,
        org_id: product.orgId,
        kind: args.payload.kind,
        byte_size: head.contentLength,
      },
    });

    return imageDoc;
  }

  async listForProduct(productId: string): Promise<ProductImageDocument[]> {
    return this.imageModel.find({ productId }).sort({ sortOrder: 1, createdAt: 1 }).exec();
  }

  publicUrlFor(r2Key: string): string | null {
    const base = this.env.R2_PUBLIC_BASE_URL;
    if (!base) return null;
    const trimmed = base.endsWith('/') ? base.slice(0, -1) : base;
    return `${trimmed}/${r2Key}`;
  }

  private async loadProduct(productId: string): Promise<ProductDocument> {
    const product = await this.productModel.findOne({ id: productId }).exec();
    if (!product) {
      throw new NotFoundException({
        message: `Product ${productId} not found`,
        code: 'RESOURCE_NOT_FOUND',
      });
    }
    return product;
  }

  private requireBucket(): string {
    const bucket = this.env.R2_BUCKET_PRODUCT_IMAGES ?? this.env.R2_BUCKET;
    if (!bucket) {
      throw new BadRequestException({
        message: 'R2_BUCKET_PRODUCT_IMAGES (or R2_BUCKET) must be set to enable image uploads',
        code: 'R2_NOT_CONFIGURED',
      });
    }
    return bucket;
  }

  private requirePresignExpiry(): number {
    return this.env.R2_PRESIGN_EXPIRY_SECONDS ?? 900;
  }

  private extensionForContentType(contentType: string): string {
    switch (contentType) {
      case 'image/jpeg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      default:
        return 'bin';
    }
  }
}
