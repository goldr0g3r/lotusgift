import { PRODUCT_CATEGORY_L1_TO_L2 } from '@repo/types';

import { z } from '../zod.js';
import { PaginatedSchema } from '../pagination.js';
import { InrPaiseSchema, UlidSchema } from '../scalars.js';
import { HsnCodeSchema } from './hsn.js';
import {
  BrandingAreaSchema,
  ProductCategoryL1Schema,
  ProductCategoryL2Schema,
  ProductOccasionSchema,
  ProductStatusSchema,
  RecipientTypeSchema,
} from './taxonomy.js';
import { VariantCreateRequestSchema, VariantResponseSchema } from './variant-row.js';

/**
 * Product aggregate request + response schemas. See
 * `docs/research/phase-7-product-service.md` D3 + D4 + D14 + D15 for
 * the variant subdoc-array, 2-level taxonomy, slug-gen, and HSN
 * validation rationale.
 */

/**
 * `superRefine` enforcing that `(categoryL1, categoryL2)` form a valid
 * pair per the parent-pointer lookup `PRODUCT_CATEGORY_L1_TO_L2`.
 * Centralized so create + update paths share the same rule.
 */
function requireValidCategoryPair(
  data: { categoryL1: unknown; categoryL2: unknown },
  ctx: z.RefinementCtx,
): void {
  const { categoryL1, categoryL2 } = data;
  if (typeof categoryL1 !== 'string' || typeof categoryL2 !== 'string') return;
  const expectedL1 = (PRODUCT_CATEGORY_L1_TO_L2 as Record<string, string>)[categoryL2];
  if (expectedL1 && expectedL1 !== categoryL1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['categoryL2'],
      message: `categoryL2 '${categoryL2}' belongs to L1 '${expectedL1}', not '${categoryL1}'`,
    });
  }
}

/**
 * Full product create-request payload. `slug` is derived server-side
 * (kebab-case(title) + ULID suffix per D14) so it's NOT accepted from
 * the client.
 */
export const ProductCreateRequestSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    descriptionMd: z.string().trim().min(10).max(8000),
    categoryL1: ProductCategoryL1Schema,
    categoryL2: ProductCategoryL2Schema,
    occasions: z.array(ProductOccasionSchema).min(1).max(12),
    recipientTypes: z.array(RecipientTypeSchema).min(1).max(5),
    customizable: z.boolean().default(false),
    brandingAreas: z.array(BrandingAreaSchema).max(6).default([]),
    moq: z.number().int().min(1).max(100_000).default(1),
    leadTimeDays: z.number().int().min(0).max(180).default(0),
    sampleAvailable: z.boolean().default(false),
    hsnCode: HsnCodeSchema,
    basePricePaise: InrPaiseSchema,
    variants: z.array(VariantCreateRequestSchema).max(200).default([]),
  })
  .superRefine(requireValidCategoryPair);

/**
 * Update payload — every field optional. Re-runs the category pair
 * `superRefine` when both L1 + L2 are present in the patch.
 */
export const ProductUpdateRequestSchema = z
  .object({
    title: z.string().trim().min(3).max(160).optional(),
    descriptionMd: z.string().trim().min(10).max(8000).optional(),
    categoryL1: ProductCategoryL1Schema.optional(),
    categoryL2: ProductCategoryL2Schema.optional(),
    occasions: z.array(ProductOccasionSchema).min(1).max(12).optional(),
    recipientTypes: z.array(RecipientTypeSchema).min(1).max(5).optional(),
    customizable: z.boolean().optional(),
    brandingAreas: z.array(BrandingAreaSchema).max(6).optional(),
    moq: z.number().int().min(1).max(100_000).optional(),
    leadTimeDays: z.number().int().min(0).max(180).optional(),
    sampleAvailable: z.boolean().optional(),
    hsnCode: HsnCodeSchema.optional(),
    basePricePaise: InrPaiseSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.categoryL1 !== undefined && data.categoryL2 !== undefined) {
      requireValidCategoryPair(
        { categoryL1: data.categoryL1, categoryL2: data.categoryL2 },
        ctx,
      );
    }
  });

/**
 * Product response envelope. Includes derived fields the client needs
 * (slug, status, variants, image r2Keys, computed average rating).
 * `availableStock` is populated at read time via `StockReadPort`
 * (`StubStockReadPort` returns 0 at MVP per D12; P8 swaps in the real
 * Redis-backed reader).
 */
export const ProductResponseSchema = z.object({
  id: UlidSchema,
  vendorId: UlidSchema,
  orgId: UlidSchema,
  title: z.string(),
  slug: z.string(),
  descriptionMd: z.string(),
  status: ProductStatusSchema,
  categoryL1: ProductCategoryL1Schema,
  categoryL2: ProductCategoryL2Schema,
  occasions: z.array(ProductOccasionSchema),
  recipientTypes: z.array(RecipientTypeSchema),
  customizable: z.boolean(),
  brandingAreas: z.array(BrandingAreaSchema),
  moq: z.number().int(),
  leadTimeDays: z.number().int(),
  sampleAvailable: z.boolean(),
  hsnCode: z.string(),
  basePricePaise: z.number().int(),
  currency: z.literal('INR'),
  variants: z.array(VariantResponseSchema),
  imageR2Keys: z.array(z.string()),
  averageRating: z.number().min(0).max(5).nullable(),
  ratingCount: z.number().int().nonnegative(),
  availableStock: z.number().int().nonnegative().nullable(),
  searchVersion: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * List-query (vendor-scoped product list — `GET /api/products?vendorId=...`).
 * The public `/api/products/search` endpoint uses `SearchProductsQuery`
 * from `search-query.ts` instead.
 */
export const ProductListQuerySchema = z.object({
  vendorId: UlidSchema.optional(),
  status: ProductStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const ProductListResponseSchema = PaginatedSchema(ProductResponseSchema);

export type ProductCreateRequest = z.infer<typeof ProductCreateRequestSchema>;
export type ProductUpdateRequest = z.infer<typeof ProductUpdateRequestSchema>;
export type ProductResponse = z.infer<typeof ProductResponseSchema>;
export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;
export type ProductListResponse = z.infer<typeof ProductListResponseSchema>;
