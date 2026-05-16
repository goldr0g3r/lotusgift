import { Test, type TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';

import { SearchService } from './search.service.js';
import { PRODUCT_SEARCH_INDEX_MODEL } from '../schemas/search-index.schema.js';

describe('SearchService', () => {
  const find = jest.fn();
  const countDocuments = jest.fn();
  const aggregate = jest.fn();

  let service: SearchService;

  beforeEach(async () => {
    find.mockReset();
    countDocuments.mockReset();
    aggregate.mockReset();

    const chain = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };
    const fakeModel = {
      find: (filter: unknown) => {
        find(filter);
        chain.exec.mockResolvedValue([
          {
            id: 'idx1',
            productId: 'p1',
            vendorId: 'v1',
            orgId: 'o1',
            title: 'Black mug',
            descriptionPlain: 'A nice black mug',
            slug: 'black-mug-q7hx2',
            status: 'PUBLISHED',
            categoryL1: 'drinkware',
            categoryL2: 'mug',
            occasions: ['birthday'],
            recipientTypes: ['employee'],
            customizable: false,
            moq: 1,
            leadTimeDays: 0,
            basePricePaise: 50_000,
            minVariantPricePaise: 50_000,
            searchTerms: 'black mug birthday employee',
            ratingAggregate: { sum: 0, count: 0, average: 0 },
            indexedAt: new Date(),
            searchVersion: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);
        return chain;
      },
      countDocuments,
      aggregate,
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: getModelToken(PRODUCT_SEARCH_INDEX_MODEL), useValue: fakeModel },
      ],
    }).compile();
    service = moduleRef.get(SearchService);
  });

  it('returns items + pagination + facets for an empty query', async () => {
    countDocuments.mockResolvedValue(1);
    aggregate.mockResolvedValue([
      {
        occasion: [{ _id: 'birthday', count: 1 }],
        recipientType: [{ _id: 'employee', count: 1 }],
        categoryL1: [{ _id: 'drinkware', count: 1 }],
        categoryL2: [{ _id: 'mug', count: 1 }],
        vendorId: [{ _id: 'v1', count: 1 }],
        customizable: [{ _id: false, count: 1 }],
      },
    ]);
    const result = await service.search({ page: 1, limit: 20 });
    expect(result.items).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
    expect(result.pagination.page).toBe(1);
    expect(result.facets.occasion.birthday).toBe(1);
    expect(result.facets.customizable.false).toBe(1);
  });

  it('applies the q substring filter via $regex', async () => {
    countDocuments.mockResolvedValue(0);
    aggregate.mockResolvedValue([{}]);
    await service.search({ q: 'mug', page: 1, limit: 20 });
    const [filter] = find.mock.calls[0] as [Record<string, unknown>];
    expect(filter.status).toBe('PUBLISHED');
    expect(filter.searchTerms).toEqual({ $regex: 'mug' });
  });

  it('applies multi-value facet filters via $in', async () => {
    countDocuments.mockResolvedValue(0);
    aggregate.mockResolvedValue([{}]);
    await service.search({
      occasion: ['birthday', 'wellness'],
      categoryL1: ['drinkware'],
      page: 1,
      limit: 20,
    });
    const [filter] = find.mock.calls[0] as [Record<string, { $in: unknown[] }>];
    expect(filter.occasions.$in).toEqual(['birthday', 'wellness']);
    expect(filter.categoryL1.$in).toEqual(['drinkware']);
  });
});
