export { buildBetterAuthOptions } from './auth.factory.js';
export type { BetterAuthOptions, OrgKind } from './auth.factory.js';
export { AllowAnonymous, Session, CurrentUser, ALLOW_ANONYMOUS_KEY } from './decorators.js';
export { AUTH_INSTANCE, AUTH_MONGO_CLIENT, AUTH_NODE_HANDLER } from './auth.tokens.js';
export { ENV_TOKEN_NAME } from './env.token.js';

export { AuthGuard, nodeHeadersToFetchHeaders } from './auth.guard.js';
export { AuthServiceModule, type AuthNodeHandler } from './auth-service.module.js';
export {
  buildBetterAuthInstance,
  AUTH_DB_NAME,
  type BetterAuthInstance,
} from './build-better-auth-instance.js';
export { sendMsg91Otp } from './msg91.js';
