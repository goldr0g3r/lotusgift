/**
 * DI token for the Better-Auth instance. Provided by `AuthServiceModule`
 * + consumed by `AuthGuard` + the route handler that mounts
 * `toNodeHandler(auth)` in `apps/api-gateway`.
 */
export const AUTH_INSTANCE = Symbol.for('@lotusgift/auth-service#BetterAuthInstance');

/** DI token for the raw MongoClient driving the Better-Auth adapter. */
export const AUTH_MONGO_CLIENT = Symbol.for('@lotusgift/auth-service#MongoClient');

/**
 * DI token for the pre-bound Express request handler that proxies
 * `/api/auth/*` to Better-Auth. Resolves to `toNodeHandler(auth)` —
 * provided by `AuthServiceModule` so the gateway's `main.ts` can mount
 * it without needing its own `better-auth` dependency (only the
 * auth-service package depends on better-auth).
 */
export const AUTH_NODE_HANDLER = Symbol.for('@lotusgift/auth-service#NodeHandler');
