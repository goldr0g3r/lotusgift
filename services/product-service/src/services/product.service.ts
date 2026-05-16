import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';

import {
  STOCK_READ_PORT,
  ulid,
  type OutboxPort,
  type StockReadPort,
  OUTBOX_PORT,
} from '@repo/utils';
import { withTransaction } from '@repo/database';
import {
  VendorProductPublishedV1,
  VendorProductUnpublishedV1,
} from '@repo/events';
import type {
  ProductCreateRequest,
  ProductListQuery,
  ProductUpdateRequest,
} from '@repo/validators';
import type { ServerAnalytics } from '@repo/analytics-sdk';
import type { ProductStatus } from '@repo/types';

import { PRODUCT_MODEL, type ProductDocument } from '../schemas/product.schema.js';
import { ANALYTICS_TOKEN } from '../product-service.tokens.js';

interface CreateProductArgs extends ProductCreateRequest {
  vendorId: string;
  orgId: string;
  actorId: string;
}

interface UpdateProductArgs {
  productId: string;
  patch: ProductUpdateRequest;
  actorId: string;
}

interface PublishProductArgs {
  productId: string;
  actorId: string;
}

interface UnpublishProductArgs {
  productId: string;
  reason?: string;
  actorId: string;
}

interface ListProductsResult {
  items: ProductDocument[];
  availableStockByVariant: Map<string, number>;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

/**
 * Product aggregate service. Owns the full product lifecycle:
 *
 * - `create` — DRAFT status; vendor must be ACTIVATED (gated by
 *   `VendorActiveGuard` at the controller layer).
 * - `update` — partial patches; status transitions handled by
 *   `publish` / `unpublish` (state-machine guarded).
 * - `publish` — flips `DRAFT|UNPUBLISHED → PUBLISHED` + emits
 *   `product.published.v1` inside `withTransaction` per D8.
 * - `unpublish` — flips `PUBLISHED → UNPUBLISHED` + emits
 *   `product.unpublished.v1`.
 * - `archive` — flips `* → ARCHIVED` (terminal); no event since
 *   downstream consumers treat archived = no-longer-listable but
 *   preserve order-history references.
 *
 * Analytics fires AFTER the outbox transaction commits per D9.
 */
@Injectable()
export class ProductService {
  constructor(
    @InjectModel(PRODUCT_MODEL) private readonly productModel: Model<ProductDocument>,
    @InjectConnection() private readonly connection: Connection,
    @Inject(OUTBOX_PORT) private readonly outbox: OutboxPort,
    @Inject(STOCK_READ_PORT) private readonly stock: StockReadPort,
    @Inject(ANALYTICS_TOKEN) private readonly analytics: ServerAnalytics,
  ) {}

  generateId(): string {
    return ulid();
  }

  async getById(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findOne({ id }).exec();
    if (!product) {
      throw new NotFoundException({
        message: `Product ${id} not found`,
        code: 'RESOURCE_NOT_FOUND',
      });
    }
    return product;
  }

  async getBySlug(orgId: string, slug: string): Promise<ProductDocument> {
    const product = await this.productModel.findOne({ orgId, slug }).exec();
    if (!product) {
      throw new NotFoundException({
        message: `Product with slug '${slug}' not found in org ${orgId}`,
        code: 'RESOURCE_NOT_FOUND',
      });
    }
    return product;
  }

  async list(args: ProductListQuery): Promise<ListProductsResult> {
    const page = args.page ?? 1;
    const limit = args.limit ?? 20;
    const filter: Record<string, unknown> = {};
    if (args.vendorId) filter.vendorId = args.vendorId;
    if (args.status) filter.status = args.status;

    const [items, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(filter),
    ]);

    const availableStockByVariant = await this.batchGetStock(items);

    return {
      items,
      availableStockByVariant,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async create(args: CreateProductArgs): Promise<ProductDocument> {
    const id = ulid();
    const slug = this.buildSlug(args.title, id);

    // Slug uniqueness guard within the org. The compound unique index
    // on `(orgId, slug)` is the source-of-truth; we surface a friendly
    // 409 if collision occurs at insert time.
    const existing = await this.productModel
      .findOne({ orgId: args.orgId, slug })
      .exec();
    if (existing) {
      throw new ConflictException({
        message: `Product slug '${slug}' already exists in this organization`,
        code: 'PRODUCT_SLUG_TAKEN',
        slug,
      });
    }

    // Build the variant subdocs with server-generated ids + audit
    // timestamps. The Zod request schema validates the rest.
    const variants = args.variants.map((v) => ({
      ...v,
      id: ulid(),
      attributes: { ...v.attributes },
      barcode: v.barcode ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const doc = new this.productModel({
      id,
      vendorId: args.vendorId,
      orgId: args.orgId,
      title: args.title,
      slug,
      descriptionMd: args.descriptionMd,
      status: 'DRAFT' as ProductStatus,
      categoryL1: args.categoryL1,
      categoryL2: args.categoryL2,
      occasions: args.occasions,
      recipientTypes: args.recipientTypes,
      customizable: args.customizable,
      brandingAreas: args.brandingAreas,
      moq: args.moq,
      leadTimeDays: args.leadTimeDays,
      sampleAvailable: args.sampleAvailable,
      hsnCode: args.hsnCode,
      basePricePaise: args.basePricePaise,
      variants,
      ratingAggregate: { sum: 0, count: 0 },
      searchVersion: 0,
      createdBy: args.actorId,
      updatedBy: args.actorId,
    });

    await doc.save();
    return doc;
  }

  async update(args: UpdateProductArgs): Promise<ProductDocument> {
    const product = await this.getById(args.productId);
    const patch = args.patch;
    if (patch.title !== undefined) product.title = patch.title;
    if (patch.descriptionMd !== undefined) product.descriptionMd = patch.descriptionMd;
    if (patch.categoryL1 !== undefined) product.categoryL1 = patch.categoryL1;
    if (patch.categoryL2 !== undefined) product.categoryL2 = patch.categoryL2;
    if (patch.occasions !== undefined) product.occasions = [...patch.occasions];
    if (patch.recipientTypes !== undefined) product.recipientTypes = [...patch.recipientTypes];
    if (patch.customizable !== undefined) product.customizable = patch.customizable;
    if (patch.brandingAreas !== undefined) product.brandingAreas = [...patch.brandingAreas];
    if (patch.moq !== undefined) product.moq = patch.moq;
    if (patch.leadTimeDays !== undefined) product.leadTimeDays = patch.leadTimeDays;
    if (patch.sampleAvailable !== undefined) product.sampleAvailable = patch.sampleAvailable;
    if (patch.hsnCode !== undefined) product.hsnCode = patch.hsnCode;
    if (patch.basePricePaise !== undefined) product.basePricePaise = patch.basePricePaise;
    product.updatedBy = args.actorId;
    product.searchVersion = (product.searchVersion ?? 0) + 1;
    await product.save();
    return product;
  }

  async publish(args: PublishProductArgs): Promise<ProductDocument> {
    const product = await this.getById(args.productId);
    if (product.status === 'PUBLISHED') return product;
    if (product.status === 'ARCHIVED') {
      throw new ConflictException({
        message: 'Cannot publish an archived product',
        code: 'PRODUCT_INVALID_TRANSITION',
        from: product.status,
        to: 'PUBLISHED',
      });
    }
    if ((product.variants ?? []).length === 0) {
      throw new ConflictException({
        message: 'Product must have at least one variant before publishing',
        code: 'PRODUCT_NO_VARIANTS',
      });
    }

    const publishedAt = new Date();
    await withTransaction(this.connection, async (session) => {
      product.status = 'PUBLISHED';
      product.publishedAt = publishedAt;
      product.unpublishedAt = null;
      product.unpublishedReason = null;
      product.searchVersion = (product.searchVersion ?? 0) + 1;
      product.updatedBy = args.actorId;
      await product.save({ session });
      await this.outbox.publish(
        {
          type: VendorProductPublishedV1.name,
          idempotencyKey: `product:${product.id}:published:${publishedAt.toISOString()}`,
          payload: {
            orgId: product.orgId,
            vendorId: product.vendorId,
            productId: product.id,
            slug: product.slug,
            title: product.title,
            categoryL1: product.categoryL1,
            categoryL2: product.categoryL2,
            occasions: product.occasions,
          },
        },
        { session },
      );
    });

    this.analytics.capture({
      distinctId: args.actorId,
      event: 'product published',
      properties: {
        product_id: product.id,
        vendor_id: product.vendorId,
        org_id: product.orgId,
        category_l1: product.categoryL1,
        category_l2: product.categoryL2,
        variant_count: product.variants.length,
      },
    });

    return product;
  }

  async unpublish(args: UnpublishProductArgs): Promise<ProductDocument> {
    const product = await this.getById(args.productId);
    if (product.status === 'UNPUBLISHED' || product.status === 'ARCHIVED') return product;

    const unpublishedAt = new Date();
    const reason = args.reason ?? null;
    await withTransaction(this.connection, async (session) => {
      product.status = 'UNPUBLISHED';
      product.unpublishedAt = unpublishedAt;
      product.unpublishedReason = reason;
      product.searchVersion = (product.searchVersion ?? 0) + 1;
      product.updatedBy = args.actorId;
      await product.save({ session });
      await this.outbox.publish(
        {
          type: VendorProductUnpublishedV1.name,
          idempotencyKey: `product:${product.id}:unpublished:${unpublishedAt.toISOString()}`,
          payload: {
            orgId: product.orgId,
            vendorId: product.vendorId,
            productId: product.id,
            reason,
          },
        },
        { session },
      );
    });

    this.analytics.capture({
      distinctId: args.actorId,
      event: 'product unpublished',
      properties: {
        product_id: product.id,
        vendor_id: product.vendorId,
        org_id: product.orgId,
        reason: reason ? '[present]' : undefined,
      },
    });

    return product;
  }

  async archive(args: PublishProductArgs): Promise<ProductDocument> {
    const product = await this.getById(args.productId);
    if (product.status === 'ARCHIVED') return product;
    product.status = 'ARCHIVED';
    product.searchVersion = (product.searchVersion ?? 0) + 1;
    product.updatedBy = args.actorId;
    await product.save();
    return product;
  }

  /**
   * Batch-resolve `available` stock for every variant of every product
   * in `products`. Wraps the `StockReadPort` (stub at MVP per D12; P8
   * inventory-service ships the real Redis-backed impl).
   */
  async batchGetStock(products: ProductDocument[]): Promise<Map<string, number>> {
    const variantIds: string[] = [];
    for (const p of products) {
      for (const v of p.variants ?? []) variantIds.push(v.id);
    }
    if (variantIds.length === 0) return new Map();
    const snapshots = await this.stock.batchGet(variantIds);
    const result = new Map<string, number>();
    for (const id of variantIds) {
      const snap = snapshots.get(id);
      result.set(id, snap ? snap.available : 0);
    }
    return result;
  }

  /**
   * Build a URL-safe + collision-resistant product slug per D14:
   * kebab-case(title) + '-' + 5-char ULID suffix.
   */
  buildSlug(title: string, productId: string): string {
    const kebab = title
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const suffix = productId.slice(-5).toLowerCase();
    const base = kebab.length === 0 ? 'product' : kebab.slice(0, 80);
    return `${base}-${suffix}`;
  }
}
