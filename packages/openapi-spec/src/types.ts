export type { RateLimitTier, KubbReactQueryHints } from './extensions.js';

/**
 * Whether an endpoint requires authentication. `true` (default for
 * service endpoints) means the gateway's `AuthGuard` runs; `false`
 * matches the `@AllowAnonymous` decorator at the controller.
 */
export type AuthRequirement = boolean;
