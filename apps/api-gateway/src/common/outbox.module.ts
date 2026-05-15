import { Global, Module } from '@nestjs/common';

import { OUTBOX_PROVIDER, OutboxLifecycle } from './outbox.provider.js';

/**
 * Global Nest module that registers the `OUTBOX_PORT` provider + the
 * `OutboxLifecycle` (start on bootstrap, stop on shutdown).
 *
 * Marked `@Global()` so every imported service module (auth-service,
 * vendor-service, future P7+ services) can `@Inject(OUTBOX_PORT)`
 * without re-declaring the provider in its own DI scope — Nest's
 * default behavior scopes providers to the declaring module + its
 * controllers; sibling/imported modules would otherwise see
 * `UnknownProviderException` at boot.
 *
 * Per `.cursor/rules/deployment-mode.mdc` the outbox is one of the
 * shared platform primitives every service relies on (the others —
 * Mongo connection, env, logger — are already wired globally via
 * `MongooseModule.forRoot`, `nestjs-pino`, etc.).
 */
@Global()
@Module({
  providers: [OUTBOX_PROVIDER, OutboxLifecycle],
  exports: [OUTBOX_PROVIDER],
})
export class OutboxModule {}
