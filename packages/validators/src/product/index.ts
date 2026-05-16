// Per-service Zod schemas for `services/product-service` (P7 — populated
// from the empty P2 shell). Public surface re-exported here for the
// top-level `@repo/validators` barrel.

export {
  BrandingAreaSchema,
  ImageKindSchema,
  ProductCategoryL1Schema,
  ProductCategoryL2Schema,
  ProductOccasionSchema,
  ProductStatusSchema,
  RecipientTypeSchema,
  ReviewStatusSchema,
} from './taxonomy.js';

export { HsnCodeSchema } from './hsn.js';

export {
  VariantAttributesSchema,
  VariantCreateRequestSchema,
  VariantResponseSchema,
  VariantUpdateRequestSchema,
} from './variant-row.js';
export type {
  VariantAttributes,
  VariantCreateRequest,
  VariantResponse,
  VariantUpdateRequest,
} from './variant-row.js';

export {
  ProductCreateRequestSchema,
  ProductListQuerySchema,
  ProductListResponseSchema,
  ProductResponseSchema,
  ProductUpdateRequestSchema,
} from './product-row.js';
export type {
  ProductCreateRequest,
  ProductListQuery,
  ProductListResponse,
  ProductResponse,
  ProductUpdateRequest,
} from './product-row.js';

export {
  ImageConfirmRequestSchema,
  ImageContentTypeSchema,
  ImageResponseSchema,
  ImageUploadUrlRequestSchema,
  ImageUploadUrlResponseSchema,
} from './image-upload.js';
export type {
  ImageConfirmRequest,
  ImageResponse,
  ImageUploadUrlRequest,
  ImageUploadUrlResponse,
} from './image-upload.js';

export {
  ReviewCreateRequestSchema,
  ReviewModerationDecisionRequestSchema,
  ReviewResponseSchema,
} from './review-row.js';
export type {
  ReviewCreateRequest,
  ReviewModerationDecisionRequest,
  ReviewResponse,
} from './review-row.js';

export {
  SearchFacetsSchema,
  SearchProductsQuerySchema,
  SearchProductsResponseSchema,
} from './search-query.js';
export type {
  SearchFacets,
  SearchProductsQuery,
  SearchProductsResponse,
} from './search-query.js';

export {
  AdminReviewListQuerySchema,
  AdminReviewListResponseSchema,
} from './admin-review-query.js';
export type { AdminReviewListQuery, AdminReviewListResponse } from './admin-review-query.js';
