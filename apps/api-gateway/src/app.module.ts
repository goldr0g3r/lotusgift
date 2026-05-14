import { Module, type MiddlewareConsumer, type NestModule } from '@nestjs/common';
import { APP_FILTER, APP_PIPE, APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from 'nestjs-pino';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';

import { loadEnv, type Env } from '@repo/config';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { GlobalProblemDetailsFilter } from './common/problem-details.filter.js';
import { TraceIdMiddleware } from './common/trace-id.middleware.js';
import { OUTBOX_PROVIDER, OutboxLifecycle } from './common/outbox.provider.js';
import { ENV_TOKEN } from './common/config.tokens.js';
import { HealthController } from './health/health.controller.js';
import { LinksModule } from './links/links.module.js';

/**
 * Cached env instance. Loaded once at module construction time so every
 * provider (Mongo, Pino, Outbox) sees the same typed Env.
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
    AuthModule,
    LinksModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    { provide: ENV_TOKEN, useValue: env },
    { provide: APP_FILTER, useClass: GlobalProblemDetailsFilter },
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    OUTBOX_PROVIDER,
    OutboxLifecycle,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // TraceIdMiddleware MUST run first so every downstream log + filter
    // sees the AsyncLocalStorage scope.
    consumer.apply(TraceIdMiddleware).forRoutes('*');
  }
}
