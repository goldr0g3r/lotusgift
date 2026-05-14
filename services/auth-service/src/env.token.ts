/**
 * String DI token re-exported so consumers can pass an arbitrary Env
 * provider when wiring the module. `apps/api-gateway` binds the
 * already-loaded Env from `@repo/config` to this token.
 */
export const ENV_TOKEN_NAME = 'LOTUSGIFT_ENV';
