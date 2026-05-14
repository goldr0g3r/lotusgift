/**
 * DI token for the Better-Auth instance. Provided by `AuthServiceModule`
 * + consumed by `AuthGuard` + the route handler that mounts
 * `toNodeHandler(auth)` in `apps/api-gateway`.
 */
export const AUTH_INSTANCE = Symbol.for('@lotusgift/auth-service#BetterAuthInstance');

/** DI token for the raw MongoClient driving the Better-Auth adapter. */
export const AUTH_MONGO_CLIENT = Symbol.for('@lotusgift/auth-service#MongoClient');
