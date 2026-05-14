/**
 * DI token for the typed environment object returned by
 * `@repo/config/loadEnv`. Provided once in `app.module.ts` so every
 * downstream service can `@Inject(ENV_TOKEN) env: Env`.
 */
export const ENV_TOKEN = Symbol.for('@lotusgift/api-gateway#Env');
