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

import {
  AdminApprovalController,
  OnboardingController,
  PayoutController,
  SlaScoreController,
  TierController,
  VendorController,
  WarehouseController,
} from './controllers/index.js';
import { RoleGuard, VendorOwnershipGuard } from './decorators/index.js';
import {
  KYC_SUBMISSION_MODEL,
  KycSubmissionSchema,
  PAYOUT_MODEL,
  PayoutSchema,
  TIER_HISTORY_MODEL,
  TierHistorySchema,
  VENDOR_MODEL,
  VendorSchema,
  WAREHOUSE_MODEL,
  WAREHOUSE_SLA_SCORE_MODEL,
  WarehouseSchema,
  WarehouseSlaScoreSchema,
} from './schemas/index.js';
import {
  GeocoderService,
  KycService,
  NO_OP_ANALYTICS,
  OnboardingService,
  PayoutService,
  SlaScoringService,
  TierService,
  VendorService,
  WarehouseService,
} from './services/index.js';
import {
  ANALYTICS_TOKEN,
  ENV_TOKEN,
  GEOCODER_FETCH_TOKEN,
} from './vendor-service.tokens.js';

const log = new Logger('VendorServiceModule');

/**
 * Async provider that builds the PostHog `ServerAnalytics` instance — or
 * returns the no-op fallback when `POSTHOG_KEY` isn't set. Mirrors the
 * pattern auth-service uses for `AUTH_INSTANCE` (P5b).
 */
const ANALYTICS_PROVIDER: Provider = {
  provide: ANALYTICS_TOKEN,
  useFactory: (env: Env): ServerAnalytics => {
    const apiKey = (env as Env & { POSTHOG_KEY?: string }).POSTHOG_KEY;
    if (!apiKey) {
      log.warn(
        'POSTHOG_KEY unset — vendor-service analytics writes will no-op. Set it to capture events.',
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

const FETCH_PROVIDER: Provider = {
  provide: GEOCODER_FETCH_TOKEN,
  useValue: fetch,
};

@Module({})
export class VendorServiceModule implements OnApplicationShutdown {
  constructor(@Inject(ANALYTICS_TOKEN) private readonly analytics: ServerAnalytics) {}

  /**
   * Drain the PostHog Node SDK's in-memory queue before the gateway
   * exits — otherwise queued vendor events (onboarding-started,
   * kyc-submitted, activated, warehouse-added, tier-upgraded) drop on
   * hard exit per `.cursor/rules/analytics-instrumentation.mdc`. No-op
   * fallback (when `POSTHOG_KEY` is unset) returns immediately.
   */
  async onApplicationShutdown(signal?: string): Promise<void> {
    log.log(`Flushing vendor-service analytics on ${signal ?? '<no signal>'}…`);
    await this.analytics.shutdown();
    log.log('vendor-service analytics shut down');
  }

  static forRoot(env: Env): DynamicModule {
    return {
      module: VendorServiceModule,
      imports: [
        MongooseModule.forFeature([
          { name: VENDOR_MODEL, schema: VendorSchema },
          { name: WAREHOUSE_MODEL, schema: WarehouseSchema },
          { name: KYC_SUBMISSION_MODEL, schema: KycSubmissionSchema },
          { name: PAYOUT_MODEL, schema: PayoutSchema },
          { name: TIER_HISTORY_MODEL, schema: TierHistorySchema },
          { name: WAREHOUSE_SLA_SCORE_MODEL, schema: WarehouseSlaScoreSchema },
        ]),
      ],
      controllers: [
        VendorController,
        OnboardingController,
        AdminApprovalController,
        WarehouseController,
        TierController,
        PayoutController,
        SlaScoreController,
      ],
      providers: [
        { provide: ENV_TOKEN, useValue: env },
        FETCH_PROVIDER,
        ANALYTICS_PROVIDER,
        GeocoderService,
        VendorService,
        OnboardingService,
        KycService,
        WarehouseService,
        TierService,
        PayoutService,
        SlaScoringService,
        RoleGuard,
        VendorOwnershipGuard,
      ],
      exports: [
        VendorService,
        WarehouseService,
        TierService,
        OnboardingService,
        KycService,
        PayoutService,
        SlaScoringService,
        RoleGuard,
        VendorOwnershipGuard,
        ENV_TOKEN,
        ANALYTICS_TOKEN,
      ],
    };
  }
}
