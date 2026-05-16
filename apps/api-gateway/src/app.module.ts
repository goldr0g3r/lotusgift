import { Module, type MiddlewareConsumer, type NestModule } from '@nestjs/common';
import { APP_FILTER, APP_PIPE, APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from 'nestjs-pino';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';

import { loadEnv, type Env } from '@repo/config';
import { STOCK_READ_PORT, StubStockReadPort } from '@repo/utils';
import { AuthServiceModule } from '@lotusgift/auth-service';
import { ProductServiceModule } from '@lotusgift/product-service';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { GlobalProblemDetailsFilter } from './common/problem-details.filter.js';
import { TraceIdMiddleware } from './common/trace-id.middleware.js';
import { OutboxModule } from './common/outbox.module.js';
import { ENV_TOKEN } from './common/config.tokens.js';
import { HealthController } from './health/health.controller.js';
import { LinksModule } from './links/links.module.js';

/**
 * Cached env instance. Loaded once at module construction time so every
 * provider (Mongo, Pino, Outbox, Better-Auth) sees the same typed Env.
 *
 * Throws `ConfigValidationError` synchronously if any required env var
 * is missing/invalid — gateway fails fast at bootstrap instead of
 * limping along with half-validated config.
 */
const env: Env = loadEnv(process.env);

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: env.LOG_LEVEL,
        autoLogging: true,
      },
    }),
    MongooseModule.forRoot(env.MONGODB_URI, {
      autoIndex: env.NODE_ENV !== 'production',
      serverSelectionTimeoutMS: 5_000,
    }),
    // forRoot(env) binds the Env provider INSIDE the AuthServiceModule's
    // DI scope so the async MongoClient + AUTH_INSTANCE + AUTH_NODE_HANDLER
    // factories can inject it. Nest's module-scoping does not flow
    // parent providers into imported children — see Nest fundamentals
    // docs on dynamic modules.
    AuthServiceModule.forRoot(env),
    // Global OutboxModule MUST be imported BEFORE any service module
    // that injects `OUTBOX_PORT` (vendor-service + every P7+ service).
    // Nest resolves @Global() providers across module boundaries; without
    // the @Global() wrapper the AppModule-scoped provider isn't visible
    // to imported children.
    OutboxModule,
    // ProductServiceModule (P7) — corporate-gifting taxonomy + R2
    // presigned image uploads + Atlas Search snapshot sync + admin
    // review moderation. Transitively imports `VendorServiceModule.forRoot(env)`
    // (P7 D13 cross-service-port pattern) — registering VendorServiceModule
    // here as well would call `forRoot` twice and duplicate every Mongo
    // schema + PostHog shutdown hook. The transitive import registers
    // all `VendorServiceModule` controllers (`VendorController`,
    // `OnboardingController`, etc.) at the gateway scope, so the public
    // vendor REST surface stays available.
    ProductServiceModule.forRoot(env),
    LinksModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    { provide: ENV_TOKEN, useValue: env },
    { provide: APP_FILTER, useClass: GlobalProblemDetailsFilter },
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    // First formalized cross-module port (P7 D12). Binds the stub at
    // MVP; P8 inventory-service swaps in `RedisStockReadPort` by
    // changing only this `useClass` entry. Documented in
    // `docs/architecture/cross-service-contracts.md`.
    { provide: STOCK_READ_PORT, useClass: StubStockReadPort },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // TraceIdMiddleware MUST run first so every downstream log + filter
    // sees the AsyncLocalStorage scope.
    consumer.apply(TraceIdMiddleware).forRoutes('*');
  }
}
