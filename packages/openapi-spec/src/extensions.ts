/**
 * OpenAPI 3.1 `x-*` specification extensions used across LotusGift v2's
 * generated spec. The OpenAPI Spec §4.9 allows arbitrary `x-` keys at
 * any object position; core OpenAPI tooling ignores them, but our
 * codegen (Kubb + the gateway's runtime) consumes them for hook
 * generation, rate-limit policy, and feature-flag gating.
 *
 * @see https://spec.openapis.org/oas/v3.1.0#specification-extensions
 */

/**
 * Rate-limit tier for an endpoint. Resolved at the gateway against the
 * Upstash Redis bucket per tier:
 * - `public` — strictest (10/min/IP)
 * - `authenticated` — moderate (60/min/user)
 * - `admin` — relaxed (300/min/user)
 * - `webhook` — separate signed-webhook policy (no rate limit; signature
 *    verified instead)
 */
export const X_RATE_LIMIT_TIER = 'x-rate-limit-tier' as const;
export type RateLimitTier = 'public' | 'authenticated' | 'admin' | 'webhook';

/**
 * Whether the endpoint requires authentication. Mirrors the @AllowAnonymous
 * decorator at the controller; surfaced into the OpenAPI spec for client
 * codegen + admin dashboard documentation.
 */
export const X_AUTH_REQUIRED = 'x-auth-required' as const;

/**
 * PostHog feature-flag key gating the endpoint. If set, the gateway
 * checks the flag against the requesting user/org and returns 404 when
 * disabled. Used for staged rollouts (P3b + P14 ship the flag plumbing).
 */
export const X_FEATURE_FLAG = 'x-feature-flag' as const;

/**
 * ISO date string after which the endpoint will be removed. Surfaced
 * into the OpenAPI spec for Swagger UI deprecation badges + client
 * codegen warnings.
 */
export const X_DEPRECATION_DATE = 'x-deprecation-date' as const;

/**
 * Hints consumed by `@kubb/plugin-react-query` (P4 wires Kubb into CI)
 * when emitting TanStack Query v5 hooks for an endpoint.
 *
 * @see https://kubb.dev/plugins/plugin-react-query/
 */
export const X_KUBB_REACT_QUERY = 'x-kubb-react-query' as const;
export interface KubbReactQueryHints {
  /** Emit `useInfiniteX` for cursor-paginated lists. */
  readonly infinite?: boolean;
  /** Emit `useSuspenseX` for the React 19 Suspense path. */
  readonly suspense?: boolean;
}

/**
 * Canonical catalog of the 5 LotusGift `x-*` extension keys. Kubb
 * plugins + the gateway runtime read keys from this catalog only.
 */
export const X_EXTENSIONS = {
  X_RATE_LIMIT_TIER,
  X_AUTH_REQUIRED,
  X_FEATURE_FLAG,
  X_DEPRECATION_DATE,
  X_KUBB_REACT_QUERY,
} as const;
