import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';

import { OUTBOX_PORT, ulid, type OutboxPort } from '@repo/utils';
import { withTransaction } from '@repo/database';
import {
  VendorProductVariantAddedV1,
  VendorProductVariantRemovedV1,
  VendorProductVariantUpdatedV1,
} from '@repo/events';
import type { ServerAnalytics } from '@repo/analytics-sdk';
import type { VariantCreateRequest, VariantUpdateRequest } from '@repo/validators';

import { PRODUCT_MODEL, type ProductDocument } from '../schemas/product.schema.js';
import { ANALYTICS_TOKEN } from '../product-service.tokens.js';

const VARIANT_HARD_CAP = 200;

interface AddVariantArgs {
  productId: string;
  payload: VariantCreateRequest;
  actorId: string;
}

interface UpdateVariantArgs {
  productId: string;
  variantId: string;
  patch: VariantUpdateRequest;
  actorId: string;
}

interface RemoveVariantArgs {
  productId: string;
  variantId: string;
  actorId: string;
}

/**
 * Variant CRUD on the embedded subdoc-array. SKU uniqueness enforced
 * within a single product; 200-variant hard cap per D18.
 */
@Injectable()
export class VariantService {
  constructor(
    @InjectModel(PRODUCT_MODEL) private readonly productModel: Model<ProductDocument>,
    @InjectConnection() private readonly connection: Connection,
    @Inject(OUTBOX_PORT) private readonly outbox: OutboxPort,
    @Inject(ANALYTICS_TOKEN) private readonly analytics: ServerAnalytics,
  ) {}

  async addVariant(args: AddVariantArgs): Promise<ProductDocument> {
    const product = await this.loadProduct(args.productId);
    const variants = product.variants ?? [];

    if (variants.length >= VARIANT_HARD_CAP) {
      throw new ConflictException({
        message: `Variant limit exceeded (max ${VARIANT_HARD_CAP} per product). Split the product into multiple SKUs.`,
        code: 'VARIANT_LIMIT_EXCEEDED',
        currentCount: variants.length,
        max: VARIANT_HARD_CAP,
      });
    }
    if (variants.some((v) => v.sku === args.payload.sku)) {
      throw new ConflictException({
        message: `SKU '${args.payload.sku}' is already used by another variant on this product`,
        code: 'VARIANT_SKU_TAKEN',
        sku: args.payload.sku,
      });
    }

    const variantId = ulid();
    const variant = {
      id: variantId,
      sku: args.payload.sku,
      attributes: { ...args.payload.attributes },
      pricePaise: args.payload.pricePaise,
      weightGrams: args.payload.weightGrams,
      dimensionsMm: args.payload.dimensionsMm,
      barcode: args.payload.barcode ?? null,
      enabled: args.payload.enabled,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await withTransaction(this.connection, async (session) => {
      product.variants.push(variant);
      product.searchVersion = (product.searchVersion ?? 0) + 1;
      product.updatedBy = args.actorId;
      await product.save({ session });
      await this.outbox.publish(
        {
          type: VendorProductVariantAddedV1.name,
          idempotencyKey: `product:${product.id}:variant-added:${variantId}`,
          payload: {
            orgId: product.orgId,
            vendorId: product.vendorId,
            productId: product.id,
            variantId,
            sku: args.payload.sku,
            attributes: { ...args.payload.attributes },
          },
        },
        { session },
      );
    });

    this.analytics.capture({
      distinctId: args.actorId,
      event: 'variant added',
      properties: {
        product_id: product.id,
        variant_id: variantId,
        vendor_id: product.vendorId,
        org_id: product.orgId,
      },
    });

    return product;
  }

  async updateVariant(args: UpdateVariantArgs): Promise<ProductDocument> {
    const product = await this.loadProduct(args.productId);
    const variant = product.variants.find((v) => v.id === args.variantId);
    if (!variant) {
      throw new NotFoundException({
        message: `Variant ${args.variantId} not found on product ${args.productId}`,
        code: 'RESOURCE_NOT_FOUND',
      });
    }

    if (args.patch.sku !== undefined && args.patch.sku !== variant.sku) {
      if (product.variants.some((v) => v.sku === args.patch.sku && v.id !== variant.id)) {
        throw new ConflictException({
          message: `SKU '${args.patch.sku}' is already used by another variant on this product`,
          code: 'VARIANT_SKU_TAKEN',
          sku: args.patch.sku,
        });
      }
      variant.sku = args.patch.sku;
    }
    if (args.patch.attributes !== undefined) {
      variant.attributes = { ...args.patch.attributes };
    }
    if (args.patch.pricePaise !== undefined) variant.pricePaise = args.patch.pricePaise;
    if (args.patch.weightGrams !== undefined) variant.weightGrams = args.patch.weightGrams;
    if (args.patch.dimensionsMm !== undefined) variant.dimensionsMm = args.patch.dimensionsMm;
    if (args.patch.barcode !== undefined) variant.barcode = args.patch.barcode ?? null;
    if (args.patch.enabled !== undefined) variant.enabled = args.patch.enabled;
    variant.updatedAt = new Date();
    product.searchVersion = (product.searchVersion ?? 0) + 1;
    product.updatedBy = args.actorId;
    product.markModified('variants');

    const newVersion = product.searchVersion;
    await withTransaction(this.connection, async (session) => {
      await product.save({ session });
      // Publish in the same txn so `atlas-search-sync.service` rebuilds
      // the snapshot for price / attribute / SKU rename changes — without
      // this, `minVariantPricePaise` + `searchTerms` would silently
      // drift from the source-of-truth product
      // (`.cursor/rules/event-driven-discipline.mdc`).
      await this.outbox.publish(
        {
          type: VendorProductVariantUpdatedV1.name,
          idempotencyKey: `product:${product.id}:variant-updated:${args.variantId}:${newVersion}`,
          payload: {
            orgId: product.orgId,
            vendorId: product.vendorId,
            productId: product.id,
            variantId: args.variantId,
            sku: variant.sku,
          },
        },
        { session },
      );
    });

    this.analytics.capture({
      distinctId: args.actorId,
      event: 'variant updated',
      properties: {
        product_id: product.id,
        variant_id: args.variantId,
        vendor_id: product.vendorId,
        org_id: product.orgId,
      },
    });

    return product;
  }

  async removeVariant(args: RemoveVariantArgs): Promise<ProductDocument> {
    const product = await this.loadProduct(args.productId);
    const idx = product.variants.findIndex((v) => v.id === args.variantId);
    if (idx === -1) {
      throw new NotFoundException({
        message: `Variant ${args.variantId} not found on product ${args.productId}`,
        code: 'RESOURCE_NOT_FOUND',
      });
    }
    if (product.variants.length === 1 && product.status === 'PUBLISHED') {
      throw new BadRequestException({
        message: 'Cannot remove the last variant of a PUBLISHED product. Unpublish first.',
        code: 'PRODUCT_NO_VARIANTS',
      });
    }
    const removedVariant = product.variants[idx];
    if (!removedVariant) {
      // Unreachable — `idx` came from `findIndex` against the same
      // array we're indexing, but TS's `noUncheckedIndexedAccess` rule
      // requires the guard.
      throw new NotFoundException({
        message: `Variant ${args.variantId} not found on product ${args.productId}`,
        code: 'RESOURCE_NOT_FOUND',
      });
    }
    const removedSku = removedVariant.sku;
    product.variants.splice(idx, 1);
    product.searchVersion = (product.searchVersion ?? 0) + 1;
    product.updatedBy = args.actorId;
    product.markModified('variants');

    const newVersion = product.searchVersion;
    await withTransaction(this.connection, async (session) => {
      await product.save({ session });
      // Publish in the same txn so `atlas-search-sync.service` removes
      // the variant's price band + SKU from the snapshot — without this,
      // the removed variant would silently keep surfacing in faceted
      // search at its old price band.
      await this.outbox.publish(
        {
          type: VendorProductVariantRemovedV1.name,
          idempotencyKey: `product:${product.id}:variant-removed:${args.variantId}:${newVersion}`,
          payload: {
            orgId: product.orgId,
            vendorId: product.vendorId,
            productId: product.id,
            variantId: args.variantId,
            sku: removedSku,
          },
        },
        { session },
      );
    });

    this.analytics.capture({
      distinctId: args.actorId,
      event: 'variant removed',
      properties: {
        product_id: product.id,
        variant_id: args.variantId,
        vendor_id: product.vendorId,
        org_id: product.orgId,
      },
    });

    return product;
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
}
