import {
  Inject,
  Logger,
  Module,
  type DynamicModule,
  type OnApplicationShutdown,
  type Provider,
} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import type { Env } from '@repo/config';
import { createServerAnalytics, type ServerAnalytics } from '@repo/analytics-sdk';
import { VendorServiceModule } from '@lotusgift/vendor-service';

import {
  AdminReviewController,
  ImageController,
  ProductController,
  ReviewController,
  SearchController,
  TaxonomyController,
  VariantController,
} from './controllers/index.js';
import {
  ProductOwnershipGuard,
  RoleGuard,
  VendorActiveGuard,
} from './decorators/index.js';
import {
  PRODUCT_IMAGE_MODEL,
  PRODUCT_MODEL,
  PRODUCT_REVIEW_MODEL,
  PRODUCT_SEARCH_INDEX_MODEL,
  ProductImageSchema,
  ProductReviewSchema,
  ProductSchema,
  ProductSearchIndexSchema,
} from './schemas/index.js';
import {
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
  type R2ImageClient,
} from './services/index.js';
import {
  ANALYTICS_TOKEN,
  ENV_TOKEN,
  R2_CLIENT_TOKEN,
} from './product-service.tokens.js';

const log = new Logger('ProductServiceModule');

/**
 * Async PostHog `ServerAnalytics` provider — mirrors the
 * `vendor-service` pattern (P6). Falls back to `NO_OP_ANALYTICS` when
 * `POSTHOG_KEY` isn't set so dev / test environments don't need the
 * real PostHog client.
 */
const ANALYTICS_PROVIDER: Provider = {
  provide: ANALYTICS_TOKEN,
  useFactory: (env: Env): ServerAnalytics => {
    const apiKey = (env as Env & { POSTHOG_KEY?: string }).POSTHOG_KEY;
    if (!apiKey) {
      log.warn(
        'POSTHOG_KEY unset — product-service analytics writes will no-op. Set it to capture events.',
      );
      return NO_OP_ANALYTICS;
    }
    return createServerAnalytics({
      apiKey,
      host: (env as Env & { POSTHOG_HOST?: string }).POSTHOG_HOST,
    });
  },
  inject: [ENV_TOKEN],
};

/**
 * R2 client provider. Returns a stub that throws on every operation
 * when R2 isn't configured (dev / test environments where the upload
 * endpoints aren't exercised); production fails fast at first image
 * upload attempt with the clear `R2_NOT_CONFIGURED` ProblemDetails
 * from `image.service.ts`.
 */
const R2_CLIENT_PROVIDER: Provider = {
  provide: R2_CLIENT_TOKEN,
  useFactory: (env: Env): R2ImageClient => {
    if (!env.R2_ENDPOINT || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
      log.warn(
        'R2 credentials not set — image upload endpoints will return R2_NOT_CONFIGURED until configured.',
      );
      return {
        presignPut: async () => {
          throw new Error('R2 not configured — set R2_ENDPOINT + R2_ACCESS_KEY_ID + R2_SECRET_ACCESS_KEY');
        },
        head: async () => {
          throw new Error('R2 not configured — set R2_ENDPOINT + R2_ACCESS_KEY_ID + R2_SECRET_ACCESS_KEY');
        },
      };
    }
    return new R2ImageClientImpl(createR2S3Client(env));
  },
  inject: [ENV_TOKEN],
};

@Module({})
export class ProductServiceModule implements OnApplicationShutdown {
  constructor(@Inject(ANALYTICS_TOKEN) private readonly analytics: ServerAnalytics) {}

  /**
   * Drain the PostHog Node SDK's in-memory queue before the gateway
   * exits. Mirrors the P6 `vendor-service` pattern + per
   * `.cursor/rules/analytics-instrumentation.mdc`.
   */
  async onApplicationShutdown(signal?: string): Promise<void> {
    log.log(`Flushing product-service analytics on ${signal ?? '<no signal>'}…`);
    await this.analytics.shutdown();
    log.log('product-service analytics shut down');
  }

  static forRoot(env: Env): DynamicModule {
    return {
      module: ProductServiceModule,
      imports: [
        // VendorServiceModule provides the `VendorService` that
        // `VendorActiveGuard` injects — legal cross-module dependency
        // per P7 D13 + `.cursor/rules/deployment-mode.mdc` (modular
        // monolith hosts every business module as a Nest library; the
        // public export surface IS the contract).
        VendorServiceModule.forRoot(env),
        MongooseModule.forFeature([
          { name: PRODUCT_MODEL, schema: ProductSchema },
          { name: PRODUCT_IMAGE_MODEL, schema: ProductImageSchema },
          { name: PRODUCT_REVIEW_MODEL, schema: ProductReviewSchema },
          { name: PRODUCT_SEARCH_INDEX_MODEL, schema: ProductSearchIndexSchema },
        ]),
      ],
      controllers: [
        ProductController,
        VariantController,
        ImageController,
        SearchController,
        TaxonomyController,
        ReviewController,
        AdminReviewController,
      ],
      providers: [
        { provide: ENV_TOKEN, useValue: env },
        ANALYTICS_PROVIDER,
        R2_CLIENT_PROVIDER,
        ProductService,
        VariantService,
        ImageService,
        ReviewService,
        SearchService,
        AtlasSearchSyncService,
        TaxonomyService,
        RoleGuard,
        ProductOwnershipGuard,
        VendorActiveGuard,
      ],
      exports: [
        ProductService,
        VariantService,
        ImageService,
        ReviewService,
        SearchService,
        TaxonomyService,
        AtlasSearchSyncService,
        RoleGuard,
        ProductOwnershipGuard,
        VendorActiveGuard,
        ENV_TOKEN,
        ANALYTICS_TOKEN,
      ],
    };
  }
}
