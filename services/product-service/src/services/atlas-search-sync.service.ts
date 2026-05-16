import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import {
  OUTBOX_PORT,
  type OutboxPort,
  type Subscription,
} from '@repo/utils';
import {
  VendorProductImageConfirmedV1,
  VendorProductPublishedV1,
  VendorProductUnpublishedV1,
  VendorProductVariantAddedV1,
  VendorProductVariantRemovedV1,
  VendorProductVariantUpdatedV1,
  type VendorProductPublishedV1Payload,
  type VendorProductUnpublishedV1Payload,
  type VendorProductVariantAddedV1Payload,
  type VendorProductVariantRemovedV1Payload,
  type VendorProductVariantUpdatedV1Payload,
} from '@repo/events';

import { PRODUCT_MODEL, type ProductDocument } from '../schemas/product.schema.js';
import {
  PRODUCT_SEARCH_INDEX_MODEL,
  type ProductSearchIndexDocument,
} from '../schemas/search-index.schema.js';

const log = new Logger('AtlasSearchSyncService');

/**
 * Outbox subscriber that maintains the denormalized
 * `product.search_index` collection — the M0 fallback for Atlas
 * `$search` per D11 (M0's 10k queries / 7-day rolling quota makes
 * burning into it from a public faceted-search endpoint risky at
 * launch).
 *
 * Subscribes to 6 product.* events at bootstrap (variant-updated +
 * variant-removed added in the PR-17 Copilot review iteration so price /
 * attribute / SKU mutations don't silently drift the snapshot); each
 * handler is an idempotent upsert keyed on `productId` so OutboxPort
 * double-delivery (LRU dedup window misses) doesn't double-write.
 * `OnApplicationShutdown` unsubscribes so re-mount during hot reload
 * doesn't leave dangling handlers.
 *
 * TODO(P21): swap `search.service.search()` read path to `$search`
 * aggregation when the cluster upgrades to M10+ per
 * `docs/runbooks/scaling-up.md`. The `product.search_index` collection
 * + this sync remain useful as a cached snapshot for hot-path reads.
 */
@Injectable()
export class AtlasSearchSyncService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private subscriptions: Subscription[] = [];

  constructor(
    @InjectModel(PRODUCT_MODEL) private readonly productModel: Model<ProductDocument>,
    @InjectModel(PRODUCT_SEARCH_INDEX_MODEL)
    private readonly indexModel: Model<ProductSearchIndexDocument>,
    @Inject(OUTBOX_PORT) private readonly outbox: OutboxPort,
  ) {}

  onApplicationBootstrap(): void {
    this.subscriptions.push(
      this.outbox.subscribe(VendorProductPublishedV1.name, async (event) => {
        await this.handlePublished(event.payload as VendorProductPublishedV1Payload);
      }),
    );
    this.subscriptions.push(
      this.outbox.subscribe(VendorProductUnpublishedV1.name, async (event) => {
        await this.handleUnpublished(event.payload as VendorProductUnpublishedV1Payload);
      }),
    );
    this.subscriptions.push(
      this.outbox.subscribe(VendorProductVariantAddedV1.name, async (event) => {
        await this.handleVariantAdded(event.payload as VendorProductVariantAddedV1Payload);
      }),
    );
    this.subscriptions.push(
      this.outbox.subscribe(VendorProductVariantUpdatedV1.name, async (event) => {
        const payload = event.payload as VendorProductVariantUpdatedV1Payload;
        await this.rebuildForProduct(payload.productId);
      }),
    );
    this.subscriptions.push(
      this.outbox.subscribe(VendorProductVariantRemovedV1.name, async (event) => {
        const payload = event.payload as VendorProductVariantRemovedV1Payload;
        await this.rebuildForProduct(payload.productId);
      }),
    );
    this.subscriptions.push(
      this.outbox.subscribe(VendorProductImageConfirmedV1.name, async (event) => {
        const payload = event.payload as { productId: string };
        await this.rebuildForProduct(payload.productId);
      }),
    );
    log.log('AtlasSearchSyncService bootstrapped — 6 outbox subscriptions active');
  }

  async onApplicationShutdown(): Promise<void> {
    for (const sub of this.subscriptions) sub.unsubscribe();
    this.subscriptions = [];
    log.log('AtlasSearchSyncService shut down — outbox subscriptions released');
  }

  /**
   * Bulk-sync — useful for backfill / first-load. Walks every
   * PUBLISHED product + upserts the snapshot row. Returns the count
   * for observability.
   */
  async bulkSync(): Promise<{ rebuiltCount: number }> {
    const cursor = this.productModel.find({ status: 'PUBLISHED' }).cursor();
    let rebuiltCount = 0;
    for await (const product of cursor) {
      await this.upsertSnapshot(product as ProductDocument);
      rebuiltCount += 1;
    }
    log.log(`Atlas search bulk-sync complete (${rebuiltCount} products rebuilt)`);
    return { rebuiltCount };
  }

  private async handlePublished(payload: VendorProductPublishedV1Payload): Promise<void> {
    await this.rebuildForProduct(payload.productId);
  }

  private async handleVariantAdded(
    payload: VendorProductVariantAddedV1Payload,
  ): Promise<void> {
    await this.rebuildForProduct(payload.productId);
  }

  private async handleUnpublished(
    payload: VendorProductUnpublishedV1Payload,
  ): Promise<void> {
    await this.indexModel.deleteOne({ productId: payload.productId }).exec();
  }

  private async rebuildForProduct(productId: string): Promise<void> {
    const product = await this.productModel.findOne({ id: productId }).exec();
    if (!product || product.status !== 'PUBLISHED') {
      // The product was unpublished / archived between event emission
      // and consumer handling. Remove the snapshot to keep the index
      // consistent with the source of truth.
      await this.indexModel.deleteOne({ productId }).exec();
      return;
    }
    await this.upsertSnapshot(product);
  }

  private async upsertSnapshot(product: ProductDocument): Promise<void> {
    const minVariantPrice =
      product.variants && product.variants.length > 0
        ? Math.min(...product.variants.map((v) => v.pricePaise))
        : product.basePricePaise;
    const ratingAggregate = product.ratingAggregate ?? { sum: 0, count: 0 };
    const average =
      ratingAggregate.count > 0 ? ratingAggregate.sum / ratingAggregate.count : 0;

    await this.indexModel.findOneAndUpdate(
      { productId: product.id },
      {
        $set: {
          productId: product.id,
          vendorId: product.vendorId,
          orgId: product.orgId,
          title: product.title,
          slug: product.slug,
          descriptionPlain: this.markdownToPlain(product.descriptionMd),
          status: product.status,
          categoryL1: product.categoryL1,
          categoryL2: product.categoryL2,
          occasions: product.occasions,
          recipientTypes: product.recipientTypes,
          customizable: product.customizable,
          moq: product.moq,
          leadTimeDays: product.leadTimeDays,
          basePricePaise: product.basePricePaise,
          minVariantPricePaise: minVariantPrice,
          searchTerms: this.buildSearchTerms(product),
          ratingAggregate: { ...ratingAggregate, average },
          indexedAt: new Date(),
          searchVersion: product.searchVersion ?? 0,
        },
        $setOnInsert: { id: product.id },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  private buildSearchTerms(product: ProductDocument): string {
    const parts = [
      product.title,
      this.markdownToPlain(product.descriptionMd),
      product.categoryL1,
      product.categoryL2,
      ...product.occasions,
      ...product.recipientTypes,
    ];
    return parts
      .filter((p) => typeof p === 'string')
      .join(' ')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  private markdownToPlain(md: string): string {
    return md
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[`*_~>#-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
