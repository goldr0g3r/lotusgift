import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import type {
  SearchFacets,
  SearchProductsQuery,
  SearchProductsResponse,
} from '@repo/validators';
import {
  PRODUCT_CATEGORY_L1_KEYS,
  PRODUCT_CATEGORY_L2_KEYS,
  PRODUCT_OCCASIONS,
  RECIPIENT_TYPES,
} from '@repo/types';

import {
  PRODUCT_SEARCH_INDEX_MODEL,
  type ProductSearchIndexDocument,
} from '../schemas/search-index.schema.js';

/**
 * Public product search service. Reads from the denormalized
 * `product.search_index` collection (M0 fallback per D11). Same
 * response shape will work when the read path swaps to Atlas
 * `$search` post-M10-tier-upgrade per `docs/runbooks/scaling-up.md`.
 *
 * Returns paginated results + faceted counts. The facet aggregation
 * uses `$facet` to compute counts in parallel with the page query in
 * a single Mongo round-trip.
 */
@Injectable()
export class SearchService {
  constructor(
    @InjectModel(PRODUCT_SEARCH_INDEX_MODEL)
    private readonly indexModel: Model<ProductSearchIndexDocument>,
  ) {}

  async search(query: SearchProductsQuery): Promise<{
    items: ProductSearchIndexDocument[];
    pagination: SearchProductsResponse['pagination'];
    facets: SearchFacets;
  }> {
    const filter = this.buildFilter(query);

    const [items, total, facetCounts] = await Promise.all([
      this.indexModel
        .find(filter)
        .sort({ indexedAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .exec(),
      this.indexModel.countDocuments(filter),
      this.computeFacets(filter),
    ]);

    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
      facets: facetCounts,
    };
  }

  private buildFilter(query: SearchProductsQuery): Record<string, unknown> {
    const filter: Record<string, unknown> = { status: 'PUBLISHED' };

    if (query.q && query.q.length > 0) {
      // `searchTerms` is built lowercased in `atlas-search-sync.service.ts`
      // and we lowercase the query here, so the ASCII case-folding is
      // already handled. `$options: 'i'` makes the case-insensitive
      // contract explicit (locale-safe for future Hindi / Devanagari
      // content where `String.prototype.toLowerCase()` is a no-op) and
      // protects future contributors who might add a writer to
      // `searchTerms` without remembering to lowercase it.
      const escaped = this.escapeRegex(query.q.toLowerCase().trim());
      filter.searchTerms = { $regex: escaped, $options: 'i' };
    }
    if (query.occasion && query.occasion.length > 0) {
      filter.occasions = { $in: query.occasion };
    }
    if (query.recipientType && query.recipientType.length > 0) {
      filter.recipientTypes = { $in: query.recipientType };
    }
    if (query.categoryL1 && query.categoryL1.length > 0) {
      filter.categoryL1 = { $in: query.categoryL1 };
    }
    if (query.categoryL2 && query.categoryL2.length > 0) {
      filter.categoryL2 = { $in: query.categoryL2 };
    }
    if (query.vendorId && query.vendorId.length > 0) {
      filter.vendorId = { $in: query.vendorId };
    }
    if (typeof query.customizable === 'boolean') {
      filter.customizable = query.customizable;
    }
    if (query.minMoq !== undefined || query.maxMoq !== undefined) {
      const range: Record<string, number> = {};
      if (query.minMoq !== undefined) range.$gte = query.minMoq;
      if (query.maxMoq !== undefined) range.$lte = query.maxMoq;
      filter.moq = range;
    }
    if (query.minPricePaise !== undefined || query.maxPricePaise !== undefined) {
      const range: Record<string, number> = {};
      if (query.minPricePaise !== undefined) range.$gte = query.minPricePaise;
      if (query.maxPricePaise !== undefined) range.$lte = query.maxPricePaise;
      filter.basePricePaise = range;
    }

    return filter;
  }

  private async computeFacets(
    matchFilter: Record<string, unknown>,
  ): Promise<SearchFacets> {
    const aggregateResults = await this.indexModel.aggregate([
      { $match: matchFilter },
      {
        $facet: {
          occasion: [
            { $unwind: '$occasions' },
            { $group: { _id: '$occasions', count: { $sum: 1 } } },
          ],
          recipientType: [
            { $unwind: '$recipientTypes' },
            { $group: { _id: '$recipientTypes', count: { $sum: 1 } } },
          ],
          categoryL1: [{ $group: { _id: '$categoryL1', count: { $sum: 1 } } }],
          categoryL2: [{ $group: { _id: '$categoryL2', count: { $sum: 1 } } }],
          vendorId: [{ $group: { _id: '$vendorId', count: { $sum: 1 } } }],
          customizable: [{ $group: { _id: '$customizable', count: { $sum: 1 } } }],
        },
      },
    ]);

    const result = (aggregateResults[0] ?? {}) as Record<string, Array<{ _id: unknown; count: number }>>;

    return {
      occasion: this.bucketsToRecord(result.occasion ?? [], PRODUCT_OCCASIONS),
      recipientType: this.bucketsToRecord(result.recipientType ?? [], RECIPIENT_TYPES),
      categoryL1: this.bucketsToRecord(result.categoryL1 ?? [], PRODUCT_CATEGORY_L1_KEYS),
      categoryL2: this.bucketsToRecord(result.categoryL2 ?? [], PRODUCT_CATEGORY_L2_KEYS),
      vendorId: this.bucketsToRecord(result.vendorId ?? []),
      customizable: this.booleanBucketsToRecord(result.customizable ?? []),
    };
  }

  private bucketsToRecord(
    buckets: Array<{ _id: unknown; count: number }>,
    allKeys?: readonly string[],
  ): Record<string, number> {
    const map: Record<string, number> = {};
    if (allKeys) {
      for (const k of allKeys) map[k] = 0;
    }
    for (const b of buckets) {
      if (typeof b._id === 'string') map[b._id] = b.count;
    }
    return map;
  }

  private booleanBucketsToRecord(
    buckets: Array<{ _id: unknown; count: number }>,
  ): { true: number; false: number } {
    const out = { true: 0, false: 0 };
    for (const b of buckets) {
      if (b._id === true) out.true = b.count;
      else if (b._id === false) out.false = b.count;
    }
    return out;
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
