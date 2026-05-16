import { z } from '../zod.js';
import { InrPaiseSchema, UlidSchema } from '../scalars.js';
import { ProductResponseSchema } from './product-row.js';
import {
  ProductCategoryL1Schema,
  ProductCategoryL2Schema,
  ProductOccasionSchema,
  RecipientTypeSchema,
} from './taxonomy.js';

/**
 * Public product search (`GET /api/products/search`) with faceted
 * filters. Page-based pagination per D5. Reads from
 * `product.search_index` collection at MVP (per D11 — the M0 fallback
 * for Atlas `$search`); same response shape will work when the read
 * path swaps to `$search` post-tier-upgrade.
 *
 * Multi-valued facets use comma-separated query strings
 * (`?occasion=birthday,wellness`). Zod `preprocess` splits before
 * `z.array().pipe(...)` parses.
 */

const csvArray = <T extends z.ZodType>(member: T): z.ZodType<z.infer<T>[]> =>
  z.preprocess((v) => {
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') return v.split(',').filter((s) => s.length > 0);
    return v;
  }, z.array(member)) as z.ZodType<z.infer<T>[]>;

export const SearchProductsQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  occasion: csvArray(ProductOccasionSchema).optional(),
  recipientType: csvArray(RecipientTypeSchema).optional(),
  categoryL1: csvArray(ProductCategoryL1Schema).optional(),
  categoryL2: csvArray(ProductCategoryL2Schema).optional(),
  vendorId: csvArray(UlidSchema).optional(),
  customizable: z
    .preprocess((v) => (v === 'true' ? true : v === 'false' ? false : v), z.boolean())
    .optional(),
  minMoq: z.coerce.number().int().min(1).max(100_000).optional(),
  maxMoq: z.coerce.number().int().min(1).max(100_000).optional(),
  minPricePaise: InrPaiseSchema.optional(),
  maxPricePaise: InrPaiseSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/**
 * Per-facet count maps. The client renders the facet UI from these so
 * filters display the count of products under each option.
 */
const FacetCountSchema = z.record(z.string(), z.number().int().nonnegative());

export const SearchFacetsSchema = z.object({
  occasion: FacetCountSchema,
  recipientType: FacetCountSchema,
  categoryL1: FacetCountSchema,
  categoryL2: FacetCountSchema,
  vendorId: FacetCountSchema,
  customizable: z.object({
    true: z.number().int().nonnegative(),
    false: z.number().int().nonnegative(),
  }),
});

export const SearchProductsResponseSchema = z.object({
  items: z.array(ProductResponseSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
  facets: SearchFacetsSchema,
});

export type SearchProductsQuery = z.infer<typeof SearchProductsQuerySchema>;
export type SearchProductsResponse = z.infer<typeof SearchProductsResponseSchema>;
export type SearchFacets = z.infer<typeof SearchFacetsSchema>;
