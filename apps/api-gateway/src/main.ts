import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger as PinoLogger } from 'nestjs-pino';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';

import { loadEnv, ConfigValidationError } from '@repo/config';
import { bootstrapOtel, shutdownOtel } from '@repo/observability';

import { AppModule } from './app.module.js';

/**
 * Production bootstrap for the LotusGift v2 modular-monolith gateway.
 *
 * Order matters:
 *   1. Validate env (fail fast on misconfig).
 *   2. Bootstrap OTEL BEFORE any module that should be instrumented
 *      gets imported — the auto-instrumentations patch `require()` at
 *      load time.
 *   3. NestFactory.create with `bodyParser: false` + `rawBody: true` so
 *      the Razorpay webhook (P10) can verify the signature against the
 *      exact bytes the carrier signed.
 *   4. Mount cookie-parser + helmet + CORS + JSON body parser on the
 *      Express adapter (the webhook route can opt OUT of JSON parsing
 *      via per-route middleware in P10).
 *   5. Swagger doc setup with `cleanupOpenApiDoc` for nestjs-zod DTOs.
 *   6. `app.listen(env.PORT)` + register SIGTERM/SIGINT for graceful
 *      shutdown of OTEL + the Nest app.
 */
async function bootstrap(): Promise<void> {
  let env;
  try {
    env = loadEnv(process.env);
  } catch (err) {
    if (err instanceof ConfigValidationError) {
      // eslint-disable-next-line no-console
      console.error(err.message);
      process.exit(1);
    }
    throw err;
  }

  const otel = bootstrapOtel({
    serviceName: env.OTEL_SERVICE_NAME,
    otlpEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT,
    otlpHeaders: env.OTEL_EXPORTER_OTLP_HEADERS,
    deploymentEnvironment: env.NODE_ENV,
  });
  otel.start();

  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    rawBody: true,
    bufferLogs: true,
  });

  app.useLogger(app.get(PinoLogger));
  app.use(cookieParser());

  // Helmet with CSP relaxed only on /api/docs* (Swagger UI ships inline
  // scripts/styles); the rest of the gateway stays under strict CSP.
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/docs')) {
      helmet({
        contentSecurityPolicy: {
          directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            'script-src': ["'self'", "'unsafe-inline'"],
            'style-src': ["'self'", "'unsafe-inline'", 'https:'],
            'img-src': ["'self'", 'data:', 'https:'],
          },
        },
      })(req, res, next);
      return;
    }
    helmet()(req, res, next);
  });

  app.enableCors({
    origin: resolveCorsOrigins(env.FRONTEND_URL, env.FRONTEND_URLS),
    credentials: true,
  });

  // Re-enable JSON parsing for every non-webhook route. The /api/payments/webhook
  // route (P10) will opt OUT via per-route raw-body capture so Razorpay
  // HMAC verification sees the original bytes.
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.setGlobalPrefix('api');
  app.enableShutdownHooks();

  // Swagger spec.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('LotusGift API')
    .setDescription('LotusGift v2 modular-monolith API (gateway shell)')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = cleanupOpenApiDoc(SwaggerModule.createDocument(app, swaggerConfig));
  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'api/docs-json',
  });

  await app.listen(env.PORT);

  const log = app.get(PinoLogger);
  log.log(`LotusGift API gateway listening on :${env.PORT}`);
  log.log(`Swagger UI: http://localhost:${env.PORT}/api/docs`);
  log.log(`OpenAPI JSON: http://localhost:${env.PORT}/api/docs-json`);

  const shutdown = async (signal: string) => {
    log.log(`Received ${signal}, shutting down gracefully…`);
    await app.close();
    await shutdownOtel(otel);
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

function resolveCorsOrigins(primary: string, secondary: string | undefined): string[] {
  const all = [primary, ...(secondary ?? '').split(',')]
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return Array.from(new Set(all));
}

void bootstrap();
