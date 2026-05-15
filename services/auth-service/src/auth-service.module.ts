import {
  Inject,
  Logger,
  Module,
  type OnApplicationShutdown,
  type Provider,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MongoClient } from 'mongodb';
import type { RequestHandler } from 'express';

import type { Env } from '@repo/config';

import { AUTH_INSTANCE, AUTH_MONGO_CLIENT, AUTH_NODE_HANDLER } from './auth.tokens.js';
import { AuthGuard } from './auth.guard.js';
import {
  buildBetterAuthInstance,
  type BetterAuthInstance,
} from './build-better-auth-instance.js';
import { ENV_TOKEN_NAME } from './env.token.js';

const log = new Logger('AuthServiceModule');

/**
 * Async provider that opens a dedicated `MongoClient` for Better-Auth.
 *
 * Per Better-Auth's mongo adapter docs (citation #3 in
 * `docs/research/phase-5b-auth-runtime.md`), the adapter requires a
 * native `mongodb` driver `Db` + `MongoClient` — Mongoose's `Connection`
 * isn't supported. We open a separate connection here pointing at the
 * same Atlas cluster as `@repo/database`; the two clients are isolated
 * but share the cluster (within Atlas M0's connection limits).
 */
const AUTH_MONGO_CLIENT_PROVIDER: Provider = {
  provide: AUTH_MONGO_CLIENT,
  useFactory: async (env: Env): Promise<MongoClient> => {
    const client = new MongoClient(env.MONGODB_URI);
    await client.connect();
    log.log('Better-Auth MongoClient connected');
    return client;
  },
  inject: [ENV_TOKEN_NAME],
};

/**
 * Async provider that builds the Better-Auth instance via the
 * `buildBetterAuthInstance` async factory (which does the dynamic
 * ESM imports of `better-auth`, `better-auth/plugins`,
 * `better-auth/adapters/mongodb`, and `@better-auth/passkey`).
 */
const AUTH_INSTANCE_PROVIDER: Provider = {
  provide: AUTH_INSTANCE,
  useFactory: async (env: Env, client: MongoClient): Promise<BetterAuthInstance> => {
    const instance = await buildBetterAuthInstance(env, client);
    log.log('Better-Auth instance ready');
    return instance;
  },
  inject: [ENV_TOKEN_NAME, AUTH_MONGO_CLIENT],
};

/**
 * Async provider that exposes the Express request handler proxying
 * `/api/auth/*` to Better-Auth. The api-gateway's `main.ts` mounts
 * this on its Express adapter — keeping the `better-auth` dependency
 * confined to this package (gateway never imports `better-auth` itself).
 *
 * Dynamic import is required because `better-auth/node` is ESM-only;
 * see `docs/research/phase-5b-auth-runtime.md` D1.
 */
const AUTH_NODE_HANDLER_PROVIDER: Provider = {
  provide: AUTH_NODE_HANDLER,
  useFactory: async (auth: BetterAuthInstance): Promise<RequestHandler> => {
    const { toNodeHandler } = await import('better-auth/node');
    return toNodeHandler(auth) as unknown as RequestHandler;
  },
  inject: [AUTH_INSTANCE],
};

/**
 * AuthServiceModule registers the runtime Better-Auth instance + the
 * global default-deny `AuthGuard` and owns the lifecycle of the
 * dedicated `MongoClient` driving the Better-Auth adapter.
 *
 * Consumers (the api-gateway) must provide an `Env` instance bound to
 * the `ENV_TOKEN_NAME` token (a string token re-exported from this
 * package) so the async factories above can read configuration.
 *
 * @example
 * ```ts
 * @Module({
 *   imports: [AuthServiceModule],
 *   providers: [{ provide: ENV_TOKEN_NAME, useValue: env }],
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  providers: [
    AUTH_MONGO_CLIENT_PROVIDER,
    AUTH_INSTANCE_PROVIDER,
    AUTH_NODE_HANDLER_PROVIDER,
    AuthGuard,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [AUTH_INSTANCE, AUTH_MONGO_CLIENT, AUTH_NODE_HANDLER, AuthGuard],
})
export class AuthServiceModule implements OnApplicationShutdown {
  constructor(@Inject(AUTH_MONGO_CLIENT) private readonly client: MongoClient) {}

  async onApplicationShutdown(signal?: string): Promise<void> {
    log.log(`Closing Better-Auth MongoClient on ${signal ?? '<no signal>'}…`);
    await this.client.close();
    log.log('Better-Auth MongoClient closed');
  }
}
