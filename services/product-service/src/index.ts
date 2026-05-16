export { ProductServiceModule } from './product-service.module.js';

export {
  ANALYTICS_TOKEN,
  ENV_TOKEN,
  R2_CLIENT_TOKEN,
} from './product-service.tokens.js';

export {
  AtlasSearchSyncService,
  ImageService,
  NO_OP_ANALYTICS,
  ProductService,
  R2ImageClientImpl,
  ReviewService,
  SearchService,
  TaxonomyService,
  VariantService,
  createR2S3Client,
  type HeadResult,
  type PresignPutOptions,
  type PresignPutResult,
  type R2ImageClient,
} from './services/index.js';

export {
  ProductOwnershipGuard,
  REQUIRE_ROLE_KEY,
  RequireRole,
  RoleGuard,
  VendorActiveGuard,
} from './decorators/index.js';

export {
  AdminReviewController,
  ImageController,
  ProductController,
  ReviewController,
  SearchController,
  TaxonomyController,
  VariantController,
  mapImageToResponse,
  mapProductToResponse,
  mapReviewToResponse,
  mapVariantToResponse,
} from './controllers/index.js';

export {
  PRODUCT_IMAGE_MODEL,
  PRODUCT_MODEL,
  PRODUCT_REVIEW_MODEL,
  PRODUCT_SEARCH_INDEX_MODEL,
  type ProductDocument,
  type ProductImageDocument,
  type ProductReviewDocument,
  type ProductSearchIndexDocument,
} from './schemas/index.js';
