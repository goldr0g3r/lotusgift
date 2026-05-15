import {
  Inject,
  Logger,
  Module,
  type DynamicModule,
  type OnApplicationShutdown,
  type Provider,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MongoClient } from 'mongodb';

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
 * Adapter-agnostic Node request-handler shape. The api-gateway's
 * Express adapter accepts this signature directly; if the gateway
 * ever swaps to Fastify/uWebSockets the same handler can be wrapped
 * without re-typing.
 *
 * Kept intentionally narrow (no Express.RequestHandler import) so
 * `services/auth-service` doesn't take a dependency on `express`,
 * which would couple this Nest library to the gateway's chosen
 * platform adapter — see microservice-boundaries.mdc.
 */
export type AuthNodeHandler = (
  req: unknown,
  res: unknown,
  next?: (err?: unknown) => void,
) => void | Promise<void>;

/**
 * Async provider that opens a dedicated `MongoClient` for Better-Auth.
 *
 * Per Better-Auth's mongo adapter docs (citation #3 in
 * `docs/research/phase-5b-auth-runtime.md`), the adapter requires a
 * native `mongodb` driver `Db` + `MongoClient` — Mongoose's `Connection`
 * isn't supported. We open a separate connection here pointing at the
 * same Atlas cluster as `@repo/database`; the two clients are isolated
 * but share the cluster (within Atlas M0's connection limits).
 *
 * `serverSelectionTimeoutMS: 5_000` mirrors `@repo/database`'s default —
 * bad Atlas URI / network fails-fast at gateway bootstrap instead of
 * stalling for the driver default 30s.
 */
const AUTH_MONGO_CLIENT_PROVIDER: Provider = {
  provide: AUTH_MONGO_CLIENT,
  useFactory: async (env: Env): Promise<MongoClient> => {
    const client = new MongoClient(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5_000,
    });
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
 * Async provider that exposes the Node request handler proxying
 * `/api/auth/*` to Better-Auth. The api-gateway's `main.ts` mounts
 * this on its Express adapter — keeping the `better-auth` dependency
 * confined to this package (gateway never imports `better-auth` itself).
 *
 * Dynamic import is required because `better-auth/node` is ESM-only;
 * see `docs/research/phase-5b-auth-runtime.md` D1.
 */
const AUTH_NODE_HANDLER_PROVIDER: Provider = {
  provide: AUTH_NODE_HANDLER,
  useFactory: async (auth: BetterAuthInstance): Promise<AuthNodeHandler> => {
    const { toNodeHandler } = await import('better-auth/node');
    return toNodeHandler(auth) as unknown as AuthNodeHandler;
  },
  inject: [AUTH_INSTANCE],
};

/**
 * AuthServiceModule registers the runtime Better-Auth instance + the
 * global default-deny `AuthGuard` and owns the lifecycle of the
 * dedicated `MongoClient` driving the Better-Auth adapter.
 *
 * Consumers must call `AuthServiceModule.forRoot(env)` so the typed
 * `Env` is registered as a provider INSIDE this module's DI scope —
 * Nest's module-scoping doesn't propagate parent providers to imported
 * children, so a forRoot binding is the canonical pattern for passing
 * runtime configuration to an imported module's async providers.
 *
 * @example
 * ```ts
 * @Module({
 *   imports: [AuthServiceModule.forRoot(env)],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class AuthServiceModule implements OnApplicationShutdown {
  constructor(@Inject(AUTH_MONGO_CLIENT) private readonly client: MongoClient) {}

  static forRoot(env: Env): DynamicModule {
    return {
      module: AuthServiceModule,
      providers: [
        { provide: ENV_TOKEN_NAME, useValue: env },
        AUTH_MONGO_CLIENT_PROVIDER,
        AUTH_INSTANCE_PROVIDER,
        AUTH_NODE_HANDLER_PROVIDER,
        AuthGuard,
        { provide: APP_GUARD, useClass: AuthGuard },
      ],
      exports: [AUTH_INSTANCE, AUTH_MONGO_CLIENT, AUTH_NODE_HANDLER, AuthGuard],
    };
  }

  async onApplicationShutdown(signal?: string): Promise<void> {
    log.log(`Closing Better-Auth MongoClient on ${signal ?? '<no signal>'}…`);
    await this.client.close();
    log.log('Better-Auth MongoClient closed');
  }
}
