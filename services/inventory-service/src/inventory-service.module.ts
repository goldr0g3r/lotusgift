import {
  Global,
  Inject,
  Logger,
  Module,
  type DynamicModule,
  type OnApplicationShutdown,
  type Provider,
} from '@nestjs/common';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import type { Connection } from 'mongoose';

import type { Env } from '@repo/config';
import { createServerAnalytics, type ServerAnalytics } from '@repo/analytics-sdk';
import {
  RedisStockReadPort,
  RESERVATION_PORT,
  STOCK_READ_PORT,
  type ReservationPort,
} from '@repo/utils';
import { VendorServiceModule } from '@lotusgift/vendor-service';

import {
  AdjustmentController,
  AvailabilityController,
  LedgerController,
  LowStockConfigController,
  ReservationController,
  TransferController,
} from './controllers/index.js';
import { WarehouseOwnershipGuard, RoleGuard } from './decorators/index.js';
import {
  LOW_STOCK_CONFIG_MODEL,
  LowStockConfigSchema,
  RESERVATION_AUDIT_MODEL,
  ReservationAuditSchema,
  STOCK_LEDGER_MODEL,
  STOCK_SNAPSHOT_MODEL,
  StockLedgerSchema,
  StockSnapshotSchema,
  TRANSFER_MODEL,
  TransferSchema,
} from './schemas/index.js';
import {
  AdjustmentService,
  AvailabilityService,
  DeadStockDetectorService,
  InMemoryReservationService,
  LedgerService,
  NO_OP_ANALYTICS,
  RedisReservationService,
  ReorderDetectorService,
  ReservationService,
  ReservationSweeperService,
  SnapshotUpdaterService,
  TransferService,
} from './services/index.js';
import {
  ANALYTICS_TOKEN,
  ENV_TOKEN,
  RESERVATION_BACKEND_TOKEN,
} from './inventory-service.tokens.js';

const log = new Logger('InventoryServiceModule');

const ANALYTICS_PROVIDER: Provider = {
  provide: ANALYTICS_TOKEN,
  useFactory: (env: Env): ServerAnalytics => {
    const apiKey = (env as Env & { POSTHOG_KEY?: string }).POSTHOG_KEY;
    if (!apiKey) {
      log.warn('POSTHOG_KEY unset — inventory-service analytics will no-op');
      return NO_OP_ANALYTICS;
    }
    return createServerAnalytics({
      apiKey,
      host: (env as Env & { POSTHOG_HOST?: string }).POSTHOG_HOST,
    });
  },
  inject: [ENV_TOKEN],
};

function reservationBackendFactory(env: Env): ReservationPort {
  const isProd = env.NODE_ENV === 'production';
  const hasUpstash = Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
  if (isProd && !hasUpstash) {
    log.warn(
      'UPSTASH_REDIS_REST_URL unset in production — reservations use in-memory fallback (multi-instance drift risk)',
    );
  }
  if (!isProd || !hasUpstash) {
    return new InMemoryReservationService();
  }
  return new RedisReservationService(env);
}

@Global()
@Module({})
export class InventoryServiceModule implements OnApplicationShutdown {
  constructor(@Inject(ANALYTICS_TOKEN) private readonly analytics: ServerAnalytics) {}

  async onApplicationShutdown(signal?: string): Promise<void> {
    log.log(`Flushing inventory-service analytics on ${signal ?? '<no signal>'}…`);
    await this.analytics.shutdown();
  }

  static forRoot(env: Env): DynamicModule {
    const reservationProvider: Provider = {
      provide: RESERVATION_PORT,
      useFactory: () => reservationBackendFactory(env),
    };
    const reservationBackendProvider: Provider = {
      provide: RESERVATION_BACKEND_TOKEN,
      useFactory: () => reservationBackendFactory(env),
    };
    const stockReadProvider: Provider = {
      provide: STOCK_READ_PORT,
      useFactory: (connection: Connection, reservations: ReservationPort) =>
        new RedisStockReadPort(connection, reservations),
      inject: [getConnectionToken(), RESERVATION_PORT] as const,
    };

    return {
      module: InventoryServiceModule,
      imports: [
        ScheduleModule.forRoot(),
        VendorServiceModule.forRoot(env),
        MongooseModule.forFeature([
          { name: STOCK_LEDGER_MODEL, schema: StockLedgerSchema },
          { name: STOCK_SNAPSHOT_MODEL, schema: StockSnapshotSchema },
          { name: RESERVATION_AUDIT_MODEL, schema: ReservationAuditSchema },
          { name: TRANSFER_MODEL, schema: TransferSchema },
          { name: LOW_STOCK_CONFIG_MODEL, schema: LowStockConfigSchema },
        ]),
      ],
      controllers: [
        AvailabilityController,
        LedgerController,
        ReservationController,
        AdjustmentController,
        TransferController,
        LowStockConfigController,
      ],
      providers: [
        { provide: ENV_TOKEN, useValue: env },
        ANALYTICS_PROVIDER,
        reservationProvider,
        reservationBackendProvider,
        stockReadProvider,
        LedgerService,
        SnapshotUpdaterService,
        ReservationService,
        ReservationSweeperService,
        AvailabilityService,
        TransferService,
        AdjustmentService,
        ReorderDetectorService,
        DeadStockDetectorService,
        WarehouseOwnershipGuard,
        RoleGuard,
      ],
      exports: [
        LedgerService,
        ReservationService,
        AvailabilityService,
        TransferService,
        RESERVATION_PORT,
        STOCK_READ_PORT,
        ENV_TOKEN,
        ANALYTICS_TOKEN,
      ],
    };
  }
}
