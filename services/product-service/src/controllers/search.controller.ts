import { Controller, Get, Query } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';

import {
  SearchProductsQuerySchema,
  type SearchProductsResponse,
} from '@repo/validators';

import { SearchService } from '../services/search.service.js';

export class SearchProductsQueryDto extends createZodDto(SearchProductsQuerySchema) {}

/**
 * Public product search. Reads from the denormalized
 * `product.search_index` collection (M0 fallback per D11). Anonymous-
 * accessible per the gateway @AllowAnonymous policy mounted on this
 * controller path.
 */
@Controller('products/search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get()
  async run(@Query() query: SearchProductsQueryDto): Promise<SearchProductsResponse> {
    const result = await this.search.search(
      query as unknown as Parameters<SearchService['search']>[0],
    );
    return {
      items: result.items.map((row) => ({
        id: row.id as SearchProductsResponse['items'][number]['id'],
        vendorId: row.vendorId as SearchProductsResponse['items'][number]['vendorId'],
        orgId: row.orgId as SearchProductsResponse['items'][number]['orgId'],
        title: row.title,
        slug: row.slug,
        descriptionMd: row.descriptionPlain,
        status: row.status,
        categoryL1: row.categoryL1,
        categoryL2: row.categoryL2,
        occasions: [...row.occasions],
        recipientTypes: [...row.recipientTypes],
        customizable: row.customizable,
        brandingAreas: [],
        moq: row.moq,
        leadTimeDays: row.leadTimeDays,
        sampleAvailable: false,
        hsnCode: '',
        basePricePaise: row.basePricePaise,
        currency: 'INR',
        variants: [],
        imageR2Keys: [],
        averageRating: row.ratingAggregate.average > 0 ? row.ratingAggregate.average : null,
        ratingCount: row.ratingAggregate.count,
        availableStock: null,
        searchVersion: row.searchVersion ?? 0,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
      pagination: result.pagination,
      facets: result.facets,
    };
  }
}
